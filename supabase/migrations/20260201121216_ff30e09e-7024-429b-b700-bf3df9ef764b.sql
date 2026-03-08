-- ============================================
-- PoPeople Migration: TABLES (Part 3 - Remaining)
-- ============================================

-- FEEDBACKS
CREATE TABLE public.feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.employees(id),
  receiver_id UUID NOT NULL REFERENCES public.employees(id),
  feedback_type public.feedback_type NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROFILER_HISTORY
CREATE TABLE public.profiler_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  profiler_result_code TEXT NOT NULL,
  profiler_result_detail JSONB NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COMPANY_CULTURE
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

-- COMPANY_COST_SETTINGS
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

-- AUDIT_LOG
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