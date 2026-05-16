// Abstract signature provider adapter
// Allows swapping Clicksign / D4Sign / ZapSign / Manual without touching app code

export type SignatureProviderName = "clicksign" | "d4sign" | "zapsign" | "docusign" | "manual";

export interface ProviderSigner {
  email: string;
  full_name: string;
  signing_order?: number;
  role?: string;
}

export interface CreateEnvelopeInput {
  organization_id: string;
  document_id: string;
  subject: string;
  message?: string;
  signers: ProviderSigner[];
  file_url: string;          // signed URL or public URL
  file_name: string;
  deadline_at?: string;      // ISO
}

export interface CreateEnvelopeResult {
  provider_envelope_id: string;
  signers: Array<ProviderSigner & { provider_signer_id?: string; signing_url?: string }>;
  raw?: unknown;
}

export interface SignatureProvider {
  name: SignatureProviderName;
  createEnvelope(input: CreateEnvelopeInput): Promise<CreateEnvelopeResult>;
  parseWebhook(payload: unknown): {
    provider_envelope_id?: string;
    status?: "sent" | "partially_signed" | "signed" | "refused" | "cancelled" | "expired";
    signed_signer_email?: string;
  };
}

// ============================================================
// Clicksign adapter (Start plan / API v2)
// Docs: https://developers.clicksign.com
// ============================================================
class ClicksignProvider implements SignatureProvider {
  name: SignatureProviderName = "clicksign";
  constructor(private token: string, private baseUrl = "https://app.clicksign.com/api/v1") {}

  async createEnvelope(input: CreateEnvelopeInput): Promise<CreateEnvelopeResult> {
    // 1) Upload document
    const docRes = await fetch(`${this.baseUrl}/documents?access_token=${this.token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        document: {
          path: `/RHAXIS/${input.organization_id}/${input.file_name}`,
          content_base64: null,
          deadline_at: input.deadline_at,
          remind_interval: "3",
          auto_close: true,
          locale: "pt-BR",
          content_url: input.file_url,
        },
      }),
    });
    if (!docRes.ok) throw new Error(`Clicksign upload failed: ${await docRes.text()}`);
    const docJson = await docRes.json();
    const documentKey = docJson?.document?.key;

    const resultSigners: CreateEnvelopeResult["signers"] = [];

    // 2) Create signers + bind to document
    for (const s of input.signers) {
      const sRes = await fetch(`${this.baseUrl}/signers?access_token=${this.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signer: { email: s.email, name: s.full_name, auths: ["email"], delivery: "email" },
        }),
      });
      if (!sRes.ok) throw new Error(`Clicksign signer failed: ${await sRes.text()}`);
      const sJson = await sRes.json();
      const signerKey = sJson?.signer?.key;

      await fetch(`${this.baseUrl}/lists?access_token=${this.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          list: { document_key: documentKey, signer_key: signerKey, sign_as: s.role ?? "sign" },
        }),
      });

      resultSigners.push({ ...s, provider_signer_id: signerKey });
    }

    return { provider_envelope_id: documentKey, signers: resultSigners, raw: docJson };
  }

  parseWebhook(payload: any) {
    // Clicksign webhook: { event: { name, data }, document: {...} }
    const event = payload?.event?.name;
    const documentKey = payload?.document?.key;
    const map: Record<string, any> = {
      add_signer: "sent",
      sign: "partially_signed",
      auto_close: "signed",
      close: "signed",
      refusal: "refused",
      cancel: "cancelled",
      deadline: "expired",
    };
    return {
      provider_envelope_id: documentKey,
      status: map[event],
      signed_signer_email: payload?.document?.signers?.find((x: any) => x.signed_at)?.email,
    };
  }
}

// ============================================================
// Manual fallback (no provider)
// ============================================================
class ManualProvider implements SignatureProvider {
  name: SignatureProviderName = "manual";
  async createEnvelope(input: CreateEnvelopeInput): Promise<CreateEnvelopeResult> {
    return {
      provider_envelope_id: `manual_${crypto.randomUUID()}`,
      signers: input.signers,
    };
  }
  parseWebhook() { return {}; }
}

// ============================================================
// Factory
// ============================================================
export function getSignatureProvider(name?: SignatureProviderName): SignatureProvider {
  const provider = name ?? (Deno.env.get("SIGNATURE_PROVIDER") as SignatureProviderName) ?? "clicksign";
  if (provider === "clicksign") {
    const token = Deno.env.get("CLICKSIGN_API_TOKEN");
    if (!token) return new ManualProvider();
    return new ClicksignProvider(token);
  }
  return new ManualProvider();
}
