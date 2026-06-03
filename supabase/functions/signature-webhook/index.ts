import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getSignatureProvider, getSignatureProviderForOrg } from "../_shared/signature-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-clicksign-hmac-sha256",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    // Read raw body once so we can verify HMAC then parse JSON
    const rawBody = await req.text();

    // === HMAC verification (Clicksign) ===
    const hmacSecret = Deno.env.get("CLICKSIGN_HMAC_SECRET");
    const providedSig = req.headers.get("x-clicksign-hmac-sha256")?.replace(/^sha256=/i, "").trim();

    if (hmacSecret) {
      if (!providedSig) {
        console.warn("signature-webhook: missing HMAC header");
        return new Response(JSON.stringify({ error: "Missing signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const expected = await hmacSha256Hex(hmacSecret, rawBody);
      if (expected.toLowerCase() !== providedSig.toLowerCase()) {
        console.warn("signature-webhook: invalid HMAC");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("signature-webhook: CLICKSIGN_HMAC_SECRET not configured — webhook accepted without verification. Configure the secret to enable signature verification.");
    }

    const body = JSON.parse(rawBody);

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
