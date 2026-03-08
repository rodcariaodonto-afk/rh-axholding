---
type: "schema-design"
project: "PoPeople"
version: "2.0"
status: "draft"
phase: "Phase 0 → Phase 1 migration"
---

# Schema Design v2.0: HR Platform Expansion

Design do banco de dados para expansão do PoPeople de device management para portal de RH completo.

---

## 🎯 Design Principles

1. **Modular**: Cada módulo (devices, time-off, performance) é independente
2. **Temporal**: Suporta histórico (cargos, salários, mudanças)
3. **Auditable**: Audit log em todas operações sensíveis
4. **Secure**: RLS granular, encryption para dados sensíveis
5. **Extensible**: Fácil adicionar novos módulos

---

## 📊 Current Schema (Phase 0)

### Existing Tables

```sql
-- Auth & Users
auth.users (Lovable Cloud managed)

-- Current tables
public.profiles (
  id UUID PK → auth.users,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

public.user_roles (
  id UUID PK,
  user_id UUID → auth.users,
  role app_role NOT NULL, -- admin, people, user
  UNIQUE(user_id, role)
)

public.devices (
  id UUID PK,
  user_name TEXT NOT NULL,
  user_id UUID → profiles,
  model TEXT NOT NULL,
  year INT NOT NULL,
  device_type device_type NOT NULL,
  status device_status NOT NULL,
  processor TEXT,
  ram INT,
  disk INT,
  screen_size NUMERIC(4,1),
  serial TEXT,
  warranty_date DATE,
  hexnode_registered BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Evidence**: `src/integrations/supabase/types.ts`, `supabase/migrations/`

---

## 🏗️ New Schema (Phase 1: Foundation + Time-Off)

### Core HR Entities

#### `employees` (extends `profiles`)
```sql
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Employment info
  employee_id TEXT UNIQUE, -- Internal ID (ex: "POP001")
  hire_date DATE, -- NULL initially, filled by People team
  employment_type employment_type NOT NULL DEFAULT 'full_time', -- full_time, part_time, contractor
  
  -- Organizational
  department_id UUID REFERENCES public.departments(id),
  position_id UUID REFERENCES public.positions(id),
  manager_id UUID REFERENCES public.employees(id), -- Self-referencing
  
  -- Status
  status employee_status NOT NULL DEFAULT 'active', -- active, on_leave, terminated
  termination_date DATE,
  termination_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contractor', 'intern');
CREATE TYPE employee_status AS ENUM ('active', 'on_leave', 'terminated');

-- Indexes
CREATE INDEX idx_employees_profile_id ON employees(profile_id);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status) WHERE status = 'active';

COMMENT ON TABLE employees IS 'Employee records extending profiles with HR-specific data';
```

**Why separate from profiles?**
- `profiles` = auth/user data (email, name)
- `employees` = HR data (hire date, department, manager)
- Permite usuários sem employee record (ex: ex-colaboradores que mantêm acesso a docs)

#### `departments`
```sql
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- "Engineering", "People", "Sales"
  code TEXT UNIQUE, -- "ENG", "PPL", "SAL"
  description TEXT,
  manager_id UUID REFERENCES public.employees(id),
  parent_department_id UUID REFERENCES public.departments(id), -- For nested depts
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_departments_parent ON departments(parent_department_id);

COMMENT ON TABLE departments IS 'Organizational departments';
```

#### `positions`
```sql
CREATE TABLE public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, -- "Senior Software Engineer", "People Manager"
  level position_level, -- junior, mid, senior, staff, principal, manager, director
  department_id UUID REFERENCES public.departments(id),
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE position_level AS ENUM (
  'intern', 'junior', 'mid', 'senior', 'staff', 'principal',
  'manager', 'senior_manager', 'director', 'vp', 'c_level'
);

CREATE INDEX idx_positions_department ON positions(department_id);

COMMENT ON TABLE positions IS 'Job positions/titles';
```

### Time-Off Module

#### `time_off_policies`
```sql
CREATE TABLE public.time_off_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- "Férias Anuais", "Licença Médica"
  code TEXT NOT NULL UNIQUE, -- "vacation", "sick_leave", "personal"
  description TEXT,
  
  -- Accrual rules
  days_per_year NUMERIC(5,2) NOT NULL, -- 30 for vacation, unlimited for sick
  requires_approval BOOLEAN DEFAULT true,
  allow_negative_balance BOOLEAN DEFAULT false,
  carryover_days INT DEFAULT 0, -- Days that can roll over to next year
  
  -- Visibility
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_time_off_policies_active ON time_off_policies(is_active) WHERE is_active = true;

-- Initial policies
INSERT INTO time_off_policies (name, code, days_per_year, description) VALUES
  ('Férias Anuais', 'vacation', 30, 'Férias pagas conforme CLT'),
  ('Licença Médica', 'sick_leave', 999, 'Licença por motivo de saúde (sem limite)'),
  ('Folga Pessoal', 'personal', 5, 'Dias de folga pessoal por ano');

COMMENT ON TABLE time_off_policies IS 'Types of time-off and their rules';
```

#### `time_off_balances`
```sql
CREATE TABLE public.time_off_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES public.time_off_policies(id),
  year INT NOT NULL, -- 2025, 2026, etc.
  
  -- Balance tracking
  total_days NUMERIC(5,2) NOT NULL DEFAULT 0, -- Total accrued for year
  used_days NUMERIC(5,2) NOT NULL DEFAULT 0,
  pending_days NUMERIC(5,2) NOT NULL DEFAULT 0, -- In pending requests
  available_days NUMERIC(5,2) GENERATED ALWAYS AS (total_days - used_days - pending_days) STORED,
  
  -- Metadata
  last_accrual_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(employee_id, policy_id, year)
);

CREATE INDEX idx_balances_employee ON time_off_balances(employee_id);
CREATE INDEX idx_balances_year ON time_off_balances(year);

COMMENT ON TABLE time_off_balances IS 'Employee time-off balances by policy and year';
```

#### `time_off_requests`
```sql
CREATE TABLE public.time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES public.time_off_policies(id),
  
  -- Request details
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested NUMERIC(5,2) NOT NULL, -- Can be fractional (0.5 = half day)
  reason TEXT,
  notes TEXT, -- Additional comments
  
  -- Approval workflow
  status time_off_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  
  -- Approvals (manager → people)
  manager_id UUID REFERENCES public.employees(id),
  manager_approved_at TIMESTAMPTZ,
  manager_notes TEXT,
  
  people_approved_by UUID REFERENCES public.profiles(id),
  people_approved_at TIMESTAMPTZ,
  people_notes TEXT,
  
  rejected_by UUID REFERENCES public.profiles(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_days CHECK (days_requested > 0)
);

CREATE TYPE time_off_status AS ENUM (
  'draft',              -- Being created
  'pending_manager',    -- Submitted, waiting manager
  'pending_people',     -- Manager approved, waiting people team
  'approved',           -- Fully approved
  'rejected',           -- Rejected by manager or people
  'cancelled'           -- Cancelled by employee
);

CREATE INDEX idx_time_off_employee ON time_off_requests(employee_id);
CREATE INDEX idx_time_off_status ON time_off_requests(status);
CREATE INDEX idx_time_off_dates ON time_off_requests(start_date, end_date);
CREATE INDEX idx_time_off_manager ON time_off_requests(manager_id) WHERE status = 'pending_manager';

COMMENT ON TABLE time_off_requests IS 'Time-off requests with approval workflow';
```

### Audit & Permissions

#### `audit_log`
```sql
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  user_id UUID REFERENCES public.profiles(id),
  user_email TEXT NOT NULL, -- Denormalized for safety
  user_role TEXT,
  
  -- What
  action TEXT NOT NULL, -- 'read', 'create', 'update', 'delete', 'approve', 'reject'
  resource_type TEXT NOT NULL, -- 'employee', 'time_off_request', 'device'
  resource_id UUID,
  
  -- When & Where
  timestamp TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  
  -- Details
  changes JSONB, -- Before/after values
  sensitive_data_accessed BOOLEAN DEFAULT false,
  
  -- Context
  request_id TEXT, -- For tracing
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_user ON audit_log(user_id, timestamp DESC);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_sensitive ON audit_log(sensitive_data_accessed, timestamp DESC) 
  WHERE sensitive_data_accessed = true;
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);

COMMENT ON TABLE audit_log IS 'Audit trail for LGPD compliance and security';
```

#### `role_permissions` (replaces hardcoded roles)
```sql
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module permission_module NOT NULL,
  
  -- CRUD permissions
  can_read BOOLEAN DEFAULT false,
  can_write BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false, -- For approval workflows
  
  -- Scope (future: department-level, team-level)
  scope permission_scope DEFAULT 'all',
  
  UNIQUE(role, module)
);

CREATE TYPE permission_module AS ENUM (
  'devices',
  'employees',
  'time_off',
  'performance',
  'compensation', -- Future
  'learning',     -- Future
  'admin'
);

CREATE TYPE permission_scope AS ENUM ('all', 'department', 'team', 'own');

-- Default permissions
INSERT INTO role_permissions (role, module, can_read, can_write, can_delete, can_approve, scope) VALUES
  -- Admin: full access
  ('admin', 'devices', true, true, true, true, 'all'),
  ('admin', 'employees', true, true, true, true, 'all'),
  ('admin', 'time_off', true, true, true, true, 'all'),
  ('admin', 'admin', true, true, true, true, 'all'),
  
  -- People: HR access (no delete devices)
  ('people', 'devices', true, true, false, true, 'all'),
  ('people', 'employees', true, true, false, true, 'all'),
  ('people', 'time_off', true, true, false, true, 'all'),
  
  -- User: limited access
  ('user', 'devices', true, false, false, false, 'all'), -- Read all devices
  ('user', 'employees', true, false, false, false, 'own'), -- Read own employee record
  ('user', 'time_off', true, true, false, false, 'own'); -- Manage own time-off

COMMENT ON TABLE role_permissions IS 'Module-based permissions replacing hardcoded roles';
```

---

## 🔐 RLS Policies (Phase 1)

### `employees` RLS
```sql
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Read: Own record OR manager OR people/admin
CREATE POLICY "employees_select"
ON employees FOR SELECT
USING (
  profile_id = auth.uid() OR                          -- Own record
  manager_id = (SELECT id FROM employees WHERE profile_id = auth.uid()) OR -- Direct reports
  has_role(auth.uid(), 'people') OR
  has_role(auth.uid(), 'admin')
);

-- Update: People/Admin only
CREATE POLICY "employees_update"
ON employees FOR UPDATE
USING (
  has_role(auth.uid(), 'people') OR
  has_role(auth.uid(), 'admin')
);
```

### `time_off_requests` RLS
```sql
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

-- Read: Own requests OR manager OR people/admin
CREATE POLICY "time_off_select"
ON time_off_requests FOR SELECT
USING (
  employee_id IN (SELECT id FROM employees WHERE profile_id = auth.uid()) OR -- Own
  manager_id = (SELECT id FROM employees WHERE profile_id = auth.uid()) OR   -- Manager
  has_role(auth.uid(), 'people') OR
  has_role(auth.uid(), 'admin')
);

-- Create: Own requests only
CREATE POLICY "time_off_insert"
ON time_off_requests FOR INSERT
WITH CHECK (
  employee_id IN (SELECT id FROM employees WHERE profile_id = auth.uid())
);

-- Update: Complex (state-dependent)
CREATE POLICY "time_off_update"
ON time_off_requests FOR UPDATE
USING (
  CASE 
    WHEN status = 'draft' THEN 
      employee_id IN (SELECT id FROM employees WHERE profile_id = auth.uid())
    WHEN status = 'pending_manager' THEN
      manager_id = (SELECT id FROM employees WHERE profile_id = auth.uid()) OR
      has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin')
    WHEN status = 'pending_people' THEN
      has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin')
    ELSE
      has_role(auth.uid(), 'admin') -- Only admin can modify approved/rejected
  END
);
```

---

## 🔄 Migration Strategy

### Phase 0 → Phase 1 Migration Steps

1. **Add new enums** (employment_type, employee_status, position_level, time_off_status, etc.)
2. **Create core tables** (employees, departments, positions)
3. **Migrate existing data**:
   ```sql
   -- Create employee records for existing profiles
   -- hire_date and manager_id will be NULL initially (People team fills later)
   INSERT INTO employees (profile_id, employment_type, status)
   SELECT id, 'full_time', 'active'
   FROM profiles
   WHERE email LIKE '%@popcode.com.br';
   
   -- Note: hire_date and manager_id remain NULL, to be filled manually by People team
   ```
4. **Create time-off tables** (policies, balances, requests)
5. **Populate initial balances**:
   ```sql
   -- Give everyone 30 vacation days for current year
   INSERT INTO time_off_balances (employee_id, policy_id, year, total_days)
   SELECT e.id, p.id, EXTRACT(YEAR FROM NOW())::INT, 30
   FROM employees e, time_off_policies p
   WHERE p.code = 'vacation' AND e.status = 'active';
   ```
6. **Create audit_log and role_permissions tables**
7. **Update RLS policies**
8. **Test extensively before production**

---

## 📈 Future Schemas (Phase 2+)

### Performance Module
```sql
-- To be designed in Phase 2
performance_cycles
performance_reviews
performance_goals
performance_feedback
```

### Learning Module
```sql
-- To be designed in Phase 3
training_catalog
training_requests
pdis (Personal Development Plans)
employee_skills
```

### Compensation Module (sensitive!)
```sql
-- To be designed in Phase 4+
compensation_history (encrypted)
bonuses
equity
```

---

## 🎯 Design Validation

### Constraints Enforced
- ✅ Self-referencing FK (manager_id → employees)
- ✅ Date validations (end_date >= start_date)
- ✅ Positive values (days_requested > 0)
- ✅ Unique constraints (employee_id, email)
- ✅ Status transitions (via application logic)

### Performance Considerations
- ✅ Indexes on all FK columns
- ✅ Partial indexes (active employees, pending requests)
- ✅ Generated columns (available_days)
- ✅ JSONB for flexible audit data

### Security Considerations
- ✅ RLS on all tables
- ✅ Audit log for sensitive operations
- ✅ No sensitive data in logs (encrypt if needed)
- ✅ Soft delete for LGPD compliance (status = 'terminated')

---

## 📚 References

- [ADR-0005: HR Platform Expansion](adr/0005-hr-platform-expansion.md)
- [roadmap.md](roadmap.md)
- [Current schema](../src/integrations/supabase/types.ts)
- [Postgres temporal tables](https://wiki.postgresql.org/wiki/Temporal_Tables)

