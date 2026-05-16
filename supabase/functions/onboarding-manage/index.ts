import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const DEFAULT_DOCS = [
  { doc_type: "rg", doc_label: "RG (frente e verso)", required: true },
  { doc_type: "cpf", doc_label: "CPF", required: true },
  { doc_type: "ctps", doc_label: "Carteira de Trabalho (CTPS)", required: true },
  { doc_type: "comprovante_residencia", doc_label: "Comprovante de residência", required: true },
  { doc_type: "titulo_eleitor", doc_label: "Título de eleitor", required: false },
  { doc_type: "foto_3x4", doc_label: "Foto 3x4", required: true },
  { doc_type: "exame_admissional", doc_label: "Exame admissional (ASO)", required: true },
];

const DEFAULT_TASKS = [
  { title: "Envio de documentos", task_type: "documento", responsible_role: "colaborador", sort_order: 1 },
  { title: "Exame admissional", task_type: "exame", responsible_role: "colaborador", sort_order: 2 },
  { title: "Assinatura do contrato", task_type: "assinatura", responsible_role: "colaborador", sort_order: 3 },
  { title: "Integração cultural / boas-vindas", task_type: "treinamento", responsible_role: "rh", sort_order: 4 },
  { title: "Treinamento inicial da função", task_type: "treinamento", responsible_role: "gestor", sort_order: 5 },
  { title: "Configuração de acessos e equipamentos", task_type: "tarefa", responsible_role: "rh", sort_order: 6 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { action, payload } = await req.json();

    if (action === "create_process") {
      const { employee_id, expected_completion_at } = payload;
      const { data: emp } = await admin.from("employees").select("organization_id").eq("id", employee_id).single();
      if (!emp) return json({ error: "Colaborador não encontrado" }, 404);
      if (!await canManageOnboarding(admin, user.id, emp.organization_id)) return json({ error: "Sem permissão" }, 403);

      const token = crypto.randomUUID().replace(/-/g, "");

      const { data: proc, error: procErr } = await admin
        .from("onboarding_processes")
        .insert({
          organization_id: emp.organization_id,
          employee_id,
          expected_completion_at: expected_completion_at ?? null,
          status: "pendente",
          public_token: token,
          created_by: user.id,
        })
        .select()
        .single();
      if (procErr) return json({ error: procErr.message }, 400);

      await admin.from("onboarding_tasks").insert(
        DEFAULT_TASKS.map((t) => ({
          ...t,
          process_id: proc.id,
          organization_id: emp.organization_id,
          employee_id,
        }))
      );

      await admin.from("onboarding_documents").insert(
        DEFAULT_DOCS.map((d) => ({
          ...d,
          process_id: proc.id,
          organization_id: emp.organization_id,
          employee_id,
        }))
      );

      return json({ ok: true, process: proc });
    }

    if (action === "regenerate_token") {
      const { process_id } = payload;
      const { data: procRow } = await admin.from("onboarding_processes").select("organization_id").eq("id", process_id).single();
      if (!procRow) return json({ error: "Processo não encontrado" }, 404);
      if (!await canManageOnboarding(admin, user.id, procRow.organization_id)) return json({ error: "Sem permissão" }, 403);
      const token = crypto.randomUUID().replace(/-/g, "");
      const { error } = await admin.from("onboarding_processes").update({ public_token: token }).eq("id", process_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, token });
    }

    if (action === "review_document") {
      const { document_id, status, notes } = payload;
      const { data: docRow } = await admin.from("onboarding_documents").select("organization_id").eq("id", document_id).single();
      if (!docRow) return json({ error: "Documento não encontrado" }, 404);
      if (!await canManageOnboarding(admin, user.id, docRow.organization_id)) return json({ error: "Sem permissão" }, 403);
      const { error } = await admin.from("onboarding_documents").update({
        status, review_notes: notes ?? null, reviewed_at: new Date().toISOString(), reviewed_by: user.id,
      }).eq("id", document_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "toggle_task") {
      const { task_id, status } = payload;
      const { data: taskRow } = await admin.from("onboarding_tasks").select("organization_id").eq("id", task_id).single();
      if (!taskRow) return json({ error: "Etapa não encontrada" }, 404);
      if (!await canManageOnboarding(admin, user.id, taskRow.organization_id)) return json({ error: "Sem permissão" }, 403);
      const patch: any = { status };
      if (status === "concluido") { patch.completed_at = new Date().toISOString(); patch.completed_by = user.id; }
      const { error } = await admin.from("onboarding_tasks").update(patch).eq("id", task_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (e: any) {
    return json({ error: e.message ?? "Erro interno" }, 500);
  }
});

async function canManageOnboarding(admin: any, userId: string, orgId: string) {
  const { data } = await admin.rpc("has_org_permission", {
    _user_id: userId,
    _org_id: orgId,
    _permission: "onboarding.manage",
  });
  return Boolean(data);
}
