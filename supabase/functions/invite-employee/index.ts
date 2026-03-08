import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import { checkRateLimit, getRateLimitKey } from "../_shared/rate-limit.ts";
import { checkOrgRole } from "../_shared/check-org-role.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FUNCTION_NAME = "invite-employee";

// Schema de validação com Zod
const InvitePayloadSchema = z.object({
  // Obrigatórios
  email: z.string().email("Email inválido"),
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  
  // Opcionais - dados organizacionais
  department_id: z.string().uuid().optional().nullable(),
  manager_id: z.string().uuid().optional().nullable(),
  base_position_id: z.string().uuid().optional().nullable(),
  position_level_detail: z.enum([
    'estagiario', 'trainee', 'junior_i', 'junior_ii', 'junior_iii',
    'pleno_i', 'pleno_ii', 'pleno_iii', 'senior_i', 'senior_ii', 
    'senior_iii', 'especialista', 'lider'
  ]).optional().nullable(),
  unit_id: z.string().uuid().optional().nullable(),
  employment_type: z.enum(['full_time', 'part_time', 'contractor', 'intern', 'temporary']).optional(),
  
  // Opcionais - dados contratuais
  contract_type: z.enum(['clt', 'pj', 'estagio', 'temporario', 'aprendiz']).optional().nullable(),
  hire_date: z.string().optional().nullable(),
  base_salary: z.number().positive().optional().nullable(),
});

type InvitePayload = z.infer<typeof InvitePayloadSchema>;

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  
  console.log(`[${FUNCTION_NAME}][${requestId}] ${req.method}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          type: "about:blank",
          title: "Unauthorized",
          status: 401,
          detail: "Token de autenticação não fornecido"
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          type: "about:blank",
          title: "Unauthorized",
          status: 401,
          detail: "Token de autenticação inválido ou expirado"
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
      );
    }

    // 2. Verificar permissões (admin ou people) - org-scoped
    const orgAuth = await checkOrgRole(supabaseAdmin, user.id, ["admin", "people"]);
    if (!orgAuth.authorized || !orgAuth.organizationId) {
      return new Response(
        JSON.stringify({ 
          type: "about:blank",
          title: "Forbidden",
          status: 403,
          detail: "Você não tem permissão para convidar colaboradores"
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
      );
    }

    const orgId = orgAuth.organizationId;

    // === SECURITY: Rate limiting (SEC-007) ===
    const rlKey = getRateLimitKey(req, user.id);
    const rl = await checkRateLimit(supabaseAdmin, rlKey, FUNCTION_NAME);
    if (!rl.allowed) return rl.response!;

    // 3. Parse e validar input
    const body = await req.json();
    
    const parseResult = InvitePayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          type: "about:blank",
          title: "Validation Error",
          status: 400,
          detail: "Dados inválidos",
          errors: parseResult.error.errors
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
      );
    }

    const input: InvitePayload = parseResult.data;

    // 5. Validar domínio do email contra allowed_domains
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('allowed_domains, name, invite_from_email, invite_from_name')
      .eq('id', orgId)
      .single();

    const allowedDomains = org?.allowed_domains || [];
    const emailDomain = input.email.split('@')[1];

    if (allowedDomains.length > 0 && !allowedDomains.includes(emailDomain)) {
      return new Response(
        JSON.stringify({ 
          type: "about:blank",
          title: "Bad Request",
          status: 400,
          detail: `Apenas emails de domínios permitidos: ${allowedDomains.join(', ')}`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
      );
    }

    // 5b. Verificar se email já é colaborador ativo em OUTRA organização
    const { data: crossOrgEmployee } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('email', input.email)
      .eq('status', 'active')
      .neq('organization_id', orgId)
      .maybeSingle();

    if (crossOrgEmployee) {
      console.log(`[${FUNCTION_NAME}][${requestId}] Email already active in another org`);
      return new Response(
        JSON.stringify({ 
          type: "about:blank",
          title: "Conflict",
          status: 409,
          detail: "Este email já está vinculado a outra organização. Um colaborador só pode participar de uma organização por vez."
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
      );
    }

    // 6. Verificar se usuário já existe em auth.users
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(u => u.email === input.email);
    
    if (existingAuthUser) {
      // Check if this user has an ACTIVE employee in this org
      const { data: activeEmployee } = await supabaseAdmin
        .from('employees')
        .select('id, status')
        .eq('organization_id', orgId)
        .eq('email', input.email)
        .in('status', ['active'])
        .maybeSingle();

      if (activeEmployee) {
        return new Response(
          JSON.stringify({ 
            type: "about:blank",
            title: "Conflict",
            status: 409,
            detail: "Este email já está cadastrado como colaborador ativo na organização"
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
        );
      }

      // User exists in auth but has no active employee — delete the stale auth user
      // so we can send a fresh invite
      console.log(`[${FUNCTION_NAME}][${requestId}] Deleting stale auth user for re-invite: ${existingAuthUser.id}`);
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
      if (deleteAuthError) {
        console.error(`[${FUNCTION_NAME}][${requestId}] Failed to delete stale auth user:`, deleteAuthError.message);
        return new Response(
          JSON.stringify({ 
            type: "about:blank",
            title: "Internal Server Error",
            status: 500,
            detail: "Erro ao preparar reconvite. Tente novamente."
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
        );
      }

      // Also clean up any leftover employee records with pending/terminated status
      await supabaseAdmin
        .from('employees')
        .delete()
        .eq('organization_id', orgId)
        .eq('email', input.email)
        .in('status', ['pending', 'terminated']);
    }

    // 7. Verificar se já existe convite pendente
    const { data: existingPending } = await supabaseAdmin
      .from('pending_employees')
      .select('id, status')
      .eq('organization_id', orgId)
      .eq('email', input.email)
      .single();

    if (existingPending) {
      if (existingPending.status === 'invited') {
        // Allow re-invite even if status is 'invited' — user may have been deleted and re-invited
        console.log(`[${FUNCTION_NAME}][${requestId}] Re-inviting over existing 'invited' pending record`);
      }
      
      // Update existing pending record with new data and status 'invited'
      const { error: updateError } = await supabaseAdmin
        .from('pending_employees')
        .update({
          full_name: input.full_name,
          department_id: input.department_id || null,
          manager_id: input.manager_id || null,
          base_position_id: input.base_position_id || null,
          position_level_detail: input.position_level_detail || null,
          unit_id: input.unit_id || null,
          employment_type: input.employment_type || 'full_time',
          contract_type: input.contract_type || null,
          hire_date: input.hire_date || null,
          base_salary: input.base_salary || null,
          invited_by: user.id,
          status: 'invited',
          invite_sent_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPending.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // 8. Criar novo pending_employee com status 'invited' diretamente
      const { error: insertError } = await supabaseAdmin
        .from('pending_employees')
        .insert({
          organization_id: orgId,
          email: input.email,
          full_name: input.full_name,
          department_id: input.department_id || null,
          manager_id: input.manager_id || null,
          base_position_id: input.base_position_id || null,
          position_level_detail: input.position_level_detail || null,
          unit_id: input.unit_id || null,
          employment_type: input.employment_type || 'full_time',
          contract_type: input.contract_type || null,
          hire_date: input.hire_date || null,
          base_salary: input.base_salary || null,
          invited_by: user.id,
          status: 'invited',
          invite_sent_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }
    }

    // 9. Criar employee com status 'pending' para aparecer na lista
    // Usar um UUID temporário (será substituído pelo auth.uid quando aceitar)
    const tempEmployeeId = crypto.randomUUID();
    
    // Verificar se já existe employee pending para este email
    const { data: existingEmployee } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('organization_id', orgId)
      .eq('email', input.email)
      .eq('status', 'pending')
      .maybeSingle();

    if (!existingEmployee) {
      const { error: empError } = await supabaseAdmin
        .from('employees')
        .insert({
          id: tempEmployeeId,
          email: input.email,
          full_name: input.full_name,
          organization_id: orgId,
          department_id: input.department_id || null,
          manager_id: input.manager_id || null,
          base_position_id: input.base_position_id || null,
          position_level_detail: input.position_level_detail || null,
          unit_id: input.unit_id || null,
          employment_type: input.employment_type || 'full_time',
          status: 'pending',
        });

      if (empError) {
        console.error(`[${FUNCTION_NAME}][${requestId}] Employee create error:`, empError.message);
        // Não é fatal, seguir com o convite
      } else {
        console.log(`[${FUNCTION_NAME}][${requestId}] Employee created with pending status: ${tempEmployeeId}`);
        
        // Criar contrato se tiver dados
        if (input.hire_date) {
          await supabaseAdmin
            .from('employees_contracts')
            .insert({
              user_id: tempEmployeeId,
              contract_type: input.contract_type || 'clt',
              hire_date: input.hire_date,
              base_salary: input.base_salary || 0,
            });
        }
      }
    }

    // 10. Enviar convite via Supabase Auth (gerar link) + Resend se configurado
    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/+$/, "") || Deno.env.get("SITE_URL") || Deno.env.get("SUPABASE_URL")!.replace(".supabase.co", ".lovable.app");
    const acceptInviteUrl = `${origin}/accept-invite`;
    console.log(`[${FUNCTION_NAME}][${requestId}] Redirect URL: ${acceptInviteUrl}`);

    // Check if Resend is configured for this org
    const { getIntegrationSecret } = await import("../_shared/get-integration-secret.ts");
    const resendApiKey = await getIntegrationSecret(supabaseAdmin, orgId, "resend", {
      updateLastUsed: true,
      callerFunction: FUNCTION_NAME,
      userId: user.id,
    });

    if (resendApiKey && org?.invite_from_email) {
      // --- RESEND FLOW: generate link + send custom email ---
      console.log(`[${FUNCTION_NAME}][${requestId}] Using Resend for invite email`);

      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email: input.email,
        options: {
          data: { full_name: input.full_name },
          redirectTo: acceptInviteUrl,
        },
      });

      if (linkError) {
        console.error(`[${FUNCTION_NAME}][${requestId}] Generate link error:`, linkError.message);
        return new Response(
          JSON.stringify({ 
            type: "about:blank",
            title: "Internal Server Error",
            status: 500,
            detail: `Erro ao gerar link de convite: ${linkError.message}`
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
        );
      }

      // The generated link contains the token - we use it directly
      const inviteLink = linkData?.properties?.action_link;
      if (!inviteLink) {
        console.error(`[${FUNCTION_NAME}][${requestId}] No action_link in generateLink response`);
        return new Response(
          JSON.stringify({ 
            type: "about:blank",
            title: "Internal Server Error",
            status: 500,
            detail: "Erro ao gerar link de convite"
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
        );
      }

      // Send email via Resend
      const fromName = org.invite_from_name || org.name || "RH";
      const fromEmail = org.invite_from_email;

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [input.email],
          subject: `Você foi convidado para ${org.name}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <h2 style="color: #1a1a1a; margin-bottom: 16px;">Olá, ${input.full_name}! 👋</h2>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Você foi convidado para fazer parte de <strong>${org.name}</strong>.
              </p>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Clique no botão abaixo para aceitar o convite e criar sua conta:
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteLink}" target="_blank"
                   style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                  Aceitar Convite
                </a>
              </div>
              <p style="color: #888; font-size: 13px; line-height: 1.5;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br/>
                <a href="${inviteLink}" target="_blank" style="color: #2563eb; word-break: break-all;">${inviteLink}</a>
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
              <p style="color: #aaa; font-size: 12px;">
                Este convite foi enviado por ${fromName}. Se você não esperava este email, pode ignorá-lo.
              </p>
            </div>
          `,
        }),
      });

      if (!resendResponse.ok) {
        const resendError = await resendResponse.text();
        console.error(`[${FUNCTION_NAME}][${requestId}] Resend error:`, resendError);
        return new Response(
          JSON.stringify({ 
            type: "about:blank",
            title: "Internal Server Error",
            status: 500,
            detail: `Erro ao enviar email via Resend: ${resendResponse.status}`
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
        );
      }

      console.log(`[${FUNCTION_NAME}][${requestId}] Invite email sent via Resend`);
    } else {
      // --- FALLBACK: Supabase Auth default invite ---
      console.log(`[${FUNCTION_NAME}][${requestId}] Using Supabase Auth default invite`);
      
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        input.email, 
        {
          data: { full_name: input.full_name },
          redirectTo: acceptInviteUrl,
        }
      );

      if (inviteError) {
        console.error(`[${FUNCTION_NAME}][${requestId}] Invite error:`, inviteError.message);
        return new Response(
          JSON.stringify({ 
            type: "about:blank",
            title: "Internal Server Error",
            status: 500,
            detail: `Erro ao enviar convite: ${inviteError.message}`
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
        );
      }
    }

    // 11. Status já definido como 'invited' antes do inviteUserByEmail (race condition fix)

    console.log(`[${FUNCTION_NAME}][${requestId}] Invite sent successfully`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Convite enviado para ${input.email}`,
        data: {
          email: input.email,
          full_name: input.full_name,
          organization_name: org?.name,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    console.error(`[${FUNCTION_NAME}][${requestId}] Error:`, errorMessage);
    return new Response(
      JSON.stringify({ 
        type: "about:blank",
        title: "Internal Server Error",
        status: 500,
        detail: "Erro interno do servidor",
        requestId,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/problem+json" } }
    );
  }
});
