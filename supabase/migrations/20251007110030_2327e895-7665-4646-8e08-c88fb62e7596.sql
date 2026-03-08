-- Phase 1.1.5a: Consolidate profiles → employees
-- ADR-0006: Single source of truth for employee data

-- Step 1: Add email and full_name columns to employees
ALTER TABLE employees ADD COLUMN email TEXT;
ALTER TABLE employees ADD COLUMN full_name TEXT;

-- Step 2: Migrate data from profiles to employees
-- First, ensure every profile has a matching employee record (create if missing)
INSERT INTO employees (id, email, full_name, status, employment_type, hire_date, created_at, updated_at)
SELECT 
  p.id,
  p.email,
  p.full_name,
  'active'::employee_status,
  'full_time'::employment_type,
  CURRENT_DATE,
  p.created_at,
  p.updated_at
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = p.id)
ON CONFLICT (id) DO NOTHING;

-- Update existing employees with profile data
UPDATE employees e
SET 
  email = p.email,
  full_name = p.full_name
FROM profiles p
WHERE e.id = p.id;

-- Step 3: Make email NOT NULL and UNIQUE
ALTER TABLE employees ALTER COLUMN email SET NOT NULL;
CREATE UNIQUE INDEX idx_employees_email ON employees(email);

-- Step 4: Add FK constraint employees.id → auth.users(id)
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_id_fkey;
ALTER TABLE employees ADD CONSTRAINT employees_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 5: Update devices.user_id FK to point to employees instead of auth.users
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_user_id_fkey;
ALTER TABLE devices ADD CONSTRAINT devices_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Step 6: Migrate RLS policies from profiles to employees
-- Drop old profiles policies (they'll be recreated on employees)
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil, admin e people veem todos" ON profiles;

-- Create new RLS policies on employees (merge with existing)
DROP POLICY IF EXISTS "People and Admin can view all employees" ON employees;
DROP POLICY IF EXISTS "Users can view own employee record" ON employees;
DROP POLICY IF EXISTS "People and Admin can manage employees" ON employees;

CREATE POLICY "employees_select_own"
ON employees FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "employees_select_admin_people"
ON employees FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'people')
);

CREATE POLICY "employees_update_own_contact"
ON employees FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "employees_insert_admin_people"
ON employees FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'people')
);

CREATE POLICY "employees_update_admin_people"
ON employees FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'people')
)
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'people')
);

CREATE POLICY "employees_delete_admin"
ON employees FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Step 7: Update handle_new_user() trigger to insert into employees instead of profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar domínio @popcode.com.br
  IF NEW.email NOT LIKE '%@popcode.com.br' THEN
    RAISE EXCEPTION 'Apenas emails do domínio @popcode.com.br são permitidos';
  END IF;

  -- Criar employee (consolidado com profile)
  INSERT INTO public.employees (id, email, full_name, status, employment_type, hire_date)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'active',
    'full_time',
    CURRENT_DATE
  );

  -- Atribuir papel baseado no email
  IF NEW.email = 'hugo@popcode.com.br' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSIF NEW.email IN ('brenda.mendes@popcode.com.br', 'dayse.quirino@popcode.com.br', 'people@popcode.com.br') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'people');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;

-- Step 8: Drop profiles table
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 9: Add comments for documentation
COMMENT ON COLUMN employees.email IS 'User email from auth.users (migrated from profiles)';
COMMENT ON COLUMN employees.full_name IS 'User full name (migrated from profiles)';
COMMENT ON TABLE employees IS 'Consolidated employee records (formerly split between profiles and employees)';