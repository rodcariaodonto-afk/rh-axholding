// Use generic any to avoid version conflicts between ESM imports
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export interface OrgRoleResult {
  authorized: boolean;
  organizationId: string | null;
  roleSlug: string | null;
  error?: string;
}

/**
 * Check if a user has one of the required roles within their organization.
 * 
 * Replaces the legacy pattern:
 *   query user_roles → check role globally
 * 
 * With org-scoped pattern:
 *   query organization_members + roles → check role within org
 * 
 * This ensures proper multi-tenant isolation where a user's role
 * is only valid within the organization they belong to.
 * 
 * @param supabaseAdmin - Admin Supabase client (with service role key)
 * @param userId - The user ID to check
 * @param requiredRoles - Array of role slugs that grant access (e.g., ["admin", "people"])
 * @returns OrgRoleResult with authorization status and org/role info
 */
export async function checkOrgRole(
  supabaseAdmin: SupabaseClient,
  userId: string,
  requiredRoles: string[] = ["admin", "people"],
): Promise<OrgRoleResult> {
  // Get user's organization membership with role
  const { data: member, error: memberError } = await supabaseAdmin
    .from("organization_members")
    .select("organization_id, role_id")
    .eq("user_id", userId)
    .single();

  if (memberError || !member) {
    return { 
      authorized: false, 
      organizationId: null, 
      roleSlug: null, 
      error: "User not in any organization" 
    };
  }

  // Get role slug from role_id
  const { data: roleData, error: roleError } = await supabaseAdmin
    .from("roles")
    .select("slug")
    .eq("id", member.role_id)
    .single();

  if (roleError || !roleData) {
    return {
      authorized: false,
      organizationId: member.organization_id,
      roleSlug: null,
      error: "Could not resolve user role"
    };
  }

  const userRole = roleData.slug;
  const authorized = requiredRoles.includes(userRole);

  return {
    authorized,
    organizationId: member.organization_id,
    roleSlug: userRole,
  };
}
