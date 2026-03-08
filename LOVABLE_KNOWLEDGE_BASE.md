# PoPeople - Lovable Knowledge Base

**⚠️ CRITICAL: ALWAYS consult documentation in `docs/` before making changes.**

## 📚 Documentation Index

**Primary References** (Read FIRST before any changes):
- **`docs/index.md`** - Documentation index and navigation guide
- **`docs/architecture.md`** - Complete system architecture, stack, security
- **`docs/permissions.md`** - Roles matrix, RLS policies, enforcement points
- **`docs/claude.meta.md`** - AI development guide with patterns and pitfalls

**Domain & Business Logic**:
- **`docs/business_logic.md`** - Business rules, entities, workflows
- **`docs/api_specification.md`** - Database schema, RLS policies, query patterns

**Development Workflows**:
- **`docs/codebase_guide.md`** - File structure, navigation, data flows
- **`docs/contributing.md`** - Git workflow, code standards, migrations
- **`docs/troubleshooting.md`** - Common issues and debugging

**Architecture Decisions**:
- **`docs/adr/0001-lovable-cloud-backend.md`** - Why Lovable Cloud (not Firebase/Appwrite/Supabase standalone)
- **`docs/adr/0002-rls-authorization.md`** - Why RLS (not Edge Functions)
- **`docs/adr/0003-hardcoded-roles.md`** - Why hardcoded roles by email
- **`docs/adr/0004-direct-queries.md`** - Why direct queries (no Edge Functions)
- **`docs/adr/0005-hr-platform-expansion.md`** - Why expand to full HR portal (Phase 1: Time-Off)

**HR Platform Roadmap**:
- **`docs/roadmap.md`** - Phased rollout plan (Device → Time-Off → Performance → Learning)
- **`docs/schema_design_v2.md`** - Database design for HR modules (Core HR, Time-Off, Audit)

---

## 🎯 Project Context

**What**: Internal HR platform for Popcode (started as device inventory, expanding to full HR portal)  
**Current Modules**: Device Management (Phase 0 - ✅ Complete)  
**Next Module**: Time-Off Management (Phase 1 - 📋 Planning)  
**Future Modules**: Performance, Learning & Development (Phases 2-3)

**Stack**: React 18 + Vite + TypeScript + Lovable Cloud (Postgres + Auth) + shadcn/ui  
**Users**: Multi-tenant (multiple organizations supported)
**Platform**: Lovable (hosted) + **Lovable Cloud backend** (Supabase-compatible API)

**Key Constraint**: Lovable platform = NO Node/Python runtime, NO Edge Functions (yet)  
**Note**: Lovable Cloud uses Supabase-compatible API (`@supabase/supabase-js` SDK works), but infrastructure is managed by Lovable

---

## 🚨 Critical Rules (NEVER BREAK)

### Security (Defense-in-Depth)

1. **RLS MUST be enabled on ALL new tables**
   ```sql
   ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
   ```

2. **NEVER disable RLS on existing tables**
   - RLS is the PRIMARY security layer
   - Frontend checks are UX only (bypassable)

3. **NEVER expose service role key in client code**
   - Only use anon key: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Service role bypasses ALL RLS (dangerous)

4. **ALWAYS use `SECURITY DEFINER SET search_path = public` in functions**
   ```sql
   CREATE FUNCTION my_func() ...
   SECURITY DEFINER SET search_path = public -- Prevents SQL injection
   ```

5. **Organization membership MUST be validated**
   - Users must belong to an organization to access its data
   - Enforced at DB level via `organization_members` table and RLS policies

### Database Migrations

1. **Use Lovable Migration Tool** (NOT Supabase CLI)
   - Lovable Cloud manages migration state
   - Lovable Dashboard → Database → Migrations
   - Direct SQL in Lovable's SQL Editor for testing only

2. **Every new table MUST have**:
   - RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
   - At least one SELECT policy
   - Indexes on FK columns
   - Trigger for `updated_at` if applicable

3. **Foreign keys MUST use proper ON DELETE**:
   - `profiles.id` → `auth.users(id) ON DELETE CASCADE`
   - `devices.user_id` → `profiles(id) ON DELETE SET NULL`

### Code Standards

1. **TypeScript strict mode** (no `any`, no `!` assertions without checks)

2. **TanStack Query for ALL data fetching**:
   ```typescript
   // ✅ Correct
   const { data, isLoading } = useQuery({ queryKey: ["devices"], queryFn: ... });
   
   // ❌ Wrong
   const [devices, setDevices] = useState([]);
   useEffect(() => { supabase.from(...).then(setDevices); }, []);
   ```

3. **Always invalidate queries after mutations**:
   ```typescript
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ["devices"] });
   }
   ```

4. **shadcn/ui components ONLY** (no custom Radix implementations)

5. **Tailwind CSS for styling** (no inline styles, no CSS modules)

---

## 🔐 Roles & Permissions (Read `docs/permissions.md`)

### Roles
- **admin**: Full control (hugo@popcode.com.br)
- **people**: Create/edit devices, view all profiles
- **user**: View all devices, edit own devices only

### Role Assignment
- **Automatic on signup** via `handle_new_user()` trigger
- **Hardcoded by email** (see ADR-0003)
- **NO UI for role management** (requires SQL)

### RLS Patterns

**devices table**:
- SELECT: All authenticated users
- INSERT: Admin + people only
- UPDATE: Admin + people + device owner
- DELETE: Admin only

**profiles table**:
- SELECT: Own profile OR admin/people
- UPDATE: Own profile only

**user_roles table**:
- SELECT: Own roles only
- INSERT/UPDATE/DELETE: NO policies (trigger/SQL only)

---

## 📋 Coding Patterns

### Data Access (Read `docs/codebase_guide.md`)

```typescript
// ✅ Correct: Direct Supabase query with RLS
const { data: devices } = await supabase
  .from("devices")
  .select(`
    *,
    profiles:user_id (email, full_name)
  `)
  .order("created_at", { ascending: false });

// ❌ Wrong: No RLS checks, missing error handling
const devices = await fetch("/api/devices").then(r => r.json());
```

### Error Handling

```typescript
// ✅ Correct: Check error, throw or toast
const { data, error } = await supabase.from("devices").select();
if (error) {
  toast({ title: "Error", description: error.message, variant: "destructive" });
  throw error;
}

// ❌ Wrong: Ignore errors
const { data } = await supabase.from("devices").select();
```

### Component Patterns

```typescript
// ✅ Correct: Functional component with types
interface Props {
  device: Device | null;
  onSave: (device: Device) => void;
}

const DeviceDialog: React.FC<Props> = ({ device, onSave }) => { ... };

// ❌ Wrong: Class components, no types
class DeviceDialog extends Component { ... }
```

---

## 🚫 Common Mistakes (Read `docs/claude.meta.md`)

### DON'T

1. **Use `select('*')`** → Specify columns for performance
2. **Create tables without RLS** → Security vulnerability
3. **Skip error handling** → User sees white screen
4. **Use `useState` for server data** → Use TanStack Query
5. **Modify `user_roles` without SQL** → Privilege escalation risk
6. **Hardcode UUIDs** → Use `gen_random_uuid()`
7. **Commit `.env` files** → Secrets leak
8. **Remove organization isolation** → Data leak across tenants
9. **Bypass RLS with service role** → Not needed in this project
10. **Add Edge Functions without consulting ADR-0004** → Architectural decision

### DO

1. **Read relevant docs BEFORE changes** → `docs/` folder
2. **Test with multiple roles** → admin, people, user
3. **Check RLS policies after DB changes** → `docs/permissions.md`
4. **Use toast notifications** → User feedback
5. **Add loading states** → `<Skeleton />` components
6. **Validate inputs** → Zod schemas with react-hook-form
7. **Comment complex logic** → Future maintainability
8. **Update docs if changing architecture** → Keep in sync

---

## 🗄️ Database Schema Quick Reference

### Tables (Phase 0)
- **devices**: Inventory items (13 types, 11 statuses)
- **profiles**: User profiles (1:1 with auth.users)
- **user_roles**: Role assignments (read-only for users)

### Tables (Phase 1 - Planned)
- **employees**: HR data extending profiles (hire_date, department, manager)
- **departments**: Organizational structure
- **positions**: Job titles and levels
- **time_off_policies**: Types of leave (vacation, sick, personal)
- **time_off_balances**: Employee leave balances by year
- **time_off_requests**: Leave requests with approval workflow
- **audit_log**: LGPD compliance tracking

### Enums
- **app_role**: admin, people, user
- **device_type**: computer, monitor, mouse, ... (13 types)
- **device_status**: borrowed, available, office, ... (11 statuses)

### Key Functions
- **has_role(_user_id, _role)**: Check if user has role (used in RLS)
- **handle_new_user()**: Auto-create profile + assign role on signup
- **update_updated_at_column()**: Auto-update updated_at timestamp

---

## 🔄 Typical Workflows

### Adding New Device Field

1. **Migration**: `ALTER TABLE devices ADD COLUMN new_field TYPE;`
2. **Types**: Regenerate `src/integrations/supabase/types.ts` (Lovable auto-sync)
3. **Frontend**: Update `src/types/device.ts` if needed
4. **UI**: Add field to `DeviceDialog.tsx` form
5. **Docs**: Update `docs/api_specification.md` schema section

### Changing RLS Policy

1. **Read current policy**: `docs/permissions.md`
2. **Migration**: `DROP POLICY "old" ON table; CREATE POLICY "new" ...`
3. **Test**: Login with different roles, verify access
4. **Update docs**: `docs/permissions.md` matrix + `docs/api_specification.md`

### Adding New Role

⚠️ **Complex change** - Read `docs/adr/0003-hardcoded-roles.md` first!

1. **Migration**: `ALTER TYPE app_role ADD VALUE 'new_role';`
2. **Update trigger**: `handle_new_user()` with new role logic
3. **Frontend**: Add `isNewRole()` to `useUserRole.ts`
4. **RLS**: Update policies to include new role
5. **Docs**: Update ALL docs mentioning roles

---

## 🎨 Style Guide

### TypeScript
- **Strict mode**: No `any`, no `as`, minimal `!`
- **Imports**: `import type { X }` for types
- **Naming**: PascalCase for components, camelCase for functions/vars

### React
- **Functional components** only
- **Hooks**: Extract complex logic to custom hooks
- **Props**: Destructure and type explicitly

### SQL
- **Lowercase keywords**: `select`, `from`, `where`
- **Table aliases**: Use short aliases (`d` for devices)
- **Comments**: Explain WHY, not WHAT

### Tailwind
- **Use design system**: shadcn/ui components
- **Responsive**: Mobile-first with `sm:`, `md:`, `lg:`
- **Dark mode**: Not implemented yet (future)

---

## 🚀 Performance Guidelines

1. **Specific selects**: `select("id, model, year")` not `select("*")`
2. **Indexes exist on**: user_id, serial, device_type, status (don't duplicate)
3. **Pagination**: Not implemented yet (see `docs/architecture.md` improvements)
4. **Cache**: TanStack Query handles automatically
5. **Lazy loading**: Use `React.lazy()` for heavy pages

---

## 🆘 When in Doubt

1. **Check `docs/index.md`** for navigation
2. **Search `docs/troubleshooting.md`** for similar issues
3. **Read relevant ADR** in `docs/adr/` for architectural decisions
4. **Ask for clarification** if documentation is unclear or missing

---

## 📊 Metrics & Monitoring

**Where to check**:
- **Frontend errors**: Browser DevTools Console
- **API errors**: Lovable Dashboard → Logs → API
- **Auth issues**: Lovable Dashboard → Auth → Logs
- **Query performance**: Lovable Dashboard → Database → Query Performance

**Red flags**:
- 403 errors = RLS violation (check `docs/permissions.md`)
- 500 errors = Server issue (check Lovable Cloud status)
- Slow queries (>1s) = Missing index or N+1 problem

---

## 🔗 External Resources

- [Lovable Docs](https://docs.lovable.dev/) - Platform documentation
- [Supabase Docs](https://supabase.com/docs) - API reference (Lovable Cloud is compatible)
- [TanStack Query Docs](https://tanstack.com/query/latest) - Data fetching
- [shadcn/ui Docs](https://ui.shadcn.com/) - UI components
- [Tailwind Docs](https://tailwindcss.com/docs) - Styling

---

## ✅ Definition of Done

Before considering any change complete:
- [ ] Code compiles without TypeScript errors
- [ ] ESLint passes without warnings
- [ ] RLS policies tested (if DB change)
- [ ] Documentation updated (if architectural change)
- [ ] Tested manually with different roles
- [ ] No console errors or warnings
- [ ] Loading states present
- [ ] Error handling implemented
- [ ] Toast notifications for user feedback

---

**Version**: 1.1  
**Last Updated**: 2025-01-06  
**Maintainer**: Hugo (hugo@popcode.com.br)  
**Full Docs**: `docs/index.md`

**Recent Changes (v1.1)**:
- Added ADR-0005 (HR Platform Expansion decision)
- Added roadmap.md (Phase 1: Time-Off MVP with simplified workflow)
- Added schema_design_v2.md (Core HR + Time-Off tables)
- Migration simplifications: NULL fields, 1-step approval, in-app notifications only

---

## 🎯 Quick Command Reference

```bash
# Development
npm run dev              # Start dev server (localhost:8080)
npm run lint             # Run ESLint
npm run build            # Build for production
npx tsc --noEmit         # Type check without build

# Common Tasks
# → Add new device field: See "Typical Workflows" above
# → Change RLS policy: See "Typical Workflows" above  
# → Debug query issue: See docs/troubleshooting.md
# → Understand role system: See docs/permissions.md
```

---

**🚨 REMEMBER: When making ANY architectural decision, create an ADR in `docs/adr/` following the template in existing ADRs.**

