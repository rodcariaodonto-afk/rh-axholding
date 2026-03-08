# Permissions & Authorization

## Overview
The authorization system is built on a **pure multi-tenant RBAC** (Role-Based Access Control) model enforced at the database level via Row Level Security (RLS).

> **Note (2026-02-08)**: The system now uses **organization-local roles only**. System roles (`is_system = true`) are no longer used for authorization. See ADR-0008.

## Core Principle: Org-Scoped Access
**Users do not have global roles.** A user's role is always relative to an organization.
- ❌ **Wrong**: "User A is an Admin"
- ✅ **Correct**: "User A is an Admin of Organization X"

## Single Source of Truth

```
┌────────────────────────────────────────────┐
│ organization_members + roles               │
│ (SINGLE SOURCE OF TRUTH)                   │
├────────────────────────────────────────────┤
│ • useUserRole() [Frontend, 21 files]       │
│ • RLS policies [51 policies]               │
│ • Edge Functions [checkOrgRole helper]     │
│ • usePermissions() [Granular, optional]    │
└────────────────────────────────────────────┘
```

## Automatic Role Creation

When a new organization is created, a database trigger (`on_organization_created`) automatically creates 3 local roles:

| Slug | Name | Description |
|------|------|-------------|
| `admin` | Administrador | Full access to the organization |
| `people` | People/RH | HR and people management access |
| `user` | Colaborador | Basic employee access |

These roles belong to the organization (`organization_id = org.id`) and can be customized per tenant.

## Deprecated Tables

- **`user_roles`**: ⚠️ **DEPRECATED** - Do not use. Will be removed in next major version.
- **System roles** (`is_system = true`): Not used for authorization. Kept only as templates.

## Implementation

### 1. Database Schema
- **`organization_members`**: The source of truth for authorization. Links `user_id` ↔ `organization_id` ↔ `role_id`.
- **`roles`**: Defines available roles **per organization** (e.g., 'admin', 'people', 'user').

### 2. Frontend Hook: `useUserRole()`
```typescript
// Queries organization_members, scoped by organization
const { isAdmin, isPeople, canEdit } = useUserRole();

// Internally:
// 1. Gets organizationId from useCurrentOrganization()
// 2. Queries: organization_members.role_id → roles.slug
// 3. Maps slug to boolean flags
```

### 3. RLS Helper Functions
- **`has_org_role(user_id, org_id, role_slug)`**: Returns `true` if the user has the specified role **within that specific organization**.
- **`is_same_org(org_id)`**: Helper for basic membership checks (read-only access).

### 4. RLS Patterns

#### Root Tables (Tables with `organization_id`)
Tables like `employees`, `departments`, `jobs` use direct checks:
```sql
-- Allow admins/people of THIS org to manage
(has_org_role(auth.uid(), organization_id, 'admin') OR 
 has_org_role(auth.uid(), organization_id, 'people'))
```

#### Child Tables (Tables linked to root tables)
Tables like `pdis`, `feedbacks` use JOINs to verify the parent's organization:
```sql
-- Allow admins of the EMPLOYEE'S org to manage their PDI
EXISTS (
  SELECT 1 FROM employees e
  WHERE e.id = pdis.employee_id
  AND is_same_org(e.organization_id)
  AND (
    has_org_role(auth.uid(), e.organization_id, 'admin')
    OR has_org_role(auth.uid(), e.organization_id, 'people')
  )
)
```

## Edge Functions
Edge functions MUST NOT use global checks. Use the shared helper:
```typescript
import { checkOrgRole } from "../_shared/check-org-role.ts";

const { authorized, organizationId } = await checkOrgRole(
  supabaseAdmin, 
  user.id, 
  ["admin"]
);
```

## PII Protection (LGPD)
Sensitive data is isolated in specific tables with stricter RLS:
- **`employees_legal_docs`**: CPF, RG, Bank info. Only accessible by the user themselves and Org Admins/HR.
- **`employees_demographics`**: Race, Gender, Birth data. Same restriction.
- **`employees_contact`**: Home address, phone. Same restriction.

Managers DO NOT have access to these tables by default, only to operational data in the main `employees` table.
