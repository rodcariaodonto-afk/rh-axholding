import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getRateLimitKey } from "../_shared/rate-limit.ts";
import { checkOrgRole } from "../_shared/check-org-role.ts";

const FUNCTION_NAME = "delete-employee";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteRequest {
  employee_id: string;
  confirmation_name: string;
  reason: "lgpd_request" | "cadastro_erro" | "other";
  reason_details?: string;
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

    // 3. Validate admin role (org-scoped)
    const orgAuth = await checkOrgRole(supabaseAdmin, user.id, ["admin"]);
    if (!orgAuth.authorized || !orgAuth.organizationId) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem excluir colaboradores permanentemente" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orgId = orgAuth.organizationId;

    // === SECURITY: Rate limiting (SEC-007) ===
    const rlKey = getRateLimitKey(req, user.id);
    const rl = await checkRateLimit(supabaseAdmin, rlKey, FUNCTION_NAME);
    if (!rl.allowed) return rl.response!;

    // 4. Parse body
    const body: DeleteRequest = await req.json();
    const { employee_id, confirmation_name, reason, reason_details } = body;

    console.log(`[${FUNCTION_NAME}][${requestId}] Delete request, reason: ${reason}`);

    if (!employee_id || !confirmation_name || !reason) {
      return new Response(
        JSON.stringify({ error: "employee_id, confirmation_name e reason são obrigatórios" }),
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

    // 6. Validate confirmation name
    const employeeName = employee.full_name?.toLowerCase().trim() || "";
    const confirmName = confirmation_name?.toLowerCase().trim() || "";
    
    if (confirmName !== employeeName) {
      return new Response(
        JSON.stringify({ error: "Nome de confirmação não confere" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Cannot delete yourself
    if (employee_id === user.id) {
      return new Response(
        JSON.stringify({ error: "Você não pode excluir a si mesmo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${FUNCTION_NAME}][${requestId}] Starting permanent deletion`);

    // 8. Register audit log BEFORE deletion (important for LGPD)
    const { error: auditError } = await supabaseAdmin.rpc("insert_audit_log", {
      p_user_id: user.id,
      p_resource_type: "employee",
      p_resource_id: employee_id,
      p_action: "employee_permanently_deleted",
      p_changes: {
        employee_name: employee.full_name,
        employee_email: employee.email,
        reason,
        reason_details,
        deleted_at: new Date().toISOString(),
      },
      p_is_sensitive: true,
    });

    if (auditError) {
      console.error(`[${FUNCTION_NAME}][${requestId}] Audit log warning:`, auditError.message);
    }

    // === CASCADE DELETION ===
    
    // 9. Get PDI IDs for cascading
    const { data: pdis } = await supabaseAdmin
      .from("pdis")
      .select("id")
      .eq("employee_id", employee_id);
    
    const pdiIds = pdis?.map(p => p.id) || [];

    if (pdiIds.length > 0) {
      // Delete PDI children first
      await supabaseAdmin.from("pdi_attachments").delete().in("pdi_id", pdiIds);
      await supabaseAdmin.from("pdi_logs").delete().in("pdi_id", pdiIds);
      await supabaseAdmin.from("pdi_comments").delete().in("pdi_id", pdiIds);
      await supabaseAdmin.from("pdi_goals").delete().in("pdi_id", pdiIds);
      
      // Delete PDIs
      await supabaseAdmin.from("pdis").delete().eq("employee_id", employee_id);
    }

    // 10. Clear references in other PDIs (manager_id, created_by, finalized_by)
    
    await supabaseAdmin
      .from("pdis")
      .update({ manager_id: null })
      .eq("manager_id", employee_id);
    
    await supabaseAdmin
      .from("pdis")
      .update({ created_by: null })
      .eq("created_by", employee_id);

    await supabaseAdmin
      .from("pdis")
      .update({ finalized_by: null })
      .eq("finalized_by", employee_id);

    // 11. Time off requests and balances
    
    await supabaseAdmin.from("time_off_requests").delete().eq("employee_id", employee_id);
    await supabaseAdmin.from("time_off_balances").delete().eq("employee_id", employee_id);

    // 12. Feedbacks (as sender AND receiver)
    
    await supabaseAdmin.from("feedbacks").delete().eq("sender_id", employee_id);
    await supabaseAdmin.from("feedbacks").delete().eq("receiver_id", employee_id);

    // 13. Other employee data
    
    await supabaseAdmin.from("profiler_history").delete().eq("employee_id", employee_id);
    
    await supabaseAdmin
      .from("devices")
      .update({ user_id: null, status: "available" })
      .eq("user_id", employee_id);
    
    await supabaseAdmin.from("employees_contracts").delete().eq("user_id", employee_id);
    await supabaseAdmin.from("employees_contact").delete().eq("user_id", employee_id);

    // 14. Clear manager references in other employees/departments
    
    await supabaseAdmin.from("employees").update({ manager_id: null }).eq("manager_id", employee_id);
    await supabaseAdmin.from("departments").update({ manager_id: null }).eq("manager_id", employee_id);

    // 15. Organization membership and roles
    
    await supabaseAdmin.from("organization_members").delete().eq("user_id", employee_id);
    // Legacy user_roles table removed — roles are now in organization_members.role_id

    // 16. Delete employee record
    
    const { error: deleteError } = await supabaseAdmin
      .from("employees")
      .delete()
      .eq("id", employee_id);

    if (deleteError) {
      console.error(`[${FUNCTION_NAME}][${requestId}] Delete employee error:`, deleteError);
      throw deleteError;
    }

    // 17. Delete auth user (last step)
    
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(employee_id);
    
    if (authDeleteError) {
      console.error(`[${FUNCTION_NAME}][${requestId}] Auth delete error:`, authDeleteError);
      // Don't fail - employee data already deleted
    }

    console.log(`[${FUNCTION_NAME}][${requestId}] Deletion completed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Colaborador excluído permanentemente",
        employee_name: employee.full_name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`[${FUNCTION_NAME}][${requestId}] Error:`, error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao excluir colaborador" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
