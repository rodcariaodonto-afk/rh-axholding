-- =====================================================
-- Phase 1.1: Foundation & Core Schema
-- HR Portal - Time-Off Management System
-- =====================================================

-- 1. CREATE ENUMS
-- =====================================================

CREATE TYPE employment_type AS ENUM (
  'full_time',
  'part_time',
  'contractor',
  'intern'
);

CREATE TYPE employee_status AS ENUM (
  'active',
  'on_leave',
  'terminated'
);

CREATE TYPE position_level AS ENUM (
  'junior',
  'mid',
  'senior',
  'lead',
  'manager',
  'director',
  'executive'
);

CREATE TYPE time_off_status AS ENUM (
  'pending_people',
  'approved',
  'rejected',
  'cancelled'
);

CREATE TYPE permission_module AS ENUM (
  'employees',
  'time_off',
  'devices',
  'reports'
);

CREATE TYPE permission_scope AS ENUM (
  'read',
  'create',
  'update',
  'delete',
  'approve'
);

-- 2. CREATE CORE HR TABLES
-- =====================================================

-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Positions table
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  level position_level NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employees table (extends profiles)
CREATE TABLE employees (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  employment_type employment_type NOT NULL DEFAULT 'full_time',
  status employee_status NOT NULL DEFAULT 'active',
  hire_date DATE,
  termination_date DATE,
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_termination_date CHECK (termination_date IS NULL OR termination_date >= hire_date)
);

-- Indexes for performance
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_position ON employees(position_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_positions_department ON positions(department_id);

-- 3. MIGRATE EXISTING DATA
-- =====================================================

-- Insert all existing profiles into employees table
INSERT INTO employees (id, employment_type, status, hire_date, manager_id)
SELECT 
  id,
  'full_time'::employment_type,
  'active'::employee_status,
  NULL,
  NULL
FROM profiles;

-- 4. CREATE TIME-OFF TABLES
-- =====================================================

-- Time-Off Policies
CREATE TABLE time_off_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  default_days_per_year INTEGER NOT NULL,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  max_consecutive_days INTEGER,
  min_notice_days INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_default_days CHECK (default_days_per_year >= 0),
  CONSTRAINT valid_max_consecutive CHECK (max_consecutive_days IS NULL OR max_consecutive_days > 0),
  CONSTRAINT valid_min_notice CHECK (min_notice_days >= 0)
);

-- Time-Off Balances
CREATE TABLE time_off_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES time_off_policies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  used_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  available_days NUMERIC(5,1) GENERATED ALWAYS AS (total_days - used_days) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(employee_id, policy_id, year),
  CONSTRAINT valid_year CHECK (year >= 2020 AND year <= 2100),
  CONSTRAINT valid_total_days CHECK (total_days >= 0),
  CONSTRAINT valid_used_days CHECK (used_days >= 0 AND used_days <= total_days)
);

-- Time-Off Requests
CREATE TABLE time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES time_off_policies(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMERIC(5,1) NOT NULL,
  status time_off_status NOT NULL DEFAULT 'pending_people',
  notes TEXT,
  reviewed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_total_days CHECK (total_days > 0)
);

-- Indexes for performance
CREATE INDEX idx_time_off_balances_employee ON time_off_balances(employee_id);
CREATE INDEX idx_time_off_balances_year ON time_off_balances(year);
CREATE INDEX idx_time_off_requests_employee ON time_off_requests(employee_id);
CREATE INDEX idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX idx_time_off_requests_dates ON time_off_requests(start_date, end_date);

-- 5. CREATE AUDIT LOG
-- =====================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  is_sensitive BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_sensitive ON audit_log(is_sensitive) WHERE is_sensitive = true;

-- 6. POPULATE INITIAL DATA
-- =====================================================

-- Insert default Time-Off Policies
INSERT INTO time_off_policies (name, description, default_days_per_year, max_consecutive_days, min_notice_days)
VALUES
  ('Vacation', 'Annual vacation days', 30, 30, 7),
  ('Sick Leave', 'Sick leave days', 15, NULL, 0),
  ('Personal Day', 'Personal days for emergencies', 5, 3, 1);

-- Create initial balances for all active employees (current year)
INSERT INTO time_off_balances (employee_id, policy_id, year, total_days, used_days)
SELECT 
  e.id,
  p.id,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  p.default_days_per_year,
  0
FROM employees e
CROSS JOIN time_off_policies p
WHERE e.status = 'active' AND p.is_active = true;

-- 7. ENABLE RLS
-- =====================================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES - DEPARTMENTS
-- =====================================================

CREATE POLICY "Everyone can view departments"
  ON departments FOR SELECT
  USING (true);

CREATE POLICY "Admin and People can manage departments"
  ON departments FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

-- 9. RLS POLICIES - POSITIONS
-- =====================================================

CREATE POLICY "Everyone can view positions"
  ON positions FOR SELECT
  USING (true);

CREATE POLICY "Admin and People can manage positions"
  ON positions FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

-- 10. RLS POLICIES - EMPLOYEES
-- =====================================================

CREATE POLICY "Users can view own employee record"
  ON employees FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "People and Admin can view all employees"
  ON employees FOR SELECT
  USING (has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "People and Admin can manage employees"
  ON employees FOR ALL
  USING (has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin'));

-- 11. RLS POLICIES - TIME-OFF POLICIES
-- =====================================================

CREATE POLICY "Everyone can view active time-off policies"
  ON time_off_policies FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can view all time-off policies"
  ON time_off_policies FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin and People can manage time-off policies"
  ON time_off_policies FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

-- 12. RLS POLICIES - TIME-OFF BALANCES
-- =====================================================

CREATE POLICY "Users can view own balances"
  ON time_off_balances FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "People and Admin can view all balances"
  ON time_off_balances FOR SELECT
  USING (has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "People and Admin can manage balances"
  ON time_off_balances FOR ALL
  USING (has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin'));

-- 13. RLS POLICIES - TIME-OFF REQUESTS
-- =====================================================

CREATE POLICY "Users can view own requests"
  ON time_off_requests FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "People and Admin can view all requests"
  ON time_off_requests FOR SELECT
  USING (has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own requests"
  ON time_off_requests FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update own pending requests"
  ON time_off_requests FOR UPDATE
  USING (employee_id = auth.uid() AND status = 'pending_people')
  WITH CHECK (employee_id = auth.uid() AND status = 'pending_people');

CREATE POLICY "People and Admin can approve/reject requests"
  ON time_off_requests FOR UPDATE
  USING (has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin'));

-- 14. RLS POLICIES - AUDIT LOG
-- =====================================================

CREATE POLICY "Admin can view all audit logs"
  ON audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 15. CREATE TRIGGERS
-- =====================================================

-- Trigger for departments.updated_at
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for positions.updated_at
CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for employees.updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for time_off_policies.updated_at
CREATE TRIGGER update_time_off_policies_updated_at
  BEFORE UPDATE ON time_off_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for time_off_balances.updated_at
CREATE TRIGGER update_time_off_balances_updated_at
  BEFORE UPDATE ON time_off_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for time_off_requests.updated_at
CREATE TRIGGER update_time_off_requests_updated_at
  BEFORE UPDATE ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();