import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { authorizeGovernance, logAudit } from '../_shared/governance-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const { organization_id, request_id, status, resolution_notes, assigned_to, priority, due_at } = await req.json();
    if (!organization_id || !request_id) {
      return new Response(JSON.stringify({ error: 'organization_id and request_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const auth = await authorizeGovernance(
      supabase, req.headers.get('Authorization'),
      organization_id, 'governance.dsr_manage',
    );
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status ?? 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: prev } = await supabase.from('data_subject_requests')
      .select('*').eq('id', request_id).eq('organization_id', organization_id).maybeSingle();
    if (!prev) {
      return new Response(JSON.stringify({ error: 'request not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const history = Array.isArray(prev.history) ? [...prev.history] : [];
    history.push({
      at: new Date().toISOString(),
      by: auth.userId,
      from_status: prev.status, to_status: status ?? prev.status,
      notes: resolution_notes ?? null,
    });

    const update: Record<string, unknown> = { history };
    if (status) update.status = status;
    if (resolution_notes !== undefined) update.resolution_notes = resolution_notes;
    if (assigned_to !== undefined) update.assigned_to = assigned_to;
    if (priority) update.priority = priority;
    if (due_at !== undefined) update.due_at = due_at;

    const { data: updated, error } = await supabase.from('data_subject_requests')
      .update(update).eq('id', request_id).select().single();
    if (error) throw error;

    await logAudit(supabase, {
      userId: auth.userId!, organizationId: organization_id,
      resourceType: 'data_subject_request', resourceId: request_id,
      action: 'dsr_updated', severity: 'warn',
      previousValues: { status: prev.status, assigned_to: prev.assigned_to },
      newValues: update,
      ip: req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
    });

    return new Response(JSON.stringify({ ok: true, request: updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('dsr-resolve error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
