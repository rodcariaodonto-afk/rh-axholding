import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkOrgRole } from "../_shared/check-org-role.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action =
  | "create"
  | "advance_status"
  | "update_checklist_item"
  | "add_checklist_item"
  | "remove_checklist_item"
  | "save_details"
  | "link_exam_schedule"
  | "link_signature"
  | "complete"
  | "cancel";

const DEFAULT_CHECKLIST = [
  { title: "Comunicado de aviso prévio assinado", required: true, sort_order: 1 },
  { title: "Agendar exame demissional (ASO)", required: true, sort_order: 2 },
  { title: "Realizar cálculos rescisórios", required: true, sort_order: 3 },
  { title: "Gerar TRCT (Termo de Rescisão)", required: true, sort_order: 4 },
  { title: "Coletar assinaturas", required: true, sort_order: 5 },
  { title: "Devolução de EPIs / equipamentos / crachá", required: false, sort_order: 6 },
  { title: "Bloquear acessos (e-mail, sistemas, VPN)", required: true, sort_order: 7 },
  { title: "Confirmar pagamento das verbas rescisórias", required: true, sort_order: 8 },
  { title: "Entregar guias (FGTS / Seguro Desemprego)", required: false, sort_order: 9 },
  { title: "Arquivar documentação no prontuário", required: true, sort_order: 10 },
];

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

    const orgId = orgAuth.organizationId!;
    const body = await req.json() as { action: Action; [k: string]: unknown };
    const action = body.action;

    if (action === "create") {
      const {
        employee_id, termination_reason, termination_decision, termination_cause,
        notice_type, notice_start_date, termination_date, responsible_user_id, notes,
      } = body as any;
      if (!employee_id) return new Response(JSON.stringify({ error: "employee_id obrigatório" }), { status: 400, headers: corsHeaders });

      const { data: emp } = await supabaseAdmin.from("employees").select("organization_id").eq("id", employee_id).single();
      if (!emp || emp.organization_id !== orgId) {
        return new Response(JSON.stringify({ error: "Colaborador não pertence à sua organização" }), { status: 403, headers: corsHeaders });
      }

      // Bloqueia processo duplicado em andamento
      const { data: existing } = await supabaseAdmin.from("termination_processes")
        .select("id").eq("employee_id", employee_id)
        .not("status", "in", "(concluido,cancelado)").maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ error: "Já existe processo em andamento para este colaborador", process_id: existing.id }), { status: 409, headers: corsHeaders });
      }

      const { data: proc, error } = await supabaseAdmin.from("termination_processes").insert({
        organization_id: orgId,
        employee_id, termination_reason, termination_decision, termination_cause,
        notice_type, notice_start_date, termination_date,
        responsible_user_id: responsible_user_id ?? user.id, notes,
        created_by: user.id, status: "iniciado",
      }).select().single();
      if (error) throw error;

      const items = DEFAULT_CHECKLIST.map((it) => ({ ...it, process_id: proc.id, status: "pending" }));
      await supabaseAdmin.from("termination_checklist_items").insert(items);
      await supabaseAdmin.from("termination_events").insert({
        process_id: proc.id, event_type: "created", actor_user_id: user.id,
        metadata: { termination_reason, notice_type },
      });

      return json({ ok: true, process: proc });
    }

    // demais ações precisam do process_id
    const { process_id } = body as any;
    if (!process_id) return new Response(JSON.stringify({ error: "process_id obrigatório" }), { status: 400, headers: corsHeaders });

    const { data: proc } = await supabaseAdmin.from("termination_processes").select("*").eq("id", process_id).single();
    if (!proc || proc.organization_id !== orgId) {
      return new Response(JSON.stringify({ error: "Processo não encontrado" }), { status: 404, headers: corsHeaders });
    }

    if (action === "advance_status") {
      const { status } = body as any;
      const allowed = ["iniciado","aviso_previo","exames","calculos","documentos","assinatura","homologacao","pagamento","concluido","cancelado"];
      if (!allowed.includes(status)) return new Response(JSON.stringify({ error: "status inválido" }), { status: 400, headers: corsHeaders });
      await supabaseAdmin.from("termination_processes").update({ status }).eq("id", process_id);
      await supabaseAdmin.from("termination_events").insert({
        process_id, event_type: "status_changed", actor_user_id: user.id, metadata: { from: proc.status, to: status },
      });
      return json({ ok: true });
    }

    if (action === "update_checklist_item") {
      const { item_id, status } = body as any;
      await supabaseAdmin.from("termination_checklist_items").update({
        status, done_at: status === "done" ? new Date().toISOString() : null,
        done_by: status === "done" ? user.id : null,
      }).eq("id", item_id).eq("process_id", process_id);
      await supabaseAdmin.from("termination_events").insert({
        process_id, event_type: "checklist_updated", actor_user_id: user.id, metadata: { item_id, status },
      });
      return json({ ok: true });
    }

    if (action === "add_checklist_item") {
      const { title, description, required } = body as any;
      await supabaseAdmin.from("termination_checklist_items").insert({
        process_id, title, description, required: required ?? false, status: "pending", sort_order: 999,
      });
      return json({ ok: true });
    }

    if (action === "remove_checklist_item") {
      const { item_id } = body as any;
      await supabaseAdmin.from("termination_checklist_items").delete().eq("id", item_id).eq("process_id", process_id);
      return json({ ok: true });
    }

    if (action === "save_details") {
      const details = body.details as Record<string, unknown>;
      // upsert termination_details para o employee
      const { data: existing } = await supabaseAdmin.from("termination_details")
        .select("id").eq("employee_id", proc.employee_id).maybeSingle();

      const payload: Record<string, unknown> = {
        ...details, organization_id: orgId, employee_id: proc.employee_id,
      };
      let detailsId = existing?.id ?? null;
      if (existing) {
        const { error } = await supabaseAdmin.from("termination_details").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabaseAdmin.from("termination_details").insert(payload).select().single();
        if (error) throw error;
        detailsId = inserted.id;
      }
      await supabaseAdmin.from("termination_processes").update({ termination_details_id: detailsId }).eq("id", process_id);
      await supabaseAdmin.from("termination_events").insert({
        process_id, event_type: "details_saved", actor_user_id: user.id, metadata: { keys: Object.keys(details) },
      });
      return json({ ok: true, details_id: detailsId });
    }

    if (action === "link_exam_schedule") {
      const { schedule_id, exam_id } = body as any;
      await supabaseAdmin.from("termination_processes").update({
        exam_schedule_id: schedule_id ?? null, exam_id: exam_id ?? null,
      }).eq("id", process_id);
      await supabaseAdmin.from("termination_events").insert({
        process_id, event_type: "exam_linked", actor_user_id: user.id, metadata: { schedule_id, exam_id },
      });
      return json({ ok: true });
    }

    if (action === "link_signature") {
      const { signature_envelope_id } = body as any;
      await supabaseAdmin.from("termination_processes").update({ signature_envelope_id }).eq("id", process_id);
      await supabaseAdmin.from("termination_events").insert({
        process_id, event_type: "signature_linked", actor_user_id: user.id, metadata: { signature_envelope_id },
      });
      return json({ ok: true });
    }

    if (action === "complete") {
      const { data: items } = await supabaseAdmin.from("termination_checklist_items")
        .select("required,status").eq("process_id", process_id);
      const pending = (items || []).filter((i: any) => i.required && i.status !== "done");
      if (pending.length > 0) {
        return new Response(JSON.stringify({ error: `${pending.length} item(ns) obrigatório(s) pendente(s)` }), { status: 400, headers: corsHeaders });
      }

      await supabaseAdmin.from("termination_processes").update({
        status: "concluido", completed_at: new Date().toISOString(),
      }).eq("id", process_id);

      // marca colaborador como desligado
      const updates: Record<string, unknown> = { status: "terminated" };
      if (proc.termination_date) updates.termination_date = proc.termination_date;
      if (proc.termination_reason) updates.termination_reason = proc.termination_reason;
      if (proc.termination_decision) updates.termination_decision = proc.termination_decision;
      if (proc.termination_cause) updates.termination_cause = proc.termination_cause;
      await supabaseAdmin.from("employees").update(updates).eq("id", proc.employee_id);

      await supabaseAdmin.from("termination_events").insert({
        process_id, event_type: "completed", actor_user_id: user.id,
      });
      return json({ ok: true });
    }

    if (action === "cancel") {
      const { reason } = body as any;
      await supabaseAdmin.from("termination_processes").update({
        status: "cancelado", cancelled_at: new Date().toISOString(), cancelled_reason: reason,
      }).eq("id", process_id);
      await supabaseAdmin.from("termination_events").insert({
        process_id, event_type: "cancelled", actor_user_id: user.id, metadata: { reason },
      });
      return json({ ok: true });
    }

    return new Response(JSON.stringify({ error: "action inválido" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    console.error("termination-process error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
