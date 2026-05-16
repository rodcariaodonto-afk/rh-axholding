// supabase/functions/time-clock-import/index.ts
// Import AFD (Arquivo Fonte de Dados - Portaria 671/2021) or CSV time clock files.
// Reads a file from the `time-clock-imports` bucket, parses records of type 3
// (registro de marcação) and inserts append-only rows into time_clock_raw_events.
// Also creates a time_clock_sync_logs entry with totals.
//
// AFD layout (Portaria 671/2021) — type 3 record (line):
//   NSR (9) | TIPO (1='3') | DATA HORA (12, yyyyMMddHHmm) | PIS (12)
//
// CSV layout (generic):
//   pis_or_cpf,event_time_iso,direction(optional),device_serial(optional)
//
// Auth: requires authenticated user with permission `time_clock.import` on org.

import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
  device_id: z.string().uuid().optional(),
  storage_path: z.string().min(1),
  format: z.enum(["afd", "csv"]).default("afd"),
});

interface ParsedEvent {
  external_employee_code: string;
  event_time: string; // ISO
  direction: "in" | "out" | "break_start" | "break_end" | "unknown";
  source_event_id: string;
  raw: Record<string, unknown>;
}

function parseAfd(text: string): { events: ParsedEvent[]; rejected: number } {
  const events: ParsedEvent[] = [];
  let rejected = 0;
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (line.length < 34) continue;
    const tipo = line.charAt(9);
    if (tipo !== "3") continue;
    const nsr = line.substring(0, 9).trim();
    const dt = line.substring(10, 22); // yyyyMMddHHmm
    const pis = line.substring(22, 34).trim();
    if (!/^\d{12}$/.test(dt) || !pis) {
      rejected++;
      continue;
    }
    const iso = `${dt.substring(0, 4)}-${dt.substring(4, 6)}-${dt.substring(
      6,
      8,
    )}T${dt.substring(8, 10)}:${dt.substring(10, 12)}:00-03:00`;
    events.push({
      external_employee_code: pis,
      event_time: new Date(iso).toISOString(),
      direction: "unknown",
      source_event_id: `afd:${nsr}`,
      raw: { nsr, tipo, line },
    });
  }
  return { events, rejected };
}

function parseCsv(text: string): { events: ParsedEvent[]; rejected: number } {
  const events: ParsedEvent[] = [];
  let rejected = 0;
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  let i = 0;
  for (const line of lines) {
    if (i++ === 0 && /pis|cpf|employee/i.test(line)) continue; // header
    const cols = line.split(/[,;]/).map((c) => c.trim());
    const [code, when, dirRaw, dev] = cols;
    if (!code || !when) {
      rejected++;
      continue;
    }
    const d = new Date(when);
    if (isNaN(d.getTime())) {
      rejected++;
      continue;
    }
    const dir = (
      ["in", "out", "break_start", "break_end"] as const
    ).includes(dirRaw as never)
      ? (dirRaw as ParsedEvent["direction"])
      : "unknown";
    events.push({
      external_employee_code: code,
      event_time: d.toISOString(),
      direction: dir,
      source_event_id: `csv:${code}:${d.toISOString()}`,
      raw: { code, when, dir: dirRaw, dev },
    });
  }
  return { events, rejected };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userRes.user.id;

    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { organization_id, device_id, storage_path, format } = parsed.data;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // permission check
    const { data: hasPerm } = await admin.rpc("has_org_permission", {
      _user_id: userId,
      _org_id: organization_id,
      _permission: "time_clock.import",
    });
    if (!hasPerm) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // download file
    const { data: fileBlob, error: dlErr } = await admin.storage
      .from("time-clock-imports")
      .download(storage_path);
    if (dlErr || !fileBlob) {
      return new Response(
        JSON.stringify({ error: `Storage download failed: ${dlErr?.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const text = await fileBlob.text();

    const { events, rejected } =
      format === "csv" ? parseCsv(text) : parseAfd(text);

    // Create sync log first
    const { data: syncLog, error: logErr } = await admin
      .from("time_clock_sync_logs")
      .insert({
        organization_id,
        device_id: device_id ?? null,
        sync_status: "running",
        events_received: events.length + rejected,
        events_rejected: rejected,
        source_file: storage_path,
        metadata: { format },
        triggered_by: userId,
      })
      .select("id")
      .single();
    if (logErr) {
      return new Response(JSON.stringify({ error: logErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const syncLogId = syncLog.id;

    // Resolve external_employee_code → employee_id via legal_docs.pis (best-effort)
    const codes = Array.from(new Set(events.map((e) => e.external_employee_code)));
    const { data: docs } = await admin
      .from("employees_legal_docs")
      .select("user_id, pis")
      .in("pis", codes);
    const codeMap = new Map<string, string>();
    for (const d of docs ?? []) {
      if (d.pis) codeMap.set(d.pis, d.user_id);
    }

    // Insert events in chunks (skip duplicates via UNIQUE)
    let accepted = 0;
    let duplicated = 0;
    const CHUNK = 500;
    for (let i = 0; i < events.length; i += CHUNK) {
      const slice = events.slice(i, i + CHUNK).map((e) => ({
        organization_id,
        employee_id: codeMap.get(e.external_employee_code) ?? null,
        external_employee_code: e.external_employee_code,
        device_id: device_id ?? null,
        source: format,
        source_event_id: e.source_event_id,
        event_time: e.event_time,
        direction: e.direction,
        raw_payload: e.raw,
        sync_log_id: syncLogId,
      }));
      const { error: insErr, count } = await admin
        .from("time_clock_raw_events")
        .insert(slice, { count: "exact" });
      if (insErr) {
        // attempt one-by-one to count duplicates
        for (const row of slice) {
          const { error: e1 } = await admin
            .from("time_clock_raw_events")
            .insert(row);
          if (!e1) accepted++;
          else duplicated++;
        }
      } else {
        accepted += count ?? slice.length;
      }
    }

    // Update sync log (bypass append-only via SECURITY DEFINER? — sync log triggers also block).
    // We instead leave initial counts and create a final log entry summarizing.
    await admin.from("time_clock_sync_logs").insert({
      organization_id,
      device_id: device_id ?? null,
      sync_status: rejected === 0 ? "success" : "partial",
      events_received: events.length + rejected,
      events_accepted: accepted,
      events_rejected: rejected,
      events_duplicated: duplicated,
      source_file: storage_path,
      metadata: { format, parent_log_id: syncLogId, finalized: true },
      triggered_by: userId,
    });

    if (device_id) {
      await admin
        .from("time_clock_devices")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", device_id);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        received: events.length + rejected,
        accepted,
        rejected,
        duplicated,
        sync_log_id: syncLogId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
