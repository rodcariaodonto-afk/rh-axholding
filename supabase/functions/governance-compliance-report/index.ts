import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { authorizeGovernance } from '../_shared/governance-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const { organization_id } = await req.json();
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
      organization_id, 'governance.access',
    );
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status ?? 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();

    const [policies, dsrOpen, dsrOverdue, criticalEvents, activeEmployees, terminatedEmployees,
      candidates, admins, exportsCount, retentionPending, classifications] = await Promise.all([
      supabase.from('data_governance_policies').select('*').eq('organization_id', organization_id).maybeSingle(),
      supabase.from('data_subject_requests').select('id', { count: 'exact', head: true })
        .eq('organization_id', organization_id).not('status', 'in', '(resolved,rejected)'),
      supabase.from('data_subject_requests').select('id', { count: 'exact', head: true })
        .eq('organization_id', organization_id).lt('due_at', new Date().toISOString())
        .not('status', 'in', '(resolved,rejected)'),
      supabase.from('audit_log').select('id', { count: 'exact', head: true })
        .eq('organization_id', organization_id).eq('severity', 'critical').gte('created_at', since30),
      supabase.from('employees').select('id', { count: 'exact', head: true })
        .eq('organization_id', organization_id).eq('status', 'active'),
      supabase.from('employees').select('id', { count: 'exact', head: true })
        .eq('organization_id', organization_id).eq('status', 'terminated'),
      supabase.from('job_applications').select('id', { count: 'exact', head: true })
        .eq('organization_id', organization_id),
      supabase.from('organization_members').select('user_id', { count: 'exact', head: true })
        .eq('organization_id', organization_id).eq('is_owner', true),
      supabase.from('data_exports').select('id', { count: 'exact', head: true })
        .eq('organization_id', organization_id).gte('created_at', since30),
      supabase.from('retention_jobs').select('id', { count: 'exact', head: true })
        .eq('organization_id', organization_id).eq('status', 'pending'),
      supabase.from('data_classifications').select('id', { count: 'exact', head: true })
        .eq('organization_id', organization_id),
    ]);

    const issues: Array<{ severity: string; code: string; message: string }> = [];
    if (!policies.data) issues.push({ severity: 'critical', code: 'NO_POLICY', message: 'Política de governança não configurada.' });
    if ((dsrOverdue.count ?? 0) > 0) issues.push({ severity: 'critical', code: 'DSR_OVERDUE', message: `${dsrOverdue.count} pedidos LGPD em atraso.` });
    if ((retentionPending.count ?? 0) > 50) issues.push({ severity: 'warn', code: 'RETENTION_BACKLOG', message: `${retentionPending.count} jobs de retenção pendentes.` });
    if (policies.data && !policies.data.document_access_logging) issues.push({ severity: 'warn', code: 'NO_DOC_LOGGING', message: 'Logging de acesso a documentos desabilitado.' });

    const report = {
      generated_at: new Date().toISOString(),
      organization_id,
      policies: policies.data,
      counts: {
        dsr_open: dsrOpen.count ?? 0,
        dsr_overdue: dsrOverdue.count ?? 0,
        critical_events_30d: criticalEvents.count ?? 0,
        active_employees: activeEmployees.count ?? 0,
        terminated_employees_in_retention: terminatedEmployees.count ?? 0,
        candidates_total: candidates.count ?? 0,
        owners: admins.count ?? 0,
        exports_30d: exportsCount.count ?? 0,
        retention_pending: retentionPending.count ?? 0,
        classifications_total: classifications.count ?? 0,
      },
      issues,
      compliance_score: Math.max(0, 100 - issues.reduce((acc, i) => acc + (i.severity === 'critical' ? 25 : 10), 0)),
    };

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('compliance-report error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
