-- ============================================
-- SEC-C2: Apply FORCE ROW LEVEL SECURITY
-- to all 27 original tables
-- ============================================
-- Without FORCE, the table owner (typically postgres)
-- bypasses RLS. FORCE ensures RLS is applied even
-- for the table owner, preventing silent policy bypass.
-- ============================================

-- Organizations & Members
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members FORCE ROW LEVEL SECURITY;

-- Reference tables
ALTER TABLE public.units FORCE ROW LEVEL SECURITY;
ALTER TABLE public.positions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.departments FORCE ROW LEVEL SECURITY;

-- Employees
ALTER TABLE public.employees FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employees_contact FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employees_contracts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

-- Devices
ALTER TABLE public.devices FORCE ROW LEVEL SECURITY;

-- Jobs & Applications
ALTER TABLE public.jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.job_descriptions FORCE ROW LEVEL SECURITY;

-- PDIs
ALTER TABLE public.pdis FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_goals FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_comments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_attachments FORCE ROW LEVEL SECURITY;

-- Time Off
ALTER TABLE public.time_off_policies FORCE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_balances FORCE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests FORCE ROW LEVEL SECURITY;

-- Feedbacks & Profiler
ALTER TABLE public.feedbacks FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiler_history FORCE ROW LEVEL SECURITY;

-- Company Settings
ALTER TABLE public.company_culture FORCE ROW LEVEL SECURITY;
ALTER TABLE public.company_cost_settings FORCE ROW LEVEL SECURITY;

-- Audit
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;
