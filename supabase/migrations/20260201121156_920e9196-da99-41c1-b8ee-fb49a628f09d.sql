-- ============================================
-- PoPeople Migration: TABLES (Part 2 - Jobs, PDIs, Time Off)
-- ============================================

-- JOBS
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  position_id UUID REFERENCES public.positions(id),
  department_id UUID REFERENCES public.departments(id),
  status public.job_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- JOB_APPLICATIONS
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
  stage public.candidate_stage NOT NULL DEFAULT 'selecao',
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

-- JOB_DESCRIPTIONS
CREATE TABLE public.job_descriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_type TEXT NOT NULL,
  seniority TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PDIS (Plano de Desenvolvimento Individual)
CREATE TABLE public.pdis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  title TEXT NOT NULL,
  objective TEXT,
  current_state TEXT,
  desired_state TEXT,
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status public.pdi_status NOT NULL DEFAULT 'rascunho',
  progress NUMERIC DEFAULT 0,
  engagement_score NUMERIC DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.employees(id),
  manager_id UUID REFERENCES public.employees(id),
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PDI_GOALS
CREATE TABLE public.pdi_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdi_id UUID NOT NULL REFERENCES public.pdis(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  action_plan TEXT,
  goal_type public.pdi_goal_type NOT NULL DEFAULT 'tecnico',
  due_date DATE NOT NULL,
  weight NUMERIC DEFAULT 1,
  status public.pdi_goal_status NOT NULL DEFAULT 'pendente',
  completion_ratio NUMERIC DEFAULT 0,
  checklist_items JSONB DEFAULT '[]'::jsonb,
  criterion_id UUID,
  training_id UUID,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PDI_COMMENTS
CREATE TABLE public.pdi_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdi_id UUID NOT NULL REFERENCES public.pdis(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.employees(id),
  content TEXT NOT NULL,
  edit_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- PDI_LOGS
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

-- PDI_ATTACHMENTS
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

-- TIME_OFF_POLICIES
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

-- TIME_OFF_BALANCES
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

-- TIME_OFF_REQUESTS
CREATE TABLE public.time_off_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  policy_id UUID NOT NULL REFERENCES public.time_off_policies(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMERIC NOT NULL,
  status public.time_off_status NOT NULL DEFAULT 'pending_people',
  notes TEXT,
  review_notes TEXT,
  reviewed_by UUID REFERENCES public.employees(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);