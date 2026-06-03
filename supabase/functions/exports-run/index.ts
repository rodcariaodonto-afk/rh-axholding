import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const head = headers.join(",");
  const body = rows.map((r) => headers.map((h) => csvEscape(r[h])).join(",")).join("\n");
  return head + "\n" + body;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // === Authentication ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub as string;

    const { job_id } = await req.json();
    if (!job_id) return new Response(JSON.stringify({ error: "job_id required" }), { status: 400, headers: corsHeaders });

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: job, error: jobErr } = await admin
      .from("export_jobs").select("*").eq("id", job_id).single();
    if (jobErr || !job) throw new Error(jobErr?.message ?? "job not found");

    // === Authorization: must belong to job's org ===
    const { data: isMember } = await admin.rpc("user_belongs_to_org", {
      _user_id: userId,
      _org_id: job.organization_id,
    });
    if (!isMember) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    await admin.from("export_jobs").update({
      status: "processing", started_at: new Date().toISOString(),
    }).eq("id", job_id);

    const orgId = job.organization_id as string;
    const params = (job.params ?? {}) as any;
    let rows: Record<string, unknown>[] = [];

    switch (job.job_type) {
      case "payroll_csv": {
        const q = admin.from("payroll_events")
          .select("competency_id, employee_id, kind, code, description, reference, amount")
          .eq("organization_id", orgId);
        if (params.competency_id) q.eq("competency_id", params.competency_id);
        const { data, error } = await q;
        if (error) throw error;
        rows = data ?? [];
        break;
      }
      case "time_entries_csv": {
        const { data, error } = await admin.from("time_entries")
          .select("employee_id, date, clock_in, clock_out, total_minutes")
          .eq("organization_id", orgId)
          .gte("date", params.start_date ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
          .lte("date", params.end_date ?? new Date().toISOString().slice(0, 10));
        if (error) throw error;
        rows = data ?? [];
        break;
      }
      case "inconsistencies_csv": {
        const { data, error } = await admin.from("time_inconsistencies")
          .select("employee_id, date, type, status, description")
          .eq("organization_id", orgId)
          .order("date", { ascending: false }).limit(5000);
        if (error) throw error;
        rows = data ?? [];
        break;
      }
      case "employees_csv": {
        const { data, error } = await admin.from("employees")
          .select("id, full_name, email, status, employment_type, department_id, base_position_id")
          .eq("organization_id", orgId);
        if (error) throw error;
        rows = data ?? [];
        break;
      }
      case "absenteeism_csv": {
        const { data, error } = await admin.from("time_inconsistencies")
          .select("employee_id, date, type")
          .eq("organization_id", orgId).eq("type", "falta")
          .order("date", { ascending: false }).limit(5000);
        if (error) throw error;
        rows = data ?? [];
        break;
      }
      case "audit_csv": {
        const { data, error } = await admin.from("audit_log")
          .select("created_at, user_id, resource_type, resource_id, action")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false }).limit(5000);
        if (error) throw error;
        rows = data ?? [];
        break;
      }
      default:
        throw new Error(`Tipo não suportado: ${job.job_type}`);
    }

    const csv = toCsv(rows);
    const bytes = new TextEncoder().encode(csv);
    const path = `${orgId}/${job.job_type}/${job_id}.csv`;

    const { error: upErr } = await admin.storage.from("payroll-exports")
      .upload(path, bytes, { contentType: "text/csv; charset=utf-8", upsert: true });
    if (upErr) throw upErr;

    await admin.from("export_jobs").update({
      status: "completed",
      finished_at: new Date().toISOString(),
      result_path: path,
      result_mime: "text/csv",
      result_size_bytes: bytes.byteLength,
    }).eq("id", job_id);

    return new Response(JSON.stringify({ ok: true, path, rows: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const admin = createClient(supabaseUrl, serviceKey);
      const body = await req.clone().json().catch(() => ({}));
      if (body?.job_id) {
        await admin.from("export_jobs").update({
          status: "failed", finished_at: new Date().toISOString(), error_message: String(err?.message ?? err),
        }).eq("id", body.job_id);
      }
    } catch {}
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
