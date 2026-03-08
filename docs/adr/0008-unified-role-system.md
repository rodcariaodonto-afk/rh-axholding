# ADR-0008: Pure Multi-Tenant Authorization (Local Roles Only)

## Status
**Accepted** - 2026-02-08 (Updated)

## Context

The system originally had two parallel role systems:

1. **`user_roles`** (Legacy, Global)
   - Simple table with `user_id` + `role` (admin/people/user)
   - Global scope - no organization isolation
   - **Security risk**: Global admin could access all tenants

2. **`organization_members` + `roles`** (Multi-tenant)
   - Proper multi-tenant structure: `user_id` + `organization_id` + `role_id`
   - Used by RLS policies (`has_org_role()`, `is_same_org()`)

The initial unification (v1) kept global system roles as fallback. This ADR documents the **complete removal of global roles**.

## Decision

**Pure multi-tenant authorization: ONLY organization-local roles.**

### Changes Made

1. **Database Trigger: `on_organization_created`**
   - Automatically creates 3 local roles (admin, people, user) when org is created
   - Roles have `organization_id = org.id` and `is_system = false`

2. **`useCreateOrganization.ts` Refactored**
   - Removed hardcoded UUID `00000000-0000-0000-0000-000000000001`
   - Now fetches local admin role created by trigger
   - Fails fast if trigger didn't create roles

3. **`useOrganizationRoles.ts` Simplified**
   - Removed `is_system = true` filter
   - Query: `WHERE organization_id = ${organizationId}`

4. **`handle_new_user()` Trigger Updated**
   - Uses local role from `pending_employees.organization_id`
   - No fallback to system roles

5. **Existing Members Migrated**
   - All `organization_members` using system role_ids updated to local role_ids
   - Permissions copied from system roles to local roles

6. **Deprecated (Not Removed Yet)**
   - `user_roles` table (will be removed in next major)
   - `has_role()` function (will be removed after RLS cleanup)
   - System roles (`is_system = true`)

## Consequences

### Positive
- **True multi-tenancy**: User can be Admin in Org A, User in Org B
- **No global bypass**: No way to access data across tenants
- **Customizable**: Each org can customize their roles/permissions
- **Simpler mental model**: One place to check roles

### Negative
- **Migration complexity**: Required atomic update of all org_members
- **Trigger dependency**: Org creation depends on trigger working

### Neutral
- **Frontend unchanged**: API preserved via hook refactor
- **Edge Functions unchanged**: Already used `checkOrgRole`

## Technical Details

### Before (Query)
```typescript
// OLD: Used hardcoded system role UUID
const ADMIN_ROLE_ID = "00000000-0000-0000-0000-000000000001";
```

### After (Query)
```typescript
// NEW: Fetch local admin role from the organization
const { data: adminRole } = await supabase
  .from("roles")
  .select("id")
  .eq("organization_id", org.id)
  .eq("slug", "admin")
  .single();
```

### Helper Functions
```sql
-- Used by RLS policies (org-scoped)
has_org_role(auth.uid(), organization_id, 'admin')
has_org_role(auth.uid(), organization_id, 'people')
is_same_org(organization_id)
```

### Role Creation Flow
```text
1. INSERT INTO organizations → org.id created
         ↓ (trigger fires)
2. on_organization_created → create_org_default_roles()
   → INSERT 3 roles (admin, people, user) with organization_id
         ↓
3. Frontend fetches local admin role
4. INSERT organization_members with local role_id
```

## References
- ADR-0007: Org-Scoped Authorization
- docs/permissions.md
- Memory: auth/access-control/role-system-unification
