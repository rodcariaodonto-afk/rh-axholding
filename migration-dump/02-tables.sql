-- ============================================
-- PoPeople Database Migration
-- 02 - TABLES
-- ============================================
-- Execute após 01-enums.sql
-- ============================================

-- ============================================
-- ORGANIZATIONS
-- ============================================
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

-- ============================================
-- UNITS
-- ============================================
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

-- ============================================
-- POSITIONS
-- ============================================
CREATE TABLE public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  has_levels BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- EMPLOYEES
-- ============================================
CREATE TABLE public.employees (
  id UUID NOT NULL PRIMARY KEY, -- Referencia auth.users(id)
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  photo_url TEXT,
  birth_date DATE,
  gender gender,
  ethnicity ethnicity,
  marital_status marital_status,
  nationality TEXT DEFAULT 'BR',
  birthplace TEXT,
  education_level education_level,
  education_course TEXT,
  employment_type employment_type NOT NULL DEFAULT 'full_time',
  status employee_status NOT NULL DEFAULT 'active',
  department_id UUID,
  manager_id UUID,
  unit_id UUID,
  base_position_id UUID,
  position_level_detail position_level_detail,
  profiler_result_code TEXT,
  profiler_result_detail JSONB,
  profiler_completed_at TIMESTAMPTZ,
  termination_date DATE,
  termination_reason termination_reason,
  termination_decision termination_decision,
  termination_cause termination_cause,
  termination_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign keys para employees (adicionadas após criar departments)
-- ALTER TABLE public.employees ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);
ALTER TABLE public.employees ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.employees(id);
ALTER TABLE public.employees ADD CONSTRAINT employees_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id);
ALTER TABLE public.employees ADD CONSTRAINT employees_base_position_id_fkey FOREIGN KEY (base_position_id) REFERENCES public.positions(id);

-- ============================================
-- DEPARTMENTS
-- ============================================
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agora adicionar FK de department em employees
ALTER TABLE public.employees ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);

-- ============================================
-- EMPLOYEES_CONTACT
-- ============================================
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

-- ============================================
-- EMPLOYEES_CONTRACTS
-- ============================================
CREATE TABLE public.employees_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contract_type contract_type NOT NULL,
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

-- ============================================
-- ORGANIZATION_MEMBERS
-- ============================================
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  is_owner BOOLEAN DEFAULT false,
  invited_by UUID,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- ============================================
-- USER_ROLES
-- ============================================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- ============================================
-- DEVICES
-- ============================================
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.employees(id),
  user_name TEXT NOT NULL,
  device_type device_type NOT NULL DEFAULT 'computer',
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  serial TEXT,
  processor TEXT,
  ram INTEGER,
  disk INTEGER,
  screen_size NUMERIC,
  status device_status NOT NULL DEFAULT 'borrowed',
  warranty_date DATE,
  hexnode_registered BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- JOBS
-- ============================================
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  position_id UUID REFERENCES public.positions(id),
  department_id UUID REFERENCES public.departments(id),
  status job_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- JOB_APPLICATIONS
-- ============================================
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id),
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_phone TEXT,
  candidate_state TEXT,
  candidate_city TEXT,
  candidate_birth_date DATE,
  candidate_gender TEXT,
  candidate_race TEXT,
  candidate_sexual_orientation TEXT,
  candidate_pcd BOOLEAN DEFAULT false,
  candidate_pcd_type TEXT,
  desired_position TEXT,
  desired_seniority TEXT,
  resume_url TEXT,
  stage candidate_stage NOT NULL DEFAULT 'selecao',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  profiler_result_code TEXT,
  profiler_result_detail JSONB,
  profiler_completed_at TIMESTAMPTZ,
  ai_report TEXT,
  ai_score NUMERIC,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- JOB_DESCRIPTIONS
-- ============================================
CREATE TABLE public.job_descriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_type TEXT NOT NULL,
  seniority TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PDIS (Plano de Desenvolvimento Individual)
-- ============================================
CREATE TABLE public.pdis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  title TEXT NOT NULL,
  objective TEXT,
  current_state TEXT,
  desired_state TEXT,
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status pdi_status NOT NULL DEFAULT 'rascunho',
  progress NUMERIC DEFAULT 0,
  engagement_score NUMERIC DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.employees(id),
  manager_id UUID REFERENCES public.employees(id),
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PDI_GOALS
-- ============================================
CREATE TABLE public.pdi_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdi_id UUID NOT NULL REFERENCES public.pdis(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  action_plan TEXT,
  goal_type pdi_goal_type NOT NULL DEFAULT 'tecnico',
  due_date DATE NOT NULL,
  weight NUMERIC DEFAULT 1,
  status pdi_goal_status NOT NULL DEFAULT 'pendente',
  completion_ratio NUMERIC DEFAULT 0,
  checklist_items JSONB DEFAULT '[]'::jsonb,
  criterion_id UUID,
  training_id UUID,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PDI_COMMENTS
-- ============================================
CREATE TABLE public.pdi_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdi_id UUID NOT NULL REFERENCES public.pdis(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.employees(id),
  content TEXT NOT NULL,
  edit_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- ============================================
-- PDI_LOGS
-- ============================================
CREATE TABLE public.pdi_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdi_id UUID NOT NULL REFERENCES public.pdis(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.pdi_goals(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES public.employees(id),
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PDI_ATTACHMENTS
-- ============================================
CREATE TABLE public.pdi_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdi_id UUID NOT NULL REFERENCES public.pdis(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.pdi_goals(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.employees(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TIME_OFF_POLICIES
-- ============================================
CREATE TABLE public.time_off_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_days_per_year INTEGER NOT NULL,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  max_consecutive_days INTEGER,
  min_notice_days INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TIME_OFF_BALANCES
-- ============================================
CREATE TABLE public.time_off_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  policy_id UUID NOT NULL REFERENCES public.time_off_policies(id),
  year INTEGER NOT NULL,
  total_days NUMERIC NOT NULL DEFAULT 0,
  used_days NUMERIC NOT NULL DEFAULT 0,
  available_days NUMERIC GENERATED ALWAYS AS (total_days - used_days) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, policy_id, year)
);

-- ============================================
-- TIME_OFF_REQUESTS
-- ============================================
CREATE TABLE public.time_off_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  policy_id UUID NOT NULL REFERENCES public.time_off_policies(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMERIC NOT NULL,
  status time_off_status NOT NULL DEFAULT 'pending_people',
  notes TEXT,
  review_notes TEXT,
  reviewed_by UUID REFERENCES public.employees(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- FEEDBACKS
-- ============================================
CREATE TABLE public.feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.employees(id),
  receiver_id UUID NOT NULL REFERENCES public.employees(id),
  feedback_type feedback_type NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PROFILER_HISTORY
-- ============================================
CREATE TABLE public.profiler_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  profiler_result_code TEXT NOT NULL,
  profiler_result_detail JSONB NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- COMPANY_CULTURE
-- ============================================
CREATE TABLE public.company_culture (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission TEXT,
  vision TEXT,
  values JSONB DEFAULT '[]'::jsonb,
  swot_strengths TEXT,
  swot_weaknesses TEXT,
  swot_opportunities TEXT,
  swot_threats TEXT,
  modified_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- COMPANY_COST_SETTINGS
-- ============================================
CREATE TABLE public.company_cost_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inss_employer_rate NUMERIC NOT NULL DEFAULT 20.00,
  fgts_rate NUMERIC NOT NULL DEFAULT 8.00,
  rat_rate NUMERIC NOT NULL DEFAULT 1.00,
  system_s_rate NUMERIC NOT NULL DEFAULT 5.80,
  enable_severance_provision BOOLEAN NOT NULL DEFAULT false,
  modified_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AUDIT_LOG
-- ============================================
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  action TEXT NOT NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  is_sensitive BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_employees_email ON public.employees(email);
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE INDEX idx_employees_department ON public.employees(department_id);
CREATE INDEX idx_employees_manager ON public.employees(manager_id);

CREATE INDEX idx_devices_user ON public.devices(user_id);
CREATE INDEX idx_devices_status ON public.devices(status);
CREATE INDEX idx_devices_type ON public.devices(device_type);
CREATE INDEX idx_devices_serial ON public.devices(serial);

CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_job_applications_job ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_stage ON public.job_applications(stage);

CREATE INDEX idx_pdis_employee ON public.pdis(employee_id);
CREATE INDEX idx_pdis_status ON public.pdis(status);
CREATE INDEX idx_pdi_goals_pdi ON public.pdi_goals(pdi_id);

CREATE INDEX idx_time_off_requests_employee ON public.time_off_requests(employee_id);
CREATE INDEX idx_time_off_requests_status ON public.time_off_requests(status);

CREATE INDEX idx_feedbacks_sender ON public.feedbacks(sender_id);
CREATE INDEX idx_feedbacks_receiver ON public.feedbacks(receiver_id);

CREATE INDEX idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_resource ON public.audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at);

-- ============================================
-- FIM DAS TABELAS
-- ============================================
