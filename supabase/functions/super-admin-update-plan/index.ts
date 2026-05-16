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
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const check = await requirePlatformAdmin(admin, userId);
    if (!check.ok) return json({ error: check.error }, 403);

    const { organization_id, plan_slug, modules } = await req.json();
    if (!organization_id || !plan_slug) return json({ error: "organization_id e plan_slug obrigatórios" }, 400);

    const { data: plan, error: planErr } = await admin
      .from("plans")
      .select("id, slug, default_modules")
      .eq("slug", plan_slug)
      .single();
    if (planErr || !plan) return json({ error: "Plano não encontrado" }, 400);

    const { error: orgErr } = await admin.from("organizations").update({ plan_id: plan.id }).eq("id", organization_id);
    if (orgErr) return json({ error: orgErr.message }, 500);

    const modulesToEnable: string[] = modules?.length ? modules : (plan.default_modules ?? []);

    // Reset modules: disable all, then enable selected
    await admin.from("organization_modules").update({ enabled: false }).eq("organization_id", organization_id);

    for (const m of modulesToEnable) {
      await admin.from("organization_modules").upsert(
        { organization_id, module_key: m, enabled: true, enabled_by: userId, enabled_at: new Date().toISOString() },
        { onConflict: "organization_id,module_key" },
      );
    }

    await logPlatformAction(admin, userId, "client.plan_updated", organization_id, null, { plan_slug, modules: modulesToEnable }, req);
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
