import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requirePlatformAdmin, logPlatformAction } from "../_shared/platform-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const token = auth.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const check = await requirePlatformAdmin(admin, userId);
    if (!check.ok) return json({ error: check.error }, 403);

    const body = await req.json();
    const {
      name,
      slug: providedSlug,
      cnpj,
      responsible_name,
      responsible_email,
      responsible_phone,
      plan_slug,
      status = "trial",
      internal_notes,
      modules,
    } = body ?? {};

    if (!name || !responsible_name || !responsible_email || !plan_slug) {
      return json({ error: "Campos obrigatórios: name, responsible_name, responsible_email, plan_slug" }, 400);
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(responsible_email)) {
      return json({ error: "Email inválido" }, 400);
    }

    const slug = (providedSlug && slugify(providedSlug)) || slugify(name);

    // Lookup plan
    const { data: plan, error: planErr } = await admin
      .from("plans")
      .select("id, slug, default_modules")
      .eq("slug", plan_slug)
      .single();
    if (planErr || !plan) return json({ error: "Plano não encontrado" }, 400);

    // Create organization
    const trial_ends_at = status === "trial" ? new Date(Date.now() + 14 * 86400_000).toISOString() : null;
    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .insert({
        name,
        slug,
        plan_id: plan.id,
        status,
        responsible_name,
        responsible_email,
        responsible_phone,
        internal_notes,
        trial_ends_at,
        is_active: true,
      })
      .select()
      .single();
    if (orgErr) return json({ error: `Falha ao criar org: ${orgErr.message}` }, 500);

    // Enable modules
    const modulesToEnable: string[] = modules?.length ? modules : (plan.default_modules ?? []);
    if (modulesToEnable.length > 0) {
      await admin.from("organization_modules").insert(
        modulesToEnable.map((m: string) => ({
          organization_id: org.id,
          module_key: m,
          enabled: true,
          enabled_by: userId,
        })),
      );
    }

    // Send invite for owner via invite-employee function
    let inviteResult: any = null;
    try {
      const inviteRes = await admin.functions.invoke("invite-employee", {
        body: {
          email: responsible_email,
          full_name: responsible_name,
          organization_id: org.id,
          as_owner: true,
        },
      });
      inviteResult = inviteRes;
    } catch (e) {
      console.error("[create-client] invite failed:", e);
    }

    await logPlatformAction(admin, userId, "client.created", org.id, null, {
      name, plan_slug, responsible_email, modules: modulesToEnable, status,
    }, req);

    return json({ ok: true, organization: org, invite: inviteResult });
  } catch (e) {
    console.error("[super-admin-create-client] error:", e);
    return json({ error: String(e) }, 500);
  }
});
