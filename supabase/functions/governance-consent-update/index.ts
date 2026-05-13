import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { authorizeGovernance, logAudit } from '../_shared/governance-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const body = await req.json();
    const { organization_id, subject_type, subject_id, purpose, consent_status, legal_basis,
      consent_source, data_origin, ai_processing_allowed, talent_pool_opt_in, privacy_notes } = body;

    if (!organization_id || !subject_type || !subject_id || !purpose || !consent_status) {
      return new Response(JSON.stringify({ error: 'missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const auth = await authorizeGovernance(
      supabase, req.headers.get('Authorization'),
      organization_id, 'governance.consent_manage',
    );
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status ?? 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      organization_id, subject_type, subject_id, purpose,
      consent_status, legal_basis: legal_basis ?? 'consent',
      consent_source: consent_source ?? 'admin_panel',
      data_origin: data_origin ?? null,
      ai_processing_allowed: !!ai_processing_allowed,
      talent_pool_opt_in: !!talent_pool_opt_in,
      privacy_notes: privacy_notes ?? null,
    };
    if (consent_status === 'granted') payload.consent_given_at = now;
    if (consent_status === 'revoked') payload.consent_revoked_at = now;

    const { data, error } = await supabase.from('data_consents').upsert(payload, {
      onConflict: 'organization_id,subject_type,subject_id,purpose',
    }).select().single();
    if (error) throw error;

    await logAudit(supabase, {
      userId: auth.userId!, organizationId: organization_id,
      resourceType: 'data_consent', resourceId: data.id,
      action: `consent_${consent_status}`, severity: 'warn', isSensitive: true,
      newValues: payload,
    });

    return new Response(JSON.stringify({ ok: true, consent: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('consent-update error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
