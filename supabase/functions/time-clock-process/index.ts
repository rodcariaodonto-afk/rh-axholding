// supabase/functions/time-clock-process/index.ts
// Process pending time_clock_raw_events into time_entries (4 daily punches model).
// - Groups by employee + work date (America/Sao_Paulo / UTC-3) and inserts/updates
//   time_entries with clock_in, lunch_out, lunch_return, clock_out.
// - Marks each raw event processed via tcraw_mark_processed RPC (bypasses append-only trigger).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  organization_id: z.string().uuid(),
  limit: z.number().int().min(1).max(5000).default(1000),
});

function localDate(iso: string): string {
  // America/Sao_Paulo (UTC-3) — no DST since 2019.
  const d = new Date(iso);
  d.setUTCHours(d.getUTCHours() - 3);
  return d.toISOString().substring(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader)
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    const userId = userRes.user.id;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success)
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    const { organization_id, limit } = parsed.data;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: hasPerm } = await admin.rpc("has_org_permission", {
      _user_id: userId,
      _org_id: organization_id,
      _permission: "time_clock.import",
    });
    if (!hasPerm)
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const { data: events, error: evErr } = await admin
      .from("time_clock_raw_events")
      .select("id, employee_id, event_time, device_id, latitude, longitude")
      .eq("organization_id", organization_id)
      .eq("processing_status", "pending")
      .not("employee_id", "is", null)
      .order("event_time", { ascending: true })
      .limit(limit);
    if (evErr) throw evErr;

    let processed = 0;
    let skipped = 0;

    // group by employee + date
    const groups = new Map<string, typeof events>();
    for (const e of events ?? []) {
      const key = `${e.employee_id}|${localDate(e.event_time)}`;
      if (!groups.has(key)) groups.set(key, [] as never);
      groups.get(key)!.push(e);
    }

    for (const [key, evs] of groups) {
      const [employee_id, date] = key.split("|");
      evs.sort((a, b) => +new Date(a.event_time) - +new Date(b.event_time));

      // fetch existing entry for that date
      const { data: existing } = await admin
        .from("time_entries")
        .select("id, clock_in, lunch_out, lunch_return, clock_out")
        .eq("organization_id", organization_id)
        .eq("employee_id", employee_id)
        .eq("date", date)
        .maybeSingle();

      const slots = ["clock_in", "lunch_out", "lunch_return", "clock_out"] as const;
      const current: Record<string, string | null> = existing
        ? { ...existing }
        : {
            clock_in: null,
            lunch_out: null,
            lunch_return: null,
            clock_out: null,
          };

      for (const e of evs) {
        const slot = slots.find((s) => !current[s]);
        if (!slot) {
          // 5th+ punch in the day → skip (will appear as inconsistency later)
          await admin.rpc("tcraw_mark_processed", {
            _event_id: e.id,
            _status: "conflict",
          });
          skipped++;
          continue;
        }
        current[slot] = e.event_time;
        await admin.rpc("tcraw_mark_processed", {
          _event_id: e.id,
          _status: "processed",
        });
        processed++;
      }

      // compute total minutes (clock_in→lunch_out + lunch_return→clock_out, or simple span)
      let total: number | null = null;
      if (current.clock_in && current.clock_out) {
        const ci = +new Date(current.clock_in);
        const co = +new Date(current.clock_out);
        let mins = Math.max(0, Math.round((co - ci) / 60000));
        if (current.lunch_out && current.lunch_return) {
          const lo = +new Date(current.lunch_out);
          const lr = +new Date(current.lunch_return);
          mins -= Math.max(0, Math.round((lr - lo) / 60000));
        }
        total = mins;
      }

      const firstEv = evs[0];
      if (existing) {
        await admin
          .from("time_entries")
          .update({
            clock_in: current.clock_in,
            lunch_out: current.lunch_out,
            lunch_return: current.lunch_return,
            clock_out: current.clock_out,
            total_minutes: total,
            device_id: firstEv.device_id ?? null,
            source_raw_event_id: firstEv.id,
          })
          .eq("id", existing.id);
      } else {
        await admin.from("time_entries").insert({
          organization_id,
          employee_id,
          date,
          clock_in: current.clock_in ?? firstEv.event_time,
          lunch_out: current.lunch_out,
          lunch_return: current.lunch_return,
          clock_out: current.clock_out,
          total_minutes: total,
          device_id: firstEv.device_id ?? null,
          source_raw_event_id: firstEv.id,
        });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed, skipped, groups: groups.size }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
