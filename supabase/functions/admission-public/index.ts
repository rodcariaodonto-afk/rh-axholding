// Endpoint público (sem auth) para o candidato preencher dados de admissão via token
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || (await req.clone().json().catch(() => ({})))?.token;
    if (!token) return new Response(JSON.stringify({ error: "Token obrigatório" }), { status: 400, headers: corsHeaders });

    const { data: proc } = await supabaseAdmin
      .from("admission_processes")
      .select("id, candidate_name, candidate_email, status, invite_expires_at, organization_id")
      .eq("invite_token", token)
      .maybeSingle();

    if (!proc) return new Response(JSON.stringify({ error: "Link inválido ou expirado" }), { status: 404, headers: corsHeaders });
    if (proc.invite_expires_at && new Date(proc.invite_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Link expirado" }), { status: 410, headers: corsHeaders });
    }
    if (["cancelled", "completed"].includes(proc.status)) {
      return new Response(JSON.stringify({ error: "Processo já encerrado" }), { status: 410, headers: corsHeaders });
    }

    // Buscar nome da org
    const { data: org } = await supabaseAdmin.from("organizations").select("name, logo_url").eq("id", proc.organization_id).single();

    if (req.method === "GET") {
      const { data: docs } = await supabaseAdmin.from("admission_documents")
        .select("id, doc_type, doc_label, required, status, file_name").eq("process_id", proc.id).order("doc_type");
      const { data: form } = await supabaseAdmin.from("admission_form_data").select("payload").eq("process_id", proc.id).maybeSingle();
      const { data: checklist } = await supabaseAdmin.from("admission_checklist_items")
        .select("id, title, description, status").eq("process_id", proc.id).order("display_order");
      return new Response(JSON.stringify({
        process: { id: proc.id, candidate_name: proc.candidate_name, candidate_email: proc.candidate_email, status: proc.status },
        organization: org,
        documents: docs || [],
        checklist: checklist || [],
        form_payload: form?.payload || {},
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { action, payload } = body;

      if (action === "save_form") {
        await supabaseAdmin.from("admission_form_data").upsert({
          process_id: proc.id, payload, submitted_at: new Date().toISOString(),
        }, { onConflict: "process_id" });
        await supabaseAdmin.from("admission_processes").update({ status: "in_progress" }).eq("id", proc.id).eq("status", "invited");
        await supabaseAdmin.from("admission_events").insert({
          process_id: proc.id, event_type: "form_saved", description: "Candidato salvou dados do formulário",
        });
        return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (action === "submit_document") {
        const { document_id, file_path, file_name, file_size } = payload;
        await supabaseAdmin.from("admission_documents").update({
          file_path, file_name, file_size, status: "submitted", submitted_at: new Date().toISOString(),
        }).eq("id", document_id).eq("process_id", proc.id);
        await supabaseAdmin.from("admission_events").insert({
          process_id: proc.id, event_type: "document_submitted", description: `Documento enviado: ${file_name}`,
          metadata: { document_id },
        });
        return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (action === "submit_for_review") {
        await supabaseAdmin.from("admission_processes").update({ status: "review" }).eq("id", proc.id);
        await supabaseAdmin.from("admission_events").insert({
          process_id: proc.id, event_type: "submitted_for_review", description: "Candidato enviou processo para revisão",
        });
        return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (action === "signed_upload_url") {
        const { document_id, file_name } = payload;
        const ext = (file_name as string).split(".").pop() || "bin";
        const path = `${proc.id}/${document_id}-${Date.now()}.${ext}`;
        const { data: signed, error } = await supabaseAdmin.storage.from("admission-uploads").createSignedUploadUrl(path);
        if (error) throw error;
        return new Response(JSON.stringify({ ...signed, path }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ error: "action inválido" }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Método não suportado" }), { status: 405, headers: corsHeaders });
  } catch (err) {
    console.error("admission-public error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
