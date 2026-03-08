-- ============================================
-- Phase 3: Multi-Tenancy RLS Policies
-- Updates root tables to filter by organization_id
-- ============================================

-- ============================================
-- EMPLOYEES - Add org filter to existing policies
-- ============================================
DROP POLICY IF EXISTS "employees_select_own" ON public.employees;
DROP POLICY IF EXISTS "employees_select_admin_people" ON public.employees;
DROP POLICY IF EXISTS "managers_select_direct_reports" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_admin_people" ON public.employees;
DROP POLICY IF EXISTS "employees_update_admin_people" ON public.employees;
DROP POLICY IF EXISTS "employees_update_own" ON public.employees;
DROP POLICY IF EXISTS "employees_delete_admin" ON public.employees;

CREATE POLICY "employees_select_own" ON public.employees
  FOR SELECT USING (auth.uid() = id AND is_same_org(organization_id));

CREATE POLICY "employees_select_admin_people" ON public.employees
  FOR SELECT USING (
    is_same_org(organization_id) AND 
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );

CREATE POLICY "managers_select_direct_reports" ON public.employees
  FOR SELECT USING (manager_id = auth.uid() AND is_same_org(organization_id));

CREATE POLICY "employees_insert_admin_people" ON public.employees
  FOR INSERT WITH CHECK (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );

CREATE POLICY "employees_update_admin_people" ON public.employees
  FOR UPDATE USING (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  )
  WITH CHECK (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );

CREATE POLICY "employees_update_own" ON public.employees
  FOR UPDATE USING (auth.uid() = id AND is_same_org(organization_id))
  WITH CHECK (auth.uid() = id AND is_same_org(organization_id));

CREATE POLICY "employees_delete_admin" ON public.employees
  FOR DELETE USING (is_same_org(organization_id) AND has_role(auth.uid(), 'admin'));

-- ============================================
-- DEPARTMENTS
-- ============================================
DROP POLICY IF EXISTS "departments_select" ON public.departments;
DROP POLICY IF EXISTS "departments_manage" ON public.departments;

CREATE POLICY "departments_select" ON public.departments
  FOR SELECT USING (is_same_org(organization_id));

CREATE POLICY "departments_manage" ON public.departments
  FOR ALL USING (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  )
  WITH CHECK (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );

-- ============================================
-- POSITIONS
-- ============================================
DROP POLICY IF EXISTS "positions_select" ON public.positions;
DROP POLICY IF EXISTS "positions_manage" ON public.positions;

CREATE POLICY "positions_select" ON public.positions
  FOR SELECT USING (is_same_org(organization_id));

CREATE POLICY "positions_manage" ON public.positions
  FOR ALL USING (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  )
  WITH CHECK (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );

-- ============================================
-- JOBS
-- ============================================
DROP POLICY IF EXISTS "jobs_select" ON public.jobs;
DROP POLICY IF EXISTS "jobs_manage" ON public.jobs;

CREATE POLICY "jobs_select" ON public.jobs
  FOR SELECT USING (is_same_org(organization_id) OR status = 'active');

CREATE POLICY "jobs_manage" ON public.jobs
  FOR ALL USING (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  )
  WITH CHECK (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );

-- ============================================
-- UNITS
-- ============================================
DROP POLICY IF EXISTS "units_select" ON public.units;
DROP POLICY IF EXISTS "units_modify" ON public.units;

CREATE POLICY "units_select" ON public.units
  FOR SELECT USING (is_same_org(organization_id));

CREATE POLICY "units_modify" ON public.units
  FOR ALL USING (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  )
  WITH CHECK (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );

-- ============================================
-- DEVICES
-- ============================================
DROP POLICY IF EXISTS "devices_select" ON public.devices;
DROP POLICY IF EXISTS "devices_manage" ON public.devices;

CREATE POLICY "devices_select" ON public.devices
  FOR SELECT USING (is_same_org(organization_id));

CREATE POLICY "devices_manage" ON public.devices
  FOR ALL USING (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people') OR user_id = auth.uid())
  )
  WITH CHECK (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );

-- ============================================
-- TIME_OFF_POLICIES
-- ============================================
DROP POLICY IF EXISTS "timeoff_policies_select" ON public.time_off_policies;
DROP POLICY IF EXISTS "timeoff_policies_manage" ON public.time_off_policies;

CREATE POLICY "timeoff_policies_select" ON public.time_off_policies
  FOR SELECT USING (
    is_same_org(organization_id) AND 
    (is_active = true OR has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "timeoff_policies_manage" ON public.time_off_policies
  FOR ALL USING (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  )
  WITH CHECK (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );

-- ============================================
-- COMPANY_CULTURE
-- ============================================
DROP POLICY IF EXISTS "culture_select" ON public.company_culture;
DROP POLICY IF EXISTS "culture_manage" ON public.company_culture;

CREATE POLICY "culture_select" ON public.company_culture
  FOR SELECT USING (is_same_org(organization_id));

CREATE POLICY "culture_manage" ON public.company_culture
  FOR ALL USING (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  )
  WITH CHECK (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );

-- ============================================
-- COMPANY_COST_SETTINGS
-- ============================================
DROP POLICY IF EXISTS "cost_settings_select" ON public.company_cost_settings;
DROP POLICY IF EXISTS "cost_settings_manage" ON public.company_cost_settings;

CREATE POLICY "cost_settings_select" ON public.company_cost_settings
  FOR SELECT USING (is_same_org(organization_id) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "cost_settings_manage" ON public.company_cost_settings
  FOR ALL USING (is_same_org(organization_id) AND has_role(auth.uid(), 'admin'))
  WITH CHECK (is_same_org(organization_id) AND has_role(auth.uid(), 'admin'));

-- ============================================
-- JOB_DESCRIPTIONS
-- ============================================
DROP POLICY IF EXISTS "job_desc_select" ON public.job_descriptions;
DROP POLICY IF EXISTS "job_desc_manage" ON public.job_descriptions;

CREATE POLICY "job_desc_select" ON public.job_descriptions
  FOR SELECT USING (is_same_org(organization_id));

CREATE POLICY "job_desc_manage" ON public.job_descriptions
  FOR ALL USING (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  )
  WITH CHECK (
    is_same_org(organization_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );