import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Public endpoint - no JWT required. Auth via opaque token in body.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { action, token, payload } = await req.json();
    if (!token || typeof token !== "string" || token.length < 16) return json({ error: "Token inválido" }, 400);

    const { data: proc, error } = await supabase
      .from("onboarding_processes")
      .select("id, organization_id, employee_id, status, portal_started_at, portal_submitted_at, portal_data")
      .eq("public_token", token)
      .maybeSingle();
    if (error || !proc) return json({ error: "Token inválido" }, 404);

    if (action === "get") {
      const { data: emp } = await supabase.from("employees").select("id, full_name, email").eq("id", proc.employee_id).single();
      const { data: org } = await supabase.from("organizations").select("id, name, logo_url").eq("id", proc.organization_id).single();
      const { data: tasks } = await supabase.from("onboarding_tasks").select("*").eq("process_id", proc.id).order("sort_order");
      const { data: documents } = await supabase.from("onboarding_documents").select("*").eq("process_id", proc.id).order("created_at");

      if (!proc.portal_started_at) {
        await supabase.from("onboarding_processes").update({ portal_started_at: new Date().toISOString(), status: "em_andamento", started_at: new Date().toISOString() }).eq("id", proc.id);
      }
      return json({ ok: true, process: proc, employee: emp, organization: org, tasks: tasks ?? [], documents: documents ?? [] });
    }

    if (action === "upload_document") {
      const { document_id, file_base64, file_name, content_type } = payload;
      const { data: doc } = await supabase.from("onboarding_documents").select("*").eq("id", document_id).eq("process_id", proc.id).single();
      if (!doc) return json({ error: "Documento não encontrado" }, 404);

      const bytes = Uint8Array.from(atob(file_base64), c => c.charCodeAt(0));
      const path = `${proc.organization_id}/${proc.id}/${doc.doc_type}-${Date.now()}-${file_name}`;
      const { error: upErr } = await supabase.storage.from("onboarding-docs").upload(path, bytes, {
        contentType: content_type ?? "application/octet-stream", upsert: true,
      });
      if (upErr) return json({ error: upErr.message }, 400);

      await supabase.from("onboarding_documents").update({
        file_path: path, file_name, status: "enviado", uploaded_at: new Date().toISOString(),
      }).eq("id", document_id);
      return json({ ok: true });
    }

    if (action === "save_data") {
      await supabase.from("onboarding_processes").update({ portal_data: payload?.data ?? {} }).eq("id", proc.id);
      return json({ ok: true });
    }

    if (action === "submit") {
      await supabase.from("onboarding_processes").update({
        portal_submitted_at: new Date().toISOString(),
        portal_data: payload?.data ?? proc.portal_data ?? {},
      }).eq("id", proc.id);
      return json({ ok: true });
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (e: any) {
    return json({ error: e.message ?? "Erro interno" }, 500);
  }
});
