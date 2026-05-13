// Shared helper for governance edge functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export interface GovAuthResult {
  ok: boolean;
  userId?: string;
  organizationId?: string;
  error?: string;
  status?: number;
}

export async function authorizeGovernance(
  supabaseAdmin: SupabaseClient,
  authHeader: string | null,
  organizationId: string,
  permission: string,
): Promise<GovAuthResult> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, error: 'Missing authorization', status: 401 };
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: claims, error } = await supabaseAdmin.auth.getClaims(token);
  if (error || !claims?.claims?.sub) {
    return { ok: false, error: 'Invalid token', status: 401 };
  }
  const userId = claims.claims.sub as string;

  const { data: hasPerm, error: permErr } = await supabaseAdmin.rpc('has_org_permission', {
    _user_id: userId,
    _org_id: organizationId,
    _permission: permission,
  });
  if (permErr || !hasPerm) {
    return { ok: false, error: 'Forbidden', status: 403 };
  }
  return { ok: true, userId, organizationId };
}

export async function logAudit(
  supabaseAdmin: SupabaseClient,
  params: {
    userId: string;
    organizationId: string;
    resourceType: string;
    resourceId?: string | null;
    action: string;
    severity?: 'info' | 'warn' | 'critical';
    isSensitive?: boolean;
    changes?: Record<string, unknown>;
    previousValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ip?: string | null;
    userAgent?: string | null;
  },
) {
  await supabaseAdmin.from('audit_log').insert({
    user_id: params.userId,
    organization_id: params.organizationId,
    resource_type: params.resourceType,
    resource_id: params.resourceId ?? null,
    action: params.action,
    severity: params.severity ?? 'info',
    is_sensitive: params.isSensitive ?? false,
    changes: params.changes ?? null,
    previous_values: params.previousValues ?? null,
    new_values: params.newValues ?? null,
    ip_address: params.ip ?? null,
    user_agent: params.userAgent ?? null,
  });
}
