import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Não autenticado" }, 401);

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    // Resolve organization
    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member) return json({ error: "Sem organização" }, 403);
    const orgId = member.organization_id as string;

    switch (action) {
      case "deliver": {
        const { epi_id, employee_id, quantity, expected_return_at, notes } = body;
        if (!epi_id || !employee_id || !quantity || quantity <= 0)
          return json({ error: "Parâmetros inválidos" }, 400);

        const { data: epi, error: eEpi } = await supabase
          .from("epi_catalog")
          .select("id, organization_id, stock_qty, ca_number, durability_days")
          .eq("id", epi_id).maybeSingle();
        if (eEpi || !epi || epi.organization_id !== orgId)
          return json({ error: "EPI não encontrado" }, 404);
        if (epi.stock_qty < quantity)
          return json({ error: `Estoque insuficiente (atual: ${epi.stock_qty})` }, 400);

        const expected = expected_return_at ?? (epi.durability_days
          ? new Date(Date.now() + epi.durability_days * 86400000).toISOString().slice(0, 10)
          : null);

        const { data: delivery, error: eDel } = await supabase
          .from("epi_deliveries").insert({
            organization_id: orgId,
            employee_id, epi_id, quantity,
            expected_return_at: expected,
            ca_at_delivery: epi.ca_number,
            notes,
            status: "aguardando_assinatura",
            delivered_by: user.id,
          }).select().single();
        if (eDel) return json({ error: eDel.message }, 500);

        await supabase.from("epi_catalog")
          .update({ stock_qty: epi.stock_qty - quantity })
          .eq("id", epi_id);

        await supabase.from("epi_stock_movements").insert({
          organization_id: orgId, epi_id, kind: "saida",
          quantity, delivery_id: delivery.id, performed_by: user.id,
          reason: `Entrega para colaborador`,
        });

        return json({ ok: true, delivery });
      }

      case "sign_delivery": {
        const { delivery_id, signature_data } = body;
        const { data: del } = await supabase.from("epi_deliveries")
          .select("*").eq("id", delivery_id).maybeSingle();
        if (!del || del.organization_id !== orgId)
          return json({ error: "Entrega não encontrada" }, 404);
        if (del.employee_id !== user.id &&
            !await hasRole(supabase, user.id, orgId, ["people", "admin"]))
          return json({ error: "Sem permissão" }, 403);

        const { error } = await supabase.from("epi_deliveries").update({
          status: "assinado", signed_at: new Date().toISOString(),
          signature_data: signature_data ?? null,
        }).eq("id", delivery_id);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      case "return": {
        const { delivery_id, returned_qty, return_condition } = body;
        const { data: del } = await supabase.from("epi_deliveries")
          .select("*").eq("id", delivery_id).maybeSingle();
        if (!del || del.organization_id !== orgId)
          return json({ error: "Entrega não encontrada" }, 404);

        const qty = returned_qty ?? del.quantity;
        const isUsable = return_condition === "bom";

        const { error } = await supabase.from("epi_deliveries").update({
          status: "devolvido", returned_at: new Date().toISOString().slice(0, 10),
          returned_qty: qty, return_condition,
        }).eq("id", delivery_id);
        if (error) return json({ error: error.message }, 500);

        if (isUsable) {
          const { data: epi } = await supabase.from("epi_catalog")
            .select("stock_qty").eq("id", del.epi_id).single();
          await supabase.from("epi_catalog")
            .update({ stock_qty: (epi?.stock_qty ?? 0) + qty })
            .eq("id", del.epi_id);
        }
        await supabase.from("epi_stock_movements").insert({
          organization_id: orgId, epi_id: del.epi_id,
          kind: isUsable ? "devolucao" : "descarte",
          quantity: qty, delivery_id, performed_by: user.id,
          reason: `Devolução: ${return_condition ?? "n/d"}`,
        });
        return json({ ok: true });
      }

      case "stock_in": {
        const { epi_id, quantity, unit_cost, reason } = body;
        if (!epi_id || !quantity || quantity <= 0)
          return json({ error: "Parâmetros inválidos" }, 400);
        const { data: epi } = await supabase.from("epi_catalog")
          .select("stock_qty, organization_id").eq("id", epi_id).maybeSingle();
        if (!epi || epi.organization_id !== orgId)
          return json({ error: "EPI não encontrado" }, 404);
        await supabase.from("epi_catalog")
          .update({ stock_qty: epi.stock_qty + quantity }).eq("id", epi_id);
        await supabase.from("epi_stock_movements").insert({
          organization_id: orgId, epi_id, kind: "entrada",
          quantity, unit_cost, reason, performed_by: user.id,
        });
        return json({ ok: true });
      }

      case "stock_adjust": {
        const { epi_id, new_quantity, reason } = body;
        const { data: epi } = await supabase.from("epi_catalog")
          .select("stock_qty, organization_id").eq("id", epi_id).maybeSingle();
        if (!epi || epi.organization_id !== orgId)
          return json({ error: "EPI não encontrado" }, 404);
        const diff = new_quantity - epi.stock_qty;
        await supabase.from("epi_catalog")
          .update({ stock_qty: new_quantity }).eq("id", epi_id);
        await supabase.from("epi_stock_movements").insert({
          organization_id: orgId, epi_id, kind: "ajuste",
          quantity: diff, reason: reason ?? "Ajuste manual", performed_by: user.id,
        });
        return json({ ok: true });
      }

      default:
        return json({ error: "Ação desconhecida" }, 400);
    }
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

async function hasRole(sb: any, userId: string, orgId: string, slugs: string[]) {
  const { data } = await sb.rpc("has_org_role", { _user_id: userId, _org_id: orgId, _role: slugs[0] });
  if (data) return true;
  for (const s of slugs.slice(1)) {
    const { data: d2 } = await sb.rpc("has_org_role", { _user_id: userId, _org_id: orgId, _role: s });
    if (d2) return true;
  }
  return false;
}

function json(b: any, status = 200) {
  return new Response(JSON.stringify(b), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
