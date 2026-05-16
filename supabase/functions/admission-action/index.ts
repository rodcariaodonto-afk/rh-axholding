import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkOrgRole } from "../_shared/check-org-role.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "review_document" | "complete" | "cancel" | "resend_invite" | "update_checklist";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: corsHeaders });
    const supabaseUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: corsHeaders });

    const orgAuth = await checkOrgRole(supabaseAdmin, user.id, ["admin", "people"]);
    if (!orgAuth.authorized) return new Response(JSON.stringify({ error: "Sem permissão" }), { status: 403, headers: corsHeaders });

    const { action, process_id, ...payload } = await req.json() as { action: Action; process_id: string; [k: string]: unknown };
    if (!process_id || !action) return new Response(JSON.stringify({ error: "process_id e action obrigatórios" }), { status: 400, headers: corsHeaders });

    const { data: proc } = await supabaseAdmin
      .from("admission_processes").select("*").eq("id", process_id).single();
    if (!proc || proc.organization_id !== orgAuth.organizationId) {
      return new Response(JSON.stringify({ error: "Processo não encontrado" }), { status: 404, headers: corsHeaders });
    }

    if (action === "review_document") {
      const { document_id, status, review_notes } = payload as { document_id: string; status: string; review_notes?: string };
      await supabaseAdmin.from("admission_documents").update({
        status, review_notes, reviewed_by: user.id, reviewed_at: new Date().toISOString(),
      }).eq("id", document_id).eq("process_id", process_id);
      await supabaseAdmin.from("admission_events").insert({
        process_id, event_type: "document_reviewed",
        description: `Documento ${status === "approved" ? "aprovado" : "rejeitado"}`,
        actor_user_id: user.id, metadata: { document_id, status, review_notes },
      });
    } else if (action === "update_checklist") {
      const { item_id, status } = payload as { item_id: string; status: string };
      await supabaseAdmin.from("admission_checklist_items").update({
        status, done_at: status === "done" ? new Date().toISOString() : null, done_by: status === "done" ? user.id : null,
      }).eq("id", item_id).eq("process_id", process_id);
      await supabaseAdmin.from("admission_events").insert({
        process_id, event_type: "checklist_updated", actor_user_id: user.id, metadata: { item_id, status },
      });
    } else if (action === "resend_invite") {
      const newExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin.from("admission_processes").update({
        invite_expires_at: newExpiry, invite_sent_at: new Date().toISOString(),
        status: proc.status === "draft" ? "invited" : proc.status,
      }).eq("id", process_id);
      await supabaseAdmin.from("admission_events").insert({
        process_id, event_type: "invite_resent", actor_user_id: user.id,
      });
    } else if (action === "cancel") {
      const { reason } = payload as { reason?: string };
      await supabaseAdmin.from("admission_processes").update({
        status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: reason,
      }).eq("id", process_id);
      await supabaseAdmin.from("admission_events").insert({
        process_id, event_type: "cancelled", actor_user_id: user.id, metadata: { reason },
      });
    } else if (action === "complete") {
      // Validar: todos docs obrigatórios aprovados e checklist concluído
      const { data: docs } = await supabaseAdmin.from("admission_documents").select("required,status").eq("process_id", process_id);
      const pendingDocs = (docs || []).filter((d) => d.required && d.status !== "approved");
      if (pendingDocs.length > 0) {
        return new Response(JSON.stringify({ error: `${pendingDocs.length} documento(s) obrigatório(s) pendente(s)` }), { status: 400, headers: corsHeaders });
      }

      // Criar/atualizar colaborador
      const { data: existingEmployee } = await supabaseAdmin.from("employees")
        .select("id").eq("email", proc.candidate_email).eq("organization_id", proc.organization_id).maybeSingle();

      let employeeId = existingEmployee?.id;
      if (!employeeId) {
        const { data: newEmp, error: empErr } = await supabaseAdmin.from("employees").insert({
          email: proc.candidate_email,
          full_name: proc.candidate_name,
          organization_id: proc.organization_id,
          department_id: proc.department_id,
          manager_id: proc.manager_id,
          unit_id: proc.unit_id,
          base_position_id: proc.base_position_id,
          status: "pending",
          employment_type: proc.contract_type || "full_time",
        }).select().single();
        if (empErr) throw empErr;
        employeeId = newEmp.id;
      }

      await supabaseAdmin.from("admission_processes").update({
        status: "completed", completed_at: new Date().toISOString(), employee_id: employeeId,
      }).eq("id", process_id);

      await supabaseAdmin.from("admission_events").insert({
        process_id, event_type: "completed",
        description: "Admissão concluída e colaborador criado",
        actor_user_id: user.id, metadata: { employee_id: employeeId },
      });
    } else {
      return new Response(JSON.stringify({ error: "action inválido" }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("admission-action error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
