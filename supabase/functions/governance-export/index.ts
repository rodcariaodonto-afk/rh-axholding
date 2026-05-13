import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { authorizeGovernance, logAudit } from '../_shared/governance-auth.ts';

interface Body {
  organization_id: string;
  scope: string[];
  subject_type?: 'employee' | 'candidate' | null;
  subject_id?: string | null;
  include_files?: boolean;
}

const SCOPE_TABLES: Record<string, { table: string; orgCol?: string; userCol?: string }> = {
  organization: { table: 'organizations' },
  employees: { table: 'employees', orgCol: 'organization_id', userCol: 'id' },
  contracts: { table: 'employees_contracts', userCol: 'user_id' },
  contact: { table: 'employees_contact', userCol: 'user_id' },
  demographics: { table: 'employees_demographics', userCol: 'user_id' },
  legal_docs: { table: 'employees_legal_docs', userCol: 'user_id' },
  candidates: { table: 'job_applications', orgCol: 'organization_id' },
  jobs: { table: 'jobs', orgCol: 'organization_id' },
  positions: { table: 'positions', orgCol: 'organization_id' },
  departments: { table: 'departments', orgCol: 'organization_id' },
  pdis: { table: 'pdis', orgCol: 'organization_id' },
  pdi_goals: { table: 'pdi_goals' },
  feedbacks: { table: 'feedbacks', orgCol: 'organization_id' },
  evaluations: { table: 'evaluation_cycles', orgCol: 'organization_id' },
  time_off: { table: 'time_off_requests', orgCol: 'organization_id' },
  time_tracking: { table: 'time_tracking_records', orgCol: 'organization_id' },
  audit: { table: 'audit_log', orgCol: 'organization_id' },
  policies: { table: 'data_governance_policies', orgCol: 'organization_id' },
  consents: { table: 'data_consents', orgCol: 'organization_id' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body.organization_id || !Array.isArray(body.scope) || body.scope.length === 0) {
      return new Response(JSON.stringify({ error: 'organization_id and scope[] required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const auth = await authorizeGovernance(
      supabase, req.headers.get('Authorization'),
      body.organization_id, 'governance.export',
    );
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status ?? 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Read TTL from policies
    const { data: pol } = await supabase
      .from('data_governance_policies')
      .select('export_link_ttl_days')
      .eq('organization_id', body.organization_id).maybeSingle();
    const ttlDays = pol?.export_link_ttl_days ?? 7;

    const { data: exportRow, error: exportErr } = await supabase
      .from('data_exports')
      .insert({
        organization_id: body.organization_id,
        requested_by: auth.userId,
        scope: body.scope,
        subject_type: body.subject_type ?? null,
        subject_id: body.subject_id ?? null,
        status: 'processing',
        format: 'json',
        expires_at: new Date(Date.now() + ttlDays * 86400_000).toISOString(),
      })
      .select().single();
    if (exportErr) throw exportErr;

    const payload: Record<string, unknown> = {
      _meta: {
        organization_id: body.organization_id,
        generated_at: new Date().toISOString(),
        generated_by: auth.userId,
        subject: body.subject_type ? { type: body.subject_type, id: body.subject_id } : null,
        scope: body.scope,
        include_files: !!body.include_files,
        notice: 'Files (binaries) excluded by default — only metadata/refs included.',
      },
    };

    for (const s of body.scope) {
      const cfg = SCOPE_TABLES[s];
      if (!cfg) continue;
      try {
        let q = supabase.from(cfg.table).select('*');
        if (cfg.orgCol) q = q.eq(cfg.orgCol, body.organization_id);
        if (body.subject_id && cfg.userCol) q = q.eq(cfg.userCol, body.subject_id);
        const { data, error } = await q.limit(10000);
        payload[s] = error ? { error: error.message } : data;
      } catch (e) {
        payload[s] = { error: String(e) };
      }
    }

    const fileName = `${body.organization_id}/${exportRow.id}.json`;
    const json = JSON.stringify(payload, null, 2);
    const { error: upErr } = await supabase.storage
      .from('governance-exports')
      .upload(fileName, new Blob([json], { type: 'application/json' }), { upsert: true });
    if (upErr) throw upErr;

    const { data: signed } = await supabase.storage
      .from('governance-exports')
      .createSignedUrl(fileName, ttlDays * 86400);

    await supabase.from('data_exports').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      file_url: signed?.signedUrl ?? null,
      file_size_bytes: json.length,
    }).eq('id', exportRow.id);

    await logAudit(supabase, {
      userId: auth.userId!, organizationId: body.organization_id,
      resourceType: 'data_export', resourceId: exportRow.id,
      action: 'export_generated', severity: 'critical', isSensitive: true,
      newValues: { scope: body.scope, subject_type: body.subject_type, subject_id: body.subject_id },
      ip: req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
    });

    return new Response(JSON.stringify({ ok: true, export_id: exportRow.id, file_url: signed?.signedUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('governance-export error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
