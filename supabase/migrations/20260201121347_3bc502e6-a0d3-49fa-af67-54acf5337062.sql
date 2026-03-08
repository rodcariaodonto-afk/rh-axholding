-- ============================================
-- PoPeople Migration: FIX Function + RLS Policies (Part 1)
-- ============================================

-- Fix get_organization_public para usar org_slug
DROP FUNCTION IF EXISTS public.get_organization_public(_slug text);
CREATE OR REPLACE FUNCTION public.get_organization_public(org_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  logo_url text,
  website text,
  industry text,
  employee_count text,
  headquarters_city text,
  work_policy text,
  work_environment text,
  team_structure text,
  tech_stack text,
  benefits jsonb,
  hiring_process_description text,
  hiring_time text,
  interview_format text,
  linkedin_url text,
  instagram_handle text,
  twitter_handle text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id, o.name, o.slug, o.description, o.logo_url, o.website, o.industry,
    o.employee_count, o.headquarters_city, o.work_policy, o.work_environment,
    o.team_structure, o.tech_stack, o.benefits, o.hiring_process_description,
    o.hiring_time, o.interview_format, o.linkedin_url, o.instagram_handle, o.twitter_handle
  FROM public.organizations o
  WHERE o.slug = org_slug AND o.is_active = true
  LIMIT 1
$$;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees_contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiler_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_culture ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_cost_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Force RLS
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.units FORCE ROW LEVEL SECURITY;
ALTER TABLE public.positions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employees FORCE ROW LEVEL SECURITY;
ALTER TABLE public.departments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employees_contact FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employees_contracts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.devices FORCE ROW LEVEL SECURITY;
ALTER TABLE public.jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.job_descriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pdis FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_goals FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_comments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_attachments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_policies FORCE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_balances FORCE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiler_history FORCE ROW LEVEL SECURITY;
ALTER TABLE public.company_culture FORCE ROW LEVEL SECURITY;
ALTER TABLE public.company_cost_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: ORGANIZATIONS
-- ============================================
CREATE POLICY "organizations_select_public" ON public.organizations
  FOR SELECT USING (true);

CREATE POLICY "organizations_manage" ON public.organizations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

-- ============================================
-- RLS POLICIES: UNITS
-- ============================================
CREATE POLICY "units_select" ON public.units
  FOR SELECT USING (true);

CREATE POLICY "units_modify" ON public.units
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

-- ============================================
-- RLS POLICIES: POSITIONS
-- ============================================
CREATE POLICY "positions_select" ON public.positions
  FOR SELECT USING (true);

CREATE POLICY "positions_manage" ON public.positions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

-- ============================================
-- RLS POLICIES: DEPARTMENTS
-- ============================================
CREATE POLICY "departments_select" ON public.departments
  FOR SELECT USING (true);

CREATE POLICY "departments_manage" ON public.departments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

-- ============================================
-- RLS POLICIES: USER_ROLES
-- ============================================
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: EMPLOYEES
-- ============================================
CREATE POLICY "employees_select_own" ON public.employees
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "employees_select_admin_people" ON public.employees
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

CREATE POLICY "managers_select_direct_reports" ON public.employees
  FOR SELECT TO authenticated
  USING (manager_id = auth.uid());

CREATE POLICY "employees_insert_admin_people" ON public.employees
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

CREATE POLICY "employees_update_admin_people" ON public.employees
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

CREATE POLICY "employees_update_own" ON public.employees
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "employees_delete_admin" ON public.employees
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));