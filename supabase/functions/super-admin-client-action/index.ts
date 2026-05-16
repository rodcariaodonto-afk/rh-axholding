import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requirePlatformAdmin, logPlatformAction } from "../_shared/platform-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const token = auth.replace("Bearer ", "");
    const { data: claims } = await supabase.auth.getClaims(token);
    if (!claims?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const check = await requirePlatformAdmin(admin, userId);
    if (!check.ok) return json({ error: check.error }, 403);

    const { organization_id, action, reason, days } = await req.json();
    if (!organization_id || !action) return json({ error: "organization_id e action são obrigatórios" }, 400);

    const updates: Record<string, unknown> = {};
    switch (action) {
      case "suspend":
        updates.status = "suspended";
        updates.suspended_at = new Date().toISOString();
        break;
      case "reactivate":
        updates.status = "active";
        updates.suspended_at = null;
        updates.scheduled_deletion_at = null;
        break;
      case "cancel":
        updates.status = "cancelled";
        break;
      case "schedule_deletion":
        updates.status = "pending_deletion";
        updates.scheduled_deletion_at = new Date(Date.now() + (days ?? 30) * 86400_000).toISOString();
        break;
      case "cancel_deletion":
        updates.status = "active";
        updates.scheduled_deletion_at = null;
        break;
      case "resend_invite": {
        // re-trigger invite for org's responsible email
        const { data: org } = await admin.from("organizations").select("responsible_email, responsible_name").eq("id", organization_id).single();
        if (org?.responsible_email) {
          await admin.functions.invoke("invite-employee", {
            body: { email: org.responsible_email, full_name: org.responsible_name, organization_id, as_owner: true },
          });
        }
        await logPlatformAction(admin, userId, "client.invite_resent", organization_id, null, { reason }, req);
        return json({ ok: true });
      }
      default:
        return json({ error: "Ação inválida" }, 400);
    }

    const { error } = await admin.from("organizations").update(updates).eq("id", organization_id);
    if (error) return json({ error: error.message }, 500);

    await logPlatformAction(admin, userId, `client.${action}`, organization_id, null, { reason, days, updates }, req);
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
