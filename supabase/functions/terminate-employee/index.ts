import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getRateLimitKey } from "../_shared/rate-limit.ts";
import { checkOrgRole } from "../_shared/check-org-role.ts";

const FUNCTION_NAME = "terminate-employee";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TerminateRequest {
  employee_id: string;
  termination_date: string;
  termination_reason: string;
  termination_decision?: string;
  termination_cause?: string;
  termination_cost?: number;
  termination_notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    // 1. Create clients
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // 2. Validate authenticated user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === SECURITY: Rate limiting (SEC-007) ===
    const rlKey = getRateLimitKey(req, user.id);
    const rl = await checkRateLimit(supabaseAdmin, rlKey, FUNCTION_NAME);
    if (!rl.allowed) return rl.response!;

    // 3. Validate admin role (org-scoped)
    const orgAuth = await checkOrgRole(supabaseAdmin, user.id, ["admin"]);
    if (!orgAuth.authorized || !orgAuth.organizationId) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem desligar colaboradores" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orgId = orgAuth.organizationId;

    // 4. Parse body
    const body: TerminateRequest = await req.json();
    const { 
      employee_id, 
      termination_date, 
      termination_reason,
      termination_decision,
      termination_cause,
      termination_cost,
      termination_notes
    } = body;

    console.log(`[${FUNCTION_NAME}][${requestId}] Termination request`);

    if (!employee_id || !termination_reason) {
      return new Response(
        JSON.stringify({ error: "employee_id e termination_reason são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Validate employee exists and belongs to same org
    const { data: employee } = await supabaseAdmin
      .from("employees")
      .select("id, full_name, email, organization_id")
      .eq("id", employee_id)
      .single();

    if (!employee) {
      return new Response(
        JSON.stringify({ error: "Colaborador não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (employee.organization_id !== orgId) {
      return new Response(
        JSON.stringify({ error: "Colaborador não pertence à sua organização" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Cannot terminate yourself
    if (employee_id === user.id) {
      return new Response(
        JSON.stringify({ error: "Você não pode desligar a si mesmo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Cannot terminate the last admin of the organization
    const { data: targetMember } = await supabaseAdmin
      .from("organization_members")
      .select("role_id")
      .eq("user_id", employee_id)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (targetMember?.role_id) {
      const { data: targetRole } = await supabaseAdmin
        .from("roles")
        .select("slug")
        .eq("id", targetMember.role_id)
        .single();

      if (targetRole?.slug === "admin") {
        const { data: adminCount } = await supabaseAdmin.rpc("count_org_admins", { _org_id: orgId });

        if (adminCount && adminCount <= 1) {
          return new Response(
            JSON.stringify({ error: "Não é possível desligar o único administrador da organização. Promova outro colaborador a administrador antes de prosseguir." }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    console.log(`[${FUNCTION_NAME}][${requestId}] Processing termination`);

    // 7. Register audit log BEFORE
    const { error: auditError } = await supabaseAdmin.rpc("insert_audit_log", {
      p_user_id: user.id,
      p_resource_type: "employee",
      p_resource_id: employee_id,
      p_action: "employee_terminated",
      p_changes: {
        employee_name: employee.full_name,
        employee_email: employee.email,
        termination_date,
        termination_reason,
        termination_decision,
        termination_cause,
        termination_cost,
        termination_notes,
      },
      p_is_sensitive: true,
    });

    if (auditError) {
      console.error(`[${FUNCTION_NAME}][${requestId}] Audit log warning:`, auditError.message);
    }

    // 8. Clear manager references
    
    await supabaseAdmin
      .from("employees")
      .update({ manager_id: null })
      .eq("manager_id", employee_id);

    await supabaseAdmin
      .from("departments")
      .update({ manager_id: null })
      .eq("manager_id", employee_id);

    // 9. Unlink devices
    
    await supabaseAdmin
      .from("devices")
      .update({ user_id: null, status: "available" })
      .eq("user_id", employee_id);

    // 10. Remove organization membership and roles (remove access)
    
    await supabaseAdmin
      .from("organization_members")
      .delete()
      .eq("user_id", employee_id);

    // Legacy user_roles table removed — roles are now in organization_members.role_id

    // 11. Update employee status to terminated
    
    const { error: updateError } = await supabaseAdmin
      .from("employees")
      .update({
        status: "terminated",
        termination_date: termination_date || new Date().toISOString().split("T")[0],
        termination_reason,
        termination_decision: termination_decision || null,
        termination_cause: termination_cause || null,
        termination_cost: termination_cost || 0,
        termination_notes: termination_notes || null,
      })
      .eq("id", employee_id);

    if (updateError) {
      console.error(`[${FUNCTION_NAME}][${requestId}] Update error:`, updateError);
      throw updateError;
    }

    // 12. Ban auth user (permanent ban - keeps user for history reference)
    
    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(employee_id, {
      ban_duration: "876600h", // ~100 years = permanent
    });

    if (banError) {
      console.error(`[${FUNCTION_NAME}][${requestId}] Ban error:`, banError);
      // Don't fail the operation, access already removed
    }

    console.log(`[${FUNCTION_NAME}][${requestId}] Termination completed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Colaborador desligado com sucesso",
        employee_name: employee.full_name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`[${FUNCTION_NAME}][${requestId}] Error:`, error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao desligar colaborador" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
