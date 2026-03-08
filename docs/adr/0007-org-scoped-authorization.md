# ADR 0007: Org-Scoped Authorization (has_org_role)

**Status**: Accepted
**Date**: 2026-02-08
**Context**: Multi-tenancy security migration

## Context
The initial implementation of role-based access control (RBAC) relied on a global `user_roles` table and a `has_role(user_id, role)` function. This created a critical security vulnerability in a multi-tenant environment: a user with an 'admin' role in one organization would be authorized as an admin for ANY organization, breaking data isolation.

## Decision
We have migrated the entire authorization system to be organization-scoped.

1. **Database Level**:
   - Replaced `has_role(uid, role)` with `has_org_role(uid, org_id, role)` in all RLS policies.
   - `has_org_role` checks the `organization_members` table, which links users to organizations with a specific role.
   - Deprecated `public.has_role` function (kept only for safe rollback, but marked as deprecated).

2. **Policy Pattern**:
   - **Root Tables** (e.g., employees, departments): Use `has_org_role(auth.uid(), organization_id, 'admin')`.
   - **Child Tables** (e.g., pdis, feedbacks): Use `EXISTS` with a JOIN between the parent table and `organization_members` to verify the user's role specifically for the parent record's organization.

3. **Edge Functions**:
   - Introduced `checkOrgRole` helper in `_shared`.
   - All sensitive functions (`delete-employee`, `invite-employee`, etc.) now verify membership AND role within the target organization before proceeding.

## Consequences
### Positive
- **Strict Isolation**: Users can only perform admin actions on data belonging to organizations where they explicitly hold an admin membership.
- **Granularity**: Prepares the system for custom roles per organization in the future.
- **Security**: Closed critical PII leaks in `employees_demographics` and `employees_legal_docs`.

### Negative
- **Complexity**: RLS policies are slightly more complex (JOINs instead of simple scalar checks).
- **Migration Effort**: Required updating ~64 policies and 5 Edge Functions.

## References
- `supabase/migrations/20260208_fix_multitenant_rls_complete.sql`
- `supabase/functions/_shared/check-org-role.ts`
