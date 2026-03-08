import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getRateLimitKey } from "../_shared/rate-limit.ts";

const FUNCTION_NAME = "change-user-role";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChangeRoleInput {
  target_user_id: string;
  new_role_id: string;
  reason: string;
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${FUNCTION_NAME}][${requestId}] ${req.method}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 204 });
  }

  try {
    // 1. Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ type: "about:blank", title: "Unauthorized", status: 401, detail: "Missing authorization header" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' }, status: 401 }
      );
    }

    // 2. Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 3. Get current user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ type: "about:blank", title: "Unauthorized", status: 401, detail: "Invalid token" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' }, status: 401 }
      );
    }
    const requesterId = claimsData.claims.sub;

    // === SECURITY: Rate limiting (SEC-007) ===
    const rlKey = getRateLimitKey(req, requesterId as string);
    const rl = await checkRateLimit(supabaseAdmin, rlKey, FUNCTION_NAME);
    if (!rl.allowed) return rl.response!;

    // 4. Parse and validate input
    const body: ChangeRoleInput = await req.json();

    if (!body.target_user_id || !body.new_role_id) {
      return new Response(
        JSON.stringify({ type: "about:blank", title: "Bad Request", status: 400, detail: "target_user_id e new_role_id são obrigatórios" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' }, status: 400 }
      );
    }

    if (!body.reason || body.reason.trim().length < 10) {
      return new Response(
        JSON.stringify({ type: "about:blank", title: "Bad Request", status: 400, detail: "Motivo deve ter pelo menos 10 caracteres" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' }, status: 400 }
      );
    }

    // 5. Self-modification check
    if (body.target_user_id === requesterId) {
      return new Response(
        JSON.stringify({ type: "about:blank", title: "Forbidden", status: 403, detail: "Você não pode alterar seu próprio perfil" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' }, status: 403 }
      );
    }

    // 6. Get requester's organization membership
    const { data: requesterMember, error: requesterError } = await supabase
      .from('organization_members')
      .select('organization_id, role_id, is_owner, role')
      .eq('user_id', requesterId)
      .single();

    if (requesterError || !requesterMember) {
      return new Response(
        JSON.stringify({ type: "about:blank", title: "Forbidden", status: 403, detail: "Você não pertence a nenhuma organização" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' }, status: 403 }
      );
    }

    const organizationId = requesterMember.organization_id;

    // 7. Check if requester is admin
    const { data: requesterRole } = await supabaseAdmin
      .from('roles')
      .select('slug')
      .eq('id', requesterMember.role_id)
      .single();

    const isRequesterAdmin = requesterRole?.slug === 'admin' || requesterMember.role === 'admin' || requesterMember.is_owner;
    
    if (!isRequesterAdmin) {
      return new Response(
        JSON.stringify({ type: "about:blank", title: "Forbidden", status: 403, detail: "Apenas administradores podem alterar perfis" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' }, status: 403 }
      );
    }

    // 8. Get target's membership in same org
    const { data: targetMember, error: targetError } = await supabaseAdmin
      .from('organization_members')
      .select('id, role_id, organization_id')
      .eq('user_id', body.target_user_id)
      .eq('organization_id', organizationId)
      .single();

    if (targetError || !targetMember) {
      return new Response(
        JSON.stringify({ type: "about:blank", title: "Not Found", status: 404, detail: "Usuário não encontrado na organização" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' }, status: 404 }
      );
    }

    // 9. Validate new role exists
    const { data: newRole, error: newRoleError } = await supabaseAdmin
      .from('roles')
      .select('id, slug, name, is_system')
      .eq('id', body.new_role_id)
      .single();

    if (newRoleError || !newRole) {
      return new Response(
        JSON.stringify({ type: "about:blank", title: "Not Found", status: 404, detail: "Perfil não encontrado" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' }, status: 404 }
      );
    }

    // 10. Get old role info
    const { data: oldRole } = await supabaseAdmin
      .from('roles')
      .select('id, slug, name')
      .eq('id', targetMember.role_id)
      .single();

    // 11. Last admin protection
    if (oldRole?.slug === 'admin' && newRole.slug !== 'admin') {
      const { data: adminCount } = await supabaseAdmin.rpc('count_org_admins', { _org_id: organizationId });
      
      if (adminCount && adminCount <= 1) {
        return new Response(
          JSON.stringify({ type: "about:blank", title: "Conflict", status: 409, detail: "Não é possível remover o último administrador" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' }, status: 409 }
        );
      }
    }

    // 12. Update role
    const { error: updateError } = await supabaseAdmin
      .from('organization_members')
      .update({ role_id: body.new_role_id })
      .eq('id', targetMember.id);

    if (updateError) {
      console.error(`[${FUNCTION_NAME}][${requestId}] Update error:`, updateError);
      throw updateError;
    }

    // 13. Record audit log
    const { error: auditError } = await supabaseAdmin
      .from('permission_audit_log')
      .insert({
        organization_id: organizationId,
        action: 'member_role_changed',
        target_user_id: body.target_user_id,
        target_role_id: body.new_role_id,
        old_value: oldRole ? { role_id: oldRole.id, slug: oldRole.slug, name: oldRole.name } : null,
        new_value: { role_id: newRole.id, slug: newRole.slug, name: newRole.name },
        reason: body.reason.trim(),
        changed_by: requesterId
      });

    if (auditError) {
      console.error(`[${FUNCTION_NAME}][${requestId}] Audit log error (non-fatal):`, auditError);
    }

    // 14. Success response
    console.log(`[${FUNCTION_NAME}][${requestId}] Sucesso`);
    return new Response(
      JSON.stringify({
        success: true,
        message: `Perfil alterado de ${oldRole?.name || 'N/A'} para ${newRole.name}`,
        old_role: oldRole,
        new_role: newRole
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    console.error(`[${FUNCTION_NAME}][${requestId}] Erro:`, errorMessage);
    return new Response(
      JSON.stringify({
        type: "about:blank",
        title: "Internal Server Error",
        status: 500,
        detail: errorMessage,
        requestId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/problem+json' }, status: 500 }
    );
  }
});
