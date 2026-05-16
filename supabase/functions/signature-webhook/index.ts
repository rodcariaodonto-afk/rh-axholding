import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getSignatureProvider, getSignatureProviderForOrg } from "../_shared/signature-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-clicksign-hmac-sha256",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    // Parse genérico (sem token) só para identificar o envelope
    const probe = getSignatureProvider("clicksign", "probe");
    const parsed = probe.parseWebhook(body);
    if (!parsed.provider_envelope_id) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), { headers: corsHeaders });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: env } = await admin.from("signature_envelopes")
      .select("*").eq("provider_envelope_id", parsed.provider_envelope_id).single();
    if (!env) return new Response(JSON.stringify({ ok: true, not_found: true }), { headers: corsHeaders });

    // Re-parse usando provider per-org (caso queira reagir com chamadas ao Clicksign no futuro)
    await getSignatureProviderForOrg(admin, env.organization_id, "clicksign", "signature-webhook").catch(() => null);

    const update: any = { webhook_payload: body };
    if (parsed.status) update.status = parsed.status;
    if (parsed.status === "signed") {
      update.finished_at = new Date().toISOString();
      await admin.from("hr_documents").update({
        status: "assinado", signed_at: new Date().toISOString(),
      }).eq("id", env.document_id);
    }
    if (parsed.status === "refused") {
      await admin.from("hr_documents").update({ status: "recusado" }).eq("id", env.document_id);
    }
    await admin.from("signature_envelopes").update(update).eq("id", env.id);

    if (parsed.signed_signer_email) {
      await admin.from("signature_envelope_signers")
        .update({ status: "signed", signed_at: new Date().toISOString() })
        .eq("envelope_id", env.id).eq("email", parsed.signed_signer_email);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
