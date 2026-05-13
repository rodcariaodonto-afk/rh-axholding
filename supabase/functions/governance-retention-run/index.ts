import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { authorizeGovernance, logAudit } from '../_shared/governance-auth.ts';

const ALLOWED_TABLES = new Set(['employees', 'job_applications', 'employee_documents']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const { organization_id, job_ids } = await req.json();
    if (!organization_id) {
      return new Response(JSON.stringify({ error: 'organization_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const auth = await authorizeGovernance(
      supabase, req.headers.get('Authorization'),
      organization_id, 'governance.retention_manage',
    );
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status ?? 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let q = supabase.from('retention_jobs').select('*')
      .eq('organization_id', organization_id).eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString());
    if (Array.isArray(job_ids) && job_ids.length) q = q.in('id', job_ids);

    const { data: jobs, error } = await q.limit(200);
    if (error) throw error;

    const results: Array<{ id: string; ok: boolean; error?: string }> = [];

    for (const job of jobs ?? []) {
      if (!ALLOWED_TABLES.has(job.target_table)) {
        results.push({ id: job.id, ok: false, error: 'table not allowed' });
        continue;
      }

      // Skip if classification = legal_obligation
      const { data: cls } = await supabase.from('data_classifications')
        .select('classification').eq('organization_id', organization_id)
        .eq('resource_type', job.target_table).eq('resource_id', job.target_id).maybeSingle();
      if (cls?.classification === 'legal_obligation') {
        await supabase.from('retention_jobs').update({
          status: 'cancelled', notes: 'Bloqueado por classificação legal_obligation', executed_at: new Date().toISOString(), executed_by: auth.userId,
        }).eq('id', job.id);
        results.push({ id: job.id, ok: false, error: 'legal_obligation' });
        continue;
      }

      try {
        if (job.action === 'delete') {
          await supabase.from(job.target_table).delete().eq('id', job.target_id).eq('organization_id', organization_id);
        } else if (job.action === 'anonymize') {
          const anonPatch: Record<string, unknown> = {};
          if (job.target_table === 'employees') {
            Object.assign(anonPatch, { full_name: 'ANONIMIZADO', email: `anon-${job.target_id}@anon.local`, status: 'anonymized' });
          } else if (job.target_table === 'job_applications') {
            Object.assign(anonPatch, { candidate_name: 'ANONIMIZADO', candidate_email: `anon-${job.target_id}@anon.local`, candidate_phone: null, resume_url: null });
          }
          if (Object.keys(anonPatch).length) {
            await supabase.from(job.target_table).update(anonPatch).eq('id', job.target_id);
          }
        }

        await supabase.from('retention_jobs').update({
          status: 'completed', executed_at: new Date().toISOString(), executed_by: auth.userId,
        }).eq('id', job.id);

        await logAudit(supabase, {
          userId: auth.userId!, organizationId: organization_id,
          resourceType: job.target_table, resourceId: job.target_id,
          action: `retention_${job.action}`, severity: 'critical', isSensitive: true,
          newValues: { job_id: job.id },
        });

        results.push({ id: job.id, ok: true });
      } catch (e) {
        await supabase.from('retention_jobs').update({
          status: 'failed', executed_at: new Date().toISOString(), notes: String(e), executed_by: auth.userId,
        }).eq('id', job.id);
        results.push({ id: job.id, ok: false, error: String(e) });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('retention-run error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
