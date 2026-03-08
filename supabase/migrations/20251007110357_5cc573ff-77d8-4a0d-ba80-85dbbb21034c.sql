-- Phase 1.1.5b: Employee CRUD Schema Expansion

-- Step 1: Create ENUMs
CREATE TYPE gender AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');
CREATE TYPE ethnicity AS ENUM ('white', 'black', 'brown', 'asian', 'indigenous', 'not_declared');
CREATE TYPE marital_status AS ENUM ('single', 'married', 'divorced', 'widowed', 'domestic_partnership', 'prefer_not_to_say');
CREATE TYPE education_level AS ENUM ('elementary', 'high_school', 'technical', 'undergraduate', 'postgraduate', 'masters', 'doctorate', 'postdoc');
CREATE TYPE contract_type AS ENUM ('clt', 'pj', 'internship', 'temporary', 'other');

-- Step 2: Add new columns to employees table
ALTER TABLE employees ADD COLUMN photo_url TEXT;
ALTER TABLE employees ADD COLUMN birth_date DATE;
ALTER TABLE employees ADD COLUMN gender gender;
ALTER TABLE employees ADD COLUMN nationality TEXT DEFAULT 'BR';
ALTER TABLE employees ADD COLUMN birthplace TEXT;
ALTER TABLE employees ADD COLUMN ethnicity ethnicity;
ALTER TABLE employees ADD COLUMN marital_status marital_status;
ALTER TABLE employees ADD COLUMN education_level education_level;
ALTER TABLE employees ADD COLUMN education_course TEXT;

-- Add constraint for birth_date
ALTER TABLE employees ADD CONSTRAINT employees_birth_date_check CHECK (birth_date <= CURRENT_DATE);

-- Step 3: Create units table
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'BR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Populate initial units data
INSERT INTO units (name, city, state, country) VALUES
  ('São Paulo - Sede', 'São Paulo', 'SP', 'BR'),
  ('Remoto', 'N/A', 'N/A', 'BR');

-- Add trigger for units updated_at
CREATE TRIGGER update_units_updated_at
BEFORE UPDATE ON units
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add unit_id to employees
ALTER TABLE employees ADD COLUMN unit_id UUID REFERENCES units(id);
CREATE INDEX idx_employees_unit ON employees(unit_id);

-- Set default unit for existing employees
UPDATE employees SET unit_id = (SELECT id FROM units WHERE name = 'São Paulo - Sede' LIMIT 1);

-- Step 4: Create employees_contact table
CREATE TABLE employees_contact (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contact info
  personal_email TEXT,
  mobile_phone TEXT,
  home_phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- Address
  country TEXT NOT NULL DEFAULT 'BR',
  zip_code TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for zip_code lookups
CREATE INDEX idx_employees_contact_zip ON employees_contact(zip_code);

-- Add trigger for employees_contact updated_at
CREATE TRIGGER update_employees_contact_updated_at
BEFORE UPDATE ON employees_contact
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Populate initial contact data for existing employees
INSERT INTO employees_contact (user_id, country, zip_code, state, city, street, number)
SELECT id, 'BR', '00000-000', 'SP', 'São Paulo', 'A preencher', '0'
FROM auth.users
WHERE email LIKE '%@popcode.com.br'
ON CONFLICT (user_id) DO NOTHING;

-- Step 5: Create employees_contracts table
CREATE TABLE employees_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  contract_type contract_type NOT NULL,
  hire_date DATE NOT NULL,
  probation_days INTEGER DEFAULT 0,
  
  contract_start_date DATE,
  contract_duration_days INTEGER,
  contract_end_date DATE,
  
  base_salary NUMERIC(12,2) NOT NULL,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  modified_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_probation CHECK (probation_days >= 0),
  CONSTRAINT valid_salary CHECK (base_salary >= 0),
  CONSTRAINT valid_contract_dates CHECK (contract_end_date IS NULL OR contract_end_date >= contract_start_date)
);

-- Create indexes for employees_contracts
CREATE INDEX idx_contracts_user_active ON employees_contracts(user_id, is_active);
CREATE INDEX idx_contracts_hire_date ON employees_contracts(hire_date);

-- Add trigger for employees_contracts updated_at
CREATE TRIGGER update_employees_contracts_updated_at
BEFORE UPDATE ON employees_contracts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to auto-set modified_by
CREATE OR REPLACE FUNCTION set_modified_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_employees_contracts_modified_by
BEFORE UPDATE ON employees_contracts
FOR EACH ROW EXECUTE FUNCTION set_modified_by();

-- Step 6: Enable RLS on new tables
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees_contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees_contracts ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for units
CREATE POLICY "units_select" 
ON units FOR SELECT 
USING (true);

CREATE POLICY "units_modify" 
ON units FOR ALL
USING (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'people')
)
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'people')
);

-- Step 8: Create RLS policies for employees_contact
CREATE POLICY "employees_contact_select"
ON employees_contact FOR SELECT
USING (
  auth.uid() = user_id OR
  has_role(auth.uid(), 'people') OR
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "employees_contact_insert"
ON employees_contact FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR
  has_role(auth.uid(), 'people') OR
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "employees_contact_update"
ON employees_contact FOR UPDATE
USING (
  auth.uid() = user_id OR
  has_role(auth.uid(), 'people') OR
  has_role(auth.uid(), 'admin')
)
WITH CHECK (
  auth.uid() = user_id OR
  has_role(auth.uid(), 'people') OR
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "employees_contact_delete"
ON employees_contact FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'people')
);

-- Step 9: Create RLS policies for employees_contracts (ULTRA-RESTRICTED)
CREATE POLICY "employees_contracts_select"
ON employees_contracts FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'people')
);

CREATE POLICY "employees_contracts_insert"
ON employees_contracts FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'people')
);

CREATE POLICY "employees_contracts_update"
ON employees_contracts FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'people')
)
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'people')
);

CREATE POLICY "employees_contracts_delete"
ON employees_contracts FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Step 10: Add comments for documentation
COMMENT ON TABLE units IS 'Company units/offices';
COMMENT ON TABLE employees_contact IS 'Employee contact & address info (editable by user)';
COMMENT ON TABLE employees_contracts IS 'Contractual & salary history (ULTRA-RESTRICTED: Admin + People only)';
COMMENT ON COLUMN employees_contracts.base_salary IS 'LGPD: Dado financeiro - acesso extremamente restrito';
COMMENT ON COLUMN employees_contact.emergency_contact_phone IS 'LGPD: Dado de terceiro - base legal: legítimo interesse';
COMMENT ON COLUMN employees.ethnicity IS 'LGPD: Dado sensível - origem racial/étnica (opt-in)';
COMMENT ON COLUMN employees.photo_url IS 'LGPD: Dado biométrico - identificação facial';