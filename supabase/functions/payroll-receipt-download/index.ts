// Gera URL assinada para download de holerite + registra ack/log
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: corsHeaders });
    const supabaseUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: corsHeaders });

    const { receipt_id, acknowledge } = await req.json();

    const { data: receipt } = await supabaseAdmin.from("payroll_receipts")
      .select("id, file_path, organization_id, employee_id, published, batch_id, download_count")
      .eq("id", receipt_id).single();
    if (!receipt) return new Response(JSON.stringify({ error: "Recibo não encontrado" }), { status: 404, headers: corsHeaders });

    // Verifica permissão: dono OU RH/admin da org
    const isOwner = receipt.employee_id === user.id && receipt.published;
    let isRh = false;
    if (!isOwner) {
      const { data: member } = await supabaseAdmin.from("organization_members")
        .select("organization_id, roles(slug)")
        .eq("user_id", user.id)
        .eq("organization_id", receipt.organization_id)
        .maybeSingle();
      const slug = (member as { roles?: { slug?: string } } | null)?.roles?.slug;
      isRh = slug === "admin" || slug === "people";
    }
    if (!isOwner && !isRh) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), { status: 403, headers: corsHeaders });
    }

    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("payroll-receipts")
      .createSignedUrl(receipt.file_path, 300);
    if (sErr || !signed) throw sErr || new Error("Falha ao gerar URL");

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const ua = req.headers.get("user-agent") || null;

    const update: Record<string, unknown> = {
      download_count: receipt.download_count + 1,
      last_downloaded_at: new Date().toISOString(),
    };
    if (acknowledge && isOwner && !receipt.published === false) {
      update.acknowledged_at = new Date().toISOString();
      update.acknowledged_ip = ip;
      update.acknowledged_user_agent = ua;
    }
    await supabaseAdmin.from("payroll_receipts").update(update).eq("id", receipt_id);

    await supabaseAdmin.from("payroll_receipt_events").insert({
      receipt_id, batch_id: receipt.batch_id, organization_id: receipt.organization_id,
      event_type: acknowledge ? "acknowledged" : "downloaded",
      actor_user_id: user.id, metadata: { ip, user_agent: ua },
    });

    return new Response(JSON.stringify({ url: signed.signedUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("payroll-receipt-download error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
