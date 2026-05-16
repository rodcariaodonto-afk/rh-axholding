// Shared helper: validates platform admin status server-side
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export async function requirePlatformAdmin(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabaseAdmin.rpc("is_platform_admin", { _user_id: userId });
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Not a platform admin" };
  return { ok: true };
}

export async function logPlatformAction(
  supabaseAdmin: SupabaseClient,
  actorUserId: string,
  action: string,
  targetOrganizationId: string | null,
  targetUserId: string | null,
  metadata: Record<string, unknown> = {},
  req?: Request,
) {
  await supabaseAdmin.from("platform_audit_log").insert({
    actor_user_id: actorUserId,
    action,
    target_organization_id: targetOrganizationId,
    target_user_id: targetUserId,
    metadata,
    ip_address: req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    user_agent: req?.headers.get("user-agent") ?? null,
  });
}
