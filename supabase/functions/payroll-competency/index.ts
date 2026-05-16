import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkOrgRole } from "../_shared/check-org-role.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action =
  | "generate_base_events"
  | "add_event"
  | "update_event"
  | "delete_event"
  | "clear_events"
  | "close"
  | "reopen"
  | "mark_paid"
  | "cancel";

// INSS empregado (tabela 2024)
function calcINSS(base: number): number {
  if (base <= 1412.00) return base * 0.075;
  if (base <= 2666.68) return 1412.00 * 0.075 + (base - 1412.00) * 0.09;
  if (base <= 4000.03) return 1412.00 * 0.075 + (2666.68 - 1412.00) * 0.09 + (base - 2666.68) * 0.12;
  if (base <= 7786.02) return 1412.00 * 0.075 + (2666.68 - 1412.00) * 0.09 + (4000.03 - 2666.68) * 0.12 + (base - 4000.03) * 0.14;
  return 1412.00 * 0.075 + (2666.68 - 1412.00) * 0.09 + (4000.03 - 2666.68) * 0.12 + (7786.02 - 4000.03) * 0.14;
}

function calcIRRF(base: number, inss: number): number {
  const calc = base - inss;
  if (calc <= 2259.20) return 0;
  if (calc <= 2826.65) return calc * 0.075 - 169.44;
  if (calc <= 3751.05) return calc * 0.15 - 381.44;
  if (calc <= 4664.68) return calc * 0.225 - 662.77;
  return calc * 0.275 - 896.00;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, 401);
    const supabaseUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: "Não autorizado" }, 401);

    const orgAuth = await checkOrgRole(supabaseAdmin, user.id, ["admin", "people"]);
    if (!orgAuth.authorized) return json({ error: "Sem permissão" }, 403);

    const body = await req.json() as { action: Action; competency_id: string; [k: string]: unknown };
    const { action, competency_id } = body;
    if (!action || !competency_id) return json({ error: "action e competency_id obrigatórios" }, 400);

    const { data: comp } = await supabaseAdmin.from("payroll_competencies")
      .select("*").eq("id", competency_id).single();
    if (!comp || comp.organization_id !== orgAuth.organizationId) return json({ error: "Competência não encontrada" }, 404);

    if (["fechada", "paga", "cancelada"].includes(comp.status) &&
        !["reopen", "mark_paid", "cancel"].includes(action)) {
      return json({ error: `Competência ${comp.status}; reabra antes de editar.` }, 400);
    }

    const orgId = comp.organization_id;

    if (action === "generate_base_events") {
      // Busca colaboradores ativos da organização + contratos
      const { data: employees, error: empErr } = await supabaseAdmin
        .from("employees")
        .select("id, full_name, email")
        .eq("organization_id", orgId)
        .eq("status", "active");
      if (empErr) throw empErr;

      const ids = (employees ?? []).map((e: any) => e.id);
      if (ids.length === 0) return json({ ok: true, created: 0 });

      const { data: contracts } = await supabaseAdmin
        .from("employees_contracts")
        .select("user_id, base_salary, transportation_voucher, meal_voucher, health_insurance, dental_insurance")
        .in("user_id", ids)
        .eq("is_active", true);

      // Limpa eventos com source = 'auto' desta competência antes de regenerar
      await supabaseAdmin.from("payroll_events")
        .delete().eq("competency_id", competency_id).eq("source", "auto");

      const rows: any[] = [];
      for (const c of contracts ?? []) {
        const salary = Number(c.base_salary ?? 0);
        if (salary <= 0) continue;
        const inss = round2(calcINSS(salary));
        const irrf = round2(calcIRRF(salary, inss));
        const fgts = round2(salary * 0.08);
        const vt = Number(c.transportation_voucher ?? 0);
        const vr = Number(c.meal_voucher ?? 0);
        const saude = Number(c.health_insurance ?? 0);
        const odonto = Number(c.dental_insurance ?? 0);

        const base = {
          organization_id: orgId, competency_id, employee_id: c.user_id,
          source: "auto", created_by: user.id, metadata: { generated_at: new Date().toISOString() },
        };
        rows.push({ ...base, kind: "provento",    code: "SALARIO",      description: "Salário base",       amount: salary, reference: 30 });
        rows.push({ ...base, kind: "desconto",    code: "INSS",         description: "INSS",               amount: inss });
        if (irrf > 0)
          rows.push({ ...base, kind: "desconto",  code: "IRRF",         description: "IRRF",               amount: irrf });
        if (vt > 0)
          rows.push({ ...base, kind: "desconto",  code: "VT_DESCONTO",  description: "Vale-transporte",    amount: round2(Math.min(salary * 0.06, vt)) });
        if (saude > 0)
          rows.push({ ...base, kind: "desconto",  code: "PLANO_SAUDE",  description: "Plano de saúde",     amount: saude });
        if (odonto > 0)
          rows.push({ ...base, kind: "desconto",  code: "PLANO_ODONTO", description: "Plano odontológico", amount: odonto });
        rows.push({ ...base, kind: "informativo", code: "FGTS",         description: "FGTS (informativo)", amount: fgts });
        rows.push({ ...base, kind: "base",        code: "BASE_INSS",    description: "Base INSS",          amount: salary });
        rows.push({ ...base, kind: "base",        code: "BASE_FGTS",    description: "Base FGTS",          amount: salary });
      }

      if (rows.length > 0) {
        const { error } = await supabaseAdmin.from("payroll_events").insert(rows);
        if (error) throw error;
      }

      // marca em processamento
      if (comp.status === "aberta") {
        await supabaseAdmin.from("payroll_competencies")
          .update({ status: "em_processamento" }).eq("id", competency_id);
      }

      return json({ ok: true, created: rows.length, employees: contracts?.length ?? 0 });
    }

    if (action === "add_event") {
      const { employee_id, kind, code, description, reference, amount, metadata } = body as any;
      const { error } = await supabaseAdmin.from("payroll_events").insert({
        organization_id: orgId, competency_id, employee_id, kind, code, description,
        reference, amount, source: "manual", created_by: user.id, metadata: metadata ?? {},
      });
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "update_event") {
      const { event_id, ...patch } = body as any;
      delete patch.action; delete patch.competency_id;
      const { error } = await supabaseAdmin.from("payroll_events").update(patch)
        .eq("id", event_id).eq("competency_id", competency_id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "delete_event") {
      const { event_id } = body as any;
      const { error } = await supabaseAdmin.from("payroll_events").delete()
        .eq("id", event_id).eq("competency_id", competency_id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "clear_events") {
      const { source } = body as any; // 'auto' | 'manual' | undefined
      let q = supabaseAdmin.from("payroll_events").delete().eq("competency_id", competency_id);
      if (source) q = q.eq("source", source);
      const { error } = await q;
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "close") {
      const { error } = await supabaseAdmin.from("payroll_competencies").update({
        status: "fechada", closed_at: new Date().toISOString(), closed_by: user.id,
      }).eq("id", competency_id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "reopen") {
      const { error } = await supabaseAdmin.from("payroll_competencies").update({
        status: "em_processamento", closed_at: null, paid_at: null,
      }).eq("id", competency_id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "mark_paid") {
      const { error } = await supabaseAdmin.from("payroll_competencies").update({
        status: "paga", paid_at: new Date().toISOString(),
      }).eq("id", competency_id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "cancel") {
      const { error } = await supabaseAdmin.from("payroll_competencies").update({
        status: "cancelada",
      }).eq("id", competency_id);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "action inválido" }, 400);
  } catch (err) {
    console.error("payroll-competency error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
