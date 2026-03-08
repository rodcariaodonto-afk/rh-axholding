-- ============================================
-- PoPeople Migration: CORE TABLES (Part 1)
-- ============================================

-- ORGANIZATIONS
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  employee_count TEXT,
  headquarters_city TEXT,
  work_policy TEXT,
  work_environment TEXT,
  team_structure TEXT,
  tech_stack TEXT,
  benefits JSONB DEFAULT '[]'::jsonb,
  hiring_process_description TEXT,
  hiring_time TEXT,
  interview_format TEXT,
  linkedin_url TEXT,
  instagram_handle TEXT,
  twitter_handle TEXT,
  allowed_domains TEXT[] DEFAULT '{}'::text[],
  settings JSONB DEFAULT '{}'::jsonb,
  plan_type TEXT DEFAULT 'free',
  max_employees INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- UNITS
CREATE TABLE public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'BR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- POSITIONS
CREATE TABLE public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  has_levels BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EMPLOYEES
CREATE TABLE public.employees (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  photo_url TEXT,
  birth_date DATE,
  gender public.gender,
  ethnicity public.ethnicity,
  marital_status public.marital_status,
  nationality TEXT DEFAULT 'BR',
  birthplace TEXT,
  education_level public.education_level,
  education_course TEXT,
  employment_type public.employment_type NOT NULL DEFAULT 'full_time',
  status public.employee_status NOT NULL DEFAULT 'active',
  department_id UUID,
  manager_id UUID,
  unit_id UUID REFERENCES public.units(id),
  base_position_id UUID REFERENCES public.positions(id),
  position_level_detail public.position_level_detail,
  profiler_result_code TEXT,
  profiler_result_detail JSONB,
  profiler_completed_at TIMESTAMPTZ,
  termination_date DATE,
  termination_reason public.termination_reason,
  termination_decision public.termination_decision,
  termination_cause public.termination_cause,
  termination_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Self-reference for manager
ALTER TABLE public.employees ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.employees(id);

-- DEPARTMENTS
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FK de department em employees
ALTER TABLE public.employees ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);

-- USER_ROLES (tabela de papéis separada - crítico para segurança)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- ORGANIZATION_MEMBERS
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  is_owner BOOLEAN DEFAULT false,
  invited_by UUID,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- EMPLOYEES_CONTACT
CREATE TABLE public.employees_contact (
  user_id UUID NOT NULL PRIMARY KEY,
  personal_email TEXT,
  mobile_phone TEXT,
  home_phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
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

-- EMPLOYEES_CONTRACTS
CREATE TABLE public.employees_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contract_type public.contract_type NOT NULL,
  hire_date DATE NOT NULL,
  base_salary NUMERIC NOT NULL,
  probation_days INTEGER DEFAULT 0,
  contract_start_date DATE,
  contract_duration_days INTEGER,
  contract_end_date DATE,
  health_insurance NUMERIC DEFAULT 0,
  dental_insurance NUMERIC DEFAULT 0,
  transportation_voucher NUMERIC DEFAULT 0,
  meal_voucher NUMERIC DEFAULT 0,
  other_benefits NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  modified_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- DEVICES
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.employees(id),
  user_name TEXT NOT NULL,
  device_type public.device_type NOT NULL DEFAULT 'computer',
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  serial TEXT,
  processor TEXT,
  ram INTEGER,
  disk INTEGER,
  screen_size NUMERIC,
  status public.device_status NOT NULL DEFAULT 'borrowed',
  warranty_date DATE,
  hexnode_registered BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);