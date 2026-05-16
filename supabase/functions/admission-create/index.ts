import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkOrgRole } from "../_shared/check-org-role.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_CHECKLIST = [
  { title: "Coletar documentos pessoais", required: true },
  { title: "Validar dados bancários", required: true },
  { title: "Assinar contrato de trabalho", required: true },
  { title: "Agendar exame admissional (ASO)", required: true },
  { title: "Cadastrar no sistema", required: true },
  { title: "Boas-vindas e integração", required: false },
];

const DEFAULT_DOCS = [
  { doc_type: "rg", doc_label: "RG / Documento de identidade", required: true },
  { doc_type: "cpf", doc_label: "CPF", required: true },
  { doc_type: "ctps", doc_label: "Carteira de Trabalho (CTPS)", required: true },
  { doc_type: "comprovante_residencia", doc_label: "Comprovante de residência", required: true },
  { doc_type: "foto_3x4", doc_label: "Foto 3x4", required: true },
  { doc_type: "dados_bancarios", doc_label: "Dados bancários", required: true },
  { doc_type: "titulo_eleitor", doc_label: "Título de eleitor", required: false },
  { doc_type: "certificado_reservista", doc_label: "Certificado de reservista", required: false },
  { doc_type: "diploma", doc_label: "Diploma / Comprovante de escolaridade", required: false },
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
    if (!orgAuth.authorized || !orgAuth.organizationId) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const {
      candidate_id, candidate_name, candidate_email, candidate_phone,
      base_position_id, department_id, manager_id, unit_id,
      contract_type, expected_start_date, responsible_user_id, notes,
    } = body;

    if (!candidate_name || !candidate_email) {
      return new Response(JSON.stringify({ error: "Nome e e-mail do candidato são obrigatórios" }), { status: 400, headers: corsHeaders });
    }

    const inviteToken = crypto.randomUUID() + "-" + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: process, error: insertError } = await supabaseAdmin
      .from("admission_processes")
      .insert({
        organization_id: orgAuth.organizationId,
        candidate_id: candidate_id || null,
        candidate_name, candidate_email, candidate_phone,
        base_position_id, department_id, manager_id, unit_id,
        contract_type, expected_start_date,
        responsible_user_id: responsible_user_id || user.id,
        invite_token: inviteToken,
        invite_expires_at: expiresAt,
        notes,
        status: "draft",
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Seed checklist + documents
    await supabaseAdmin.from("admission_checklist_items").insert(
      DEFAULT_CHECKLIST.map((c, i) => ({ process_id: process.id, title: c.title, required: c.required, display_order: i }))
    );
    await supabaseAdmin.from("admission_documents").insert(
      DEFAULT_DOCS.map((d) => ({ process_id: process.id, doc_type: d.doc_type, doc_label: d.doc_label, required: d.required }))
    );

    await supabaseAdmin.from("admission_events").insert({
      process_id: process.id,
      event_type: "created",
      description: "Processo de admissão criado",
      actor_user_id: user.id,
    });

    return new Response(JSON.stringify({ ok: true, process }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("admission-create error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
