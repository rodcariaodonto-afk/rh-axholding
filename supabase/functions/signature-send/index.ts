import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getSignatureProvider } from "../_shared/signature-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "no auth" }), { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauth" }), { status: 401, headers: corsHeaders });

    const { document_id, subject, message, signers, deadline_at, provider } = await req.json();
    if (!document_id || !signers?.length) {
      return new Response(JSON.stringify({ error: "document_id and signers required" }), { status: 400, headers: corsHeaders });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: doc, error: dErr } = await admin.from("hr_documents").select("*").eq("id", document_id).single();
    if (dErr || !doc) throw new Error(dErr?.message ?? "doc not found");

    // Permission
    const { data: hasPerm } = await admin.rpc("has_org_permission", {
      _user_id: user.id, _org_id: doc.organization_id, _permission: "signatures.send",
    });
    if (!hasPerm) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: corsHeaders });

    // Signed URL for the file
    if (!doc.file_path) throw new Error("document has no file");
    const { data: signed, error: sErr } = await admin.storage.from("employee-files").createSignedUrl(doc.file_path, 3600);
    if (sErr) throw sErr;

    const adapter = getSignatureProvider(provider);
    const envelope = await adapter.createEnvelope({
      organization_id: doc.organization_id,
      document_id: doc.id,
      subject: subject ?? doc.title,
      message,
      deadline_at,
      file_url: signed.signedUrl,
      file_name: doc.file_path.split("/").pop() ?? "documento.pdf",
      signers,
    });

    const { data: envRow, error: eErr } = await admin.from("signature_envelopes").insert({
      organization_id: doc.organization_id,
      document_id: doc.id,
      provider: adapter.name,
      provider_envelope_id: envelope.provider_envelope_id,
      status: "sent",
      subject,
      message,
      sent_at: new Date().toISOString(),
      deadline_at,
      created_by: user.id,
    }).select().single();
    if (eErr) throw eErr;

    if (envelope.signers.length) {
      await admin.from("signature_envelope_signers").insert(
        envelope.signers.map((s) => ({
          envelope_id: envRow.id,
          organization_id: doc.organization_id,
          email: s.email,
          full_name: s.full_name,
          signing_order: s.signing_order ?? 1,
          provider_signer_id: s.provider_signer_id,
          signing_url: s.signing_url,
        })),
      );
    }

    await admin.from("hr_documents").update({
      status: "aguardando_assinatura",
      signature_envelope_id: envRow.id,
      requires_signature: true,
    }).eq("id", doc.id);

    return new Response(JSON.stringify({ ok: true, envelope_id: envRow.id, provider: adapter.name }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
