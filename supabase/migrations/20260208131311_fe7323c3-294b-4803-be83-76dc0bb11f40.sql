-- =============================================================================
-- MIGRATION: Complete Multi-Tenant RLS Security Fix
-- =============================================================================
-- This migration:
-- 1. Fixes Grupo A: Tables with NO org isolation (BLOCKER - P0 risk)
-- 2. Fixes Grupo B: Tables with PARTIAL org isolation
-- 3. Migrates Grupo C: All 64 policies from has_role() to has_org_role()
-- =============================================================================

-- =============================================================================
-- GRUPO A: FIX TABLES WITHOUT ANY ORG ISOLATION
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A1: employees_demographics - Fix vulnerable policies (LGPD PII)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "demographics_select_admin_people" ON public.employees_demographics;
DROP POLICY IF EXISTS "demographics_modify_admin_people" ON public.employees_demographics;

CREATE POLICY "demographics_select_admin_people" ON public.employees_demographics
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employees_demographics.user_id
      AND r.slug IN ('admin', 'people')
    )
  );

CREATE POLICY "demographics_modify_admin_people" ON public.employees_demographics
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employees_demographics.user_id
      AND r.slug IN ('admin', 'people')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employees_demographics.user_id
      AND r.slug IN ('admin', 'people')
    )
  );

-- -----------------------------------------------------------------------------
-- A2: employees_legal_docs - Fix vulnerable policies (Critical PII: CPF, bank)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "legal_docs_select_admin_people" ON public.employees_legal_docs;
DROP POLICY IF EXISTS "legal_docs_modify_admin_people" ON public.employees_legal_docs;

CREATE POLICY "legal_docs_select_admin_people" ON public.employees_legal_docs
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employees_legal_docs.user_id
      AND r.slug IN ('admin', 'people')
    )
  );

CREATE POLICY "legal_docs_modify_admin_people" ON public.employees_legal_docs
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employees_legal_docs.user_id
      AND r.slug IN ('admin', 'people')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employees_legal_docs.user_id
      AND r.slug IN ('admin', 'people')
    )
  );

-- -----------------------------------------------------------------------------
-- A3: audit_log - Filter by org of the user_id in the log
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "audit_select" ON public.audit_log;

CREATE POLICY "audit_select" ON public.audit_log
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid()
      AND r.slug = 'admin'
      AND om.organization_id = (
        SELECT e.organization_id FROM public.employees e
        WHERE e.id = audit_log.user_id LIMIT 1
      )
    )
  );

-- =============================================================================
-- GRUPO B: FIX TABLES WITH PARTIAL ORG ISOLATION
-- =============================================================================

-- -----------------------------------------------------------------------------
-- B1: employee_documents - Fix INSERT/DELETE (SELECT is OK)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "employee_documents_insert_admin_people" ON public.employee_documents;
DROP POLICY IF EXISTS "employee_documents_delete_admin_people" ON public.employee_documents;

CREATE POLICY "employee_documents_insert_admin_people" ON public.employee_documents
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employee_documents.employee_id
      AND r.slug IN ('admin', 'people')
    )
  );

CREATE POLICY "employee_documents_delete_admin_people" ON public.employee_documents
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employee_documents.employee_id
      AND r.slug IN ('admin', 'people')
    )
  );

-- -----------------------------------------------------------------------------
-- B2: employee_changes - Fix DELETE (SELECT/INSERT are OK)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "employee_changes_delete" ON public.employee_changes;

CREATE POLICY "employee_changes_delete" ON public.employee_changes
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employee_changes.employee_id
      AND r.slug = 'admin'
    )
  );

-- Also fix SELECT and INSERT for employee_changes to use org-scoped check
DROP POLICY IF EXISTS "employee_changes_select" ON public.employee_changes;
DROP POLICY IF EXISTS "employee_changes_insert" ON public.employee_changes;

CREATE POLICY "employee_changes_select" ON public.employee_changes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employee_changes.employee_id
      AND r.slug IN ('admin', 'people')
    )
  );

CREATE POLICY "employee_changes_insert" ON public.employee_changes
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employee_changes.employee_id
      AND r.slug IN ('admin', 'people')
    )
  );

-- =============================================================================
-- GRUPO C: MIGRATE ALL has_role() POLICIES TO has_org_role()
-- =============================================================================

-- -----------------------------------------------------------------------------
-- C1: employees - Root table (7 policies)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "employees_select_admin_people" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_admin_people" ON public.employees;
DROP POLICY IF EXISTS "employees_update_admin_people" ON public.employees;
DROP POLICY IF EXISTS "employees_delete_admin" ON public.employees;

CREATE POLICY "employees_select_admin_people" ON public.employees
  FOR SELECT TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

CREATE POLICY "employees_insert_admin_people" ON public.employees
  FOR INSERT TO authenticated WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

CREATE POLICY "employees_update_admin_people" ON public.employees
  FOR UPDATE TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

CREATE POLICY "employees_delete_admin" ON public.employees
  FOR DELETE TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
  );

-- -----------------------------------------------------------------------------
-- C2: departments - Root table
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "departments_select" ON public.departments;
DROP POLICY IF EXISTS "departments_manage" ON public.departments;

CREATE POLICY "departments_select" ON public.departments
  FOR SELECT TO authenticated USING (
    is_same_org(organization_id)
  );

CREATE POLICY "departments_manage" ON public.departments
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

-- -----------------------------------------------------------------------------
-- C3: positions - Root table
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "positions_select" ON public.positions;
DROP POLICY IF EXISTS "positions_manage" ON public.positions;

CREATE POLICY "positions_select" ON public.positions
  FOR SELECT TO authenticated USING (
    is_same_org(organization_id)
  );

CREATE POLICY "positions_manage" ON public.positions
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

-- -----------------------------------------------------------------------------
-- C4: jobs - Root table
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "jobs_select_member" ON public.jobs;
DROP POLICY IF EXISTS "jobs_manage" ON public.jobs;

CREATE POLICY "jobs_select_member" ON public.jobs
  FOR SELECT TO authenticated USING (
    is_same_org(organization_id)
  );

CREATE POLICY "jobs_manage" ON public.jobs
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

-- -----------------------------------------------------------------------------
-- C5: units - Root table
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "units_select" ON public.units;
DROP POLICY IF EXISTS "units_modify" ON public.units;

CREATE POLICY "units_select" ON public.units
  FOR SELECT TO authenticated USING (
    is_same_org(organization_id)
  );

CREATE POLICY "units_modify" ON public.units
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

-- -----------------------------------------------------------------------------
-- C6: devices - Root table
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "devices_select" ON public.devices;
DROP POLICY IF EXISTS "devices_manage" ON public.devices;

CREATE POLICY "devices_select" ON public.devices
  FOR SELECT TO authenticated USING (
    is_same_org(organization_id)
  );

CREATE POLICY "devices_manage" ON public.devices
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
    OR (user_id = auth.uid())
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

-- -----------------------------------------------------------------------------
-- C7: time_off_policies - Root table
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "time_off_policies_select" ON public.time_off_policies;
DROP POLICY IF EXISTS "time_off_policies_manage" ON public.time_off_policies;

CREATE POLICY "time_off_policies_select" ON public.time_off_policies
  FOR SELECT TO authenticated USING (
    is_same_org(organization_id)
  );

CREATE POLICY "time_off_policies_manage" ON public.time_off_policies
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

-- -----------------------------------------------------------------------------
-- C8: company_culture - Root table
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "culture_select" ON public.company_culture;
DROP POLICY IF EXISTS "culture_manage" ON public.company_culture;

CREATE POLICY "culture_select" ON public.company_culture
  FOR SELECT TO authenticated USING (
    is_same_org(organization_id)
  );

CREATE POLICY "culture_manage" ON public.company_culture
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

-- -----------------------------------------------------------------------------
-- C9: company_cost_settings - Root table
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "cost_settings_select" ON public.company_cost_settings;
DROP POLICY IF EXISTS "cost_settings_manage" ON public.company_cost_settings;

CREATE POLICY "cost_settings_select" ON public.company_cost_settings
  FOR SELECT TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
  );

CREATE POLICY "cost_settings_manage" ON public.company_cost_settings
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
  );

-- -----------------------------------------------------------------------------
-- C10: job_descriptions - Root table
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "job_desc_select" ON public.job_descriptions;
DROP POLICY IF EXISTS "job_desc_manage" ON public.job_descriptions;

CREATE POLICY "job_desc_select" ON public.job_descriptions
  FOR SELECT TO authenticated USING (
    is_same_org(organization_id)
  );

CREATE POLICY "job_desc_manage" ON public.job_descriptions
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

-- -----------------------------------------------------------------------------
-- C11: employees_contact - Child table (via employees)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "contact_select" ON public.employees_contact;
DROP POLICY IF EXISTS "contact_modify" ON public.employees_contact;

CREATE POLICY "contact_select" ON public.employees_contact
  FOR SELECT TO authenticated USING (
    (user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employees_contact.user_id
      AND r.slug IN ('admin', 'people')
    )
  );

CREATE POLICY "contact_modify" ON public.employees_contact
  FOR ALL TO authenticated USING (
    (user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employees_contact.user_id
      AND r.slug IN ('admin', 'people')
    )
  )
  WITH CHECK (
    (user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employees_contact.user_id
      AND r.slug IN ('admin', 'people')
    )
  );

-- -----------------------------------------------------------------------------
-- C12: employees_contracts - Child table (via employees)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "contracts_select" ON public.employees_contracts;
DROP POLICY IF EXISTS "contracts_manage" ON public.employees_contracts;

CREATE POLICY "contracts_select" ON public.employees_contracts
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employees_contracts.user_id
      AND r.slug IN ('admin', 'people')
    )
  );

CREATE POLICY "contracts_manage" ON public.employees_contracts
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employees_contracts.user_id
      AND r.slug IN ('admin', 'people')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employees_contracts.user_id
      AND r.slug IN ('admin', 'people')
    )
  );

-- -----------------------------------------------------------------------------
-- C13: feedbacks - Child table (via employees)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "feedbacks_select" ON public.feedbacks;
DROP POLICY IF EXISTS "feedbacks_insert" ON public.feedbacks;

CREATE POLICY "feedbacks_select" ON public.feedbacks
  FOR SELECT TO authenticated USING (
    (sender_id = auth.uid()) OR
    (receiver_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = feedbacks.sender_id
      AND r.slug IN ('admin', 'people')
    )
  );

CREATE POLICY "feedbacks_insert" ON public.feedbacks
  FOR INSERT TO authenticated WITH CHECK (
    (sender_id = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = feedbacks.sender_id
      AND is_same_org(e.organization_id)
    )
  );

-- -----------------------------------------------------------------------------
-- C14: profiler_history - Child table (via employees)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiler_history_select" ON public.profiler_history;
DROP POLICY IF EXISTS "profiler_history_insert" ON public.profiler_history;

CREATE POLICY "profiler_history_select" ON public.profiler_history
  FOR SELECT TO authenticated USING (
    (employee_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = profiler_history.employee_id
      AND r.slug IN ('admin', 'people')
    )
  );

CREATE POLICY "profiler_history_insert" ON public.profiler_history
  FOR INSERT TO authenticated WITH CHECK (
    (employee_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = profiler_history.employee_id
      AND r.slug IN ('admin', 'people')
    )
  );

-- -----------------------------------------------------------------------------
-- C15: time_off_balances - Child table (via employees)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "time_off_balances_select" ON public.time_off_balances;
DROP POLICY IF EXISTS "time_off_balances_manage" ON public.time_off_balances;

CREATE POLICY "time_off_balances_select" ON public.time_off_balances
  FOR SELECT TO authenticated USING (
    (employee_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = time_off_balances.employee_id
      AND r.slug IN ('admin', 'people')
    )
  );

CREATE POLICY "time_off_balances_manage" ON public.time_off_balances
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = time_off_balances.employee_id
      AND r.slug IN ('admin', 'people')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = time_off_balances.employee_id
      AND r.slug IN ('admin', 'people')
    )
  );

-- -----------------------------------------------------------------------------
-- C16: time_off_requests - Child table (via employees)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "time_off_requests_select" ON public.time_off_requests;
DROP POLICY IF EXISTS "time_off_requests_insert" ON public.time_off_requests;
DROP POLICY IF EXISTS "time_off_requests_update" ON public.time_off_requests;

CREATE POLICY "time_off_requests_select" ON public.time_off_requests
  FOR SELECT TO authenticated USING (
    (employee_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = time_off_requests.employee_id
      AND r.slug IN ('admin', 'people')
    )
  );

CREATE POLICY "time_off_requests_insert" ON public.time_off_requests
  FOR INSERT TO authenticated WITH CHECK (
    (employee_id = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = time_off_requests.employee_id
      AND is_same_org(e.organization_id)
    )
  );

CREATE POLICY "time_off_requests_update" ON public.time_off_requests
  FOR UPDATE TO authenticated USING (
    (employee_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = time_off_requests.employee_id
      AND r.slug IN ('admin', 'people')
    )
  );

-- -----------------------------------------------------------------------------
-- C17: job_applications - Child table (via jobs) - PUBLIC INSERT
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "applications_select" ON public.job_applications;
DROP POLICY IF EXISTS "applications_update" ON public.job_applications;

CREATE POLICY "applications_select" ON public.job_applications
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = j.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE j.id = job_applications.job_id
      AND r.slug IN ('admin', 'people')
    )
  );

CREATE POLICY "applications_update" ON public.job_applications
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = j.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE j.id = job_applications.job_id
      AND r.slug IN ('admin', 'people')
    )
  );

-- -----------------------------------------------------------------------------
-- C18: pdis - Child table (via employees)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "pdis_select" ON public.pdis;
DROP POLICY IF EXISTS "pdis_manage" ON public.pdis;

CREATE POLICY "pdis_select" ON public.pdis
  FOR SELECT TO authenticated USING (
    (employee_id = auth.uid()) OR
    (manager_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = pdis.employee_id
      AND r.slug IN ('admin', 'people')
    )
  );

CREATE POLICY "pdis_manage" ON public.pdis
  FOR ALL TO authenticated USING (
    (manager_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = pdis.employee_id
      AND r.slug IN ('admin', 'people')
    )
  )
  WITH CHECK (
    (manager_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = pdis.employee_id
      AND r.slug IN ('admin', 'people')
    )
  );

-- -----------------------------------------------------------------------------
-- C19: pdi_goals - Child table (via pdis→employees)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "pdi_goals_select" ON public.pdi_goals;
DROP POLICY IF EXISTS "pdi_goals_manage" ON public.pdi_goals;

CREATE POLICY "pdi_goals_select" ON public.pdi_goals
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.pdis p
      JOIN public.employees e ON e.id = p.employee_id
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      WHERE p.id = pdi_goals.pdi_id
      AND (
        p.employee_id = auth.uid() OR
        p.manager_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.roles r WHERE r.id = om.role_id AND r.slug IN ('admin', 'people'))
      )
    )
  );

CREATE POLICY "pdi_goals_manage" ON public.pdi_goals
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.pdis p
      JOIN public.employees e ON e.id = p.employee_id
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE p.id = pdi_goals.pdi_id
      AND (p.manager_id = auth.uid() OR r.slug IN ('admin', 'people'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pdis p
      JOIN public.employees e ON e.id = p.employee_id
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE p.id = pdi_goals.pdi_id
      AND (p.manager_id = auth.uid() OR r.slug IN ('admin', 'people'))
    )
  );

-- -----------------------------------------------------------------------------
-- C20: pdi_comments - Child table (via pdis→employees) - uses user_id, not author_id
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "pdi_comments_select" ON public.pdi_comments;
DROP POLICY IF EXISTS "pdi_comments_insert" ON public.pdi_comments;
DROP POLICY IF EXISTS "pdi_comments_update" ON public.pdi_comments;

CREATE POLICY "pdi_comments_select" ON public.pdi_comments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.pdis p
      JOIN public.employees e ON e.id = p.employee_id
      WHERE p.id = pdi_comments.pdi_id
      AND is_same_org(e.organization_id)
      AND (p.employee_id = auth.uid() OR p.manager_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.organization_members om
          JOIN public.roles r ON r.id = om.role_id
          WHERE om.user_id = auth.uid() AND om.organization_id = e.organization_id
          AND r.slug IN ('admin', 'people')
        )
      )
    )
  );

CREATE POLICY "pdi_comments_insert" ON public.pdi_comments
  FOR INSERT TO authenticated WITH CHECK (
    (user_id = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.pdis p
      JOIN public.employees e ON e.id = p.employee_id
      WHERE p.id = pdi_comments.pdi_id
      AND is_same_org(e.organization_id)
    )
  );

CREATE POLICY "pdi_comments_update" ON public.pdi_comments
  FOR UPDATE TO authenticated USING (
    (user_id = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.pdis p
      JOIN public.employees e ON e.id = p.employee_id
      WHERE p.id = pdi_comments.pdi_id
      AND is_same_org(e.organization_id)
    )
  );

-- -----------------------------------------------------------------------------
-- C21: pdi_logs - Child table (via pdis→employees)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "pdi_logs_select" ON public.pdi_logs;
DROP POLICY IF EXISTS "pdi_logs_insert" ON public.pdi_logs;

CREATE POLICY "pdi_logs_select" ON public.pdi_logs
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.pdis p
      JOIN public.employees e ON e.id = p.employee_id
      WHERE p.id = pdi_logs.pdi_id
      AND is_same_org(e.organization_id)
      AND (p.employee_id = auth.uid() OR p.manager_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.organization_members om
          JOIN public.roles r ON r.id = om.role_id
          WHERE om.user_id = auth.uid() AND om.organization_id = e.organization_id
          AND r.slug IN ('admin', 'people')
        )
      )
    )
  );

CREATE POLICY "pdi_logs_insert" ON public.pdi_logs
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pdis p
      JOIN public.employees e ON e.id = p.employee_id
      WHERE p.id = pdi_logs.pdi_id
      AND is_same_org(e.organization_id)
    )
  );

-- -----------------------------------------------------------------------------
-- C22: pdi_attachments - Child table (via pdis→employees)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "pdi_attachments_select" ON public.pdi_attachments;
DROP POLICY IF EXISTS "pdi_attachments_insert" ON public.pdi_attachments;

CREATE POLICY "pdi_attachments_select" ON public.pdi_attachments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.pdis p
      JOIN public.employees e ON e.id = p.employee_id
      WHERE p.id = pdi_attachments.pdi_id
      AND is_same_org(e.organization_id)
      AND (p.employee_id = auth.uid() OR p.manager_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.organization_members om
          JOIN public.roles r ON r.id = om.role_id
          WHERE om.user_id = auth.uid() AND om.organization_id = e.organization_id
          AND r.slug IN ('admin', 'people')
        )
      )
    )
  );

CREATE POLICY "pdi_attachments_insert" ON public.pdi_attachments
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pdis p
      JOIN public.employees e ON e.id = p.employee_id
      WHERE p.id = pdi_attachments.pdi_id
      AND is_same_org(e.organization_id)
    )
  );

-- -----------------------------------------------------------------------------
-- C23: pending_employees - Root table
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "pending_employees_manage" ON public.pending_employees;

CREATE POLICY "pending_employees_manage" ON public.pending_employees
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

-- -----------------------------------------------------------------------------
-- C24: skill_areas - Root table
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "skill_areas_select" ON public.skill_areas;
DROP POLICY IF EXISTS "skill_areas_manage" ON public.skill_areas;

CREATE POLICY "skill_areas_select" ON public.skill_areas
  FOR SELECT TO authenticated USING (
    is_same_org(organization_id)
  );

CREATE POLICY "skill_areas_manage" ON public.skill_areas
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

-- -----------------------------------------------------------------------------
-- C25: hard_skills - Root table
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "hard_skills_select" ON public.hard_skills;
DROP POLICY IF EXISTS "hard_skills_manage" ON public.hard_skills;

CREATE POLICY "hard_skills_select" ON public.hard_skills
  FOR SELECT TO authenticated USING (
    is_same_org(organization_id)
  );

CREATE POLICY "hard_skills_manage" ON public.hard_skills
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

-- -----------------------------------------------------------------------------
-- C26: soft_skills - Root table
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "soft_skills_select" ON public.soft_skills;
DROP POLICY IF EXISTS "soft_skills_manage" ON public.soft_skills;

CREATE POLICY "soft_skills_select" ON public.soft_skills
  FOR SELECT TO authenticated USING (
    is_same_org(organization_id)
  );

CREATE POLICY "soft_skills_manage" ON public.soft_skills
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

-- -----------------------------------------------------------------------------
-- C27: position_seniority_levels - Child table (via positions)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "position_seniority_levels_select" ON public.position_seniority_levels;
DROP POLICY IF EXISTS "position_seniority_levels_manage" ON public.position_seniority_levels;

CREATE POLICY "position_seniority_levels_select" ON public.position_seniority_levels
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.positions p
      WHERE p.id = position_seniority_levels.position_id
      AND is_same_org(p.organization_id)
    )
  );

CREATE POLICY "position_seniority_levels_manage" ON public.position_seniority_levels
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.positions p
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = p.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE p.id = position_seniority_levels.position_id
      AND r.slug IN ('admin', 'people')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.positions p
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = p.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE p.id = position_seniority_levels.position_id
      AND r.slug IN ('admin', 'people')
    )
  );

-- -----------------------------------------------------------------------------
-- C28: organization_appearance - Root table
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "org_appearance_select" ON public.organization_appearance;
DROP POLICY IF EXISTS "org_appearance_manage" ON public.organization_appearance;

CREATE POLICY "org_appearance_select" ON public.organization_appearance
  FOR SELECT TO authenticated USING (
    is_same_org(organization_id)
  );

CREATE POLICY "org_appearance_manage" ON public.organization_appearance
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
  );

-- -----------------------------------------------------------------------------
-- C29: evaluation_cycles - Root table
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "cycles_select" ON public.evaluation_cycles;
DROP POLICY IF EXISTS "cycles_manage" ON public.evaluation_cycles;

CREATE POLICY "cycles_select" ON public.evaluation_cycles
  FOR SELECT TO authenticated USING (
    is_same_org(organization_id)
  );

CREATE POLICY "cycles_manage" ON public.evaluation_cycles
  FOR ALL TO authenticated USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

-- -----------------------------------------------------------------------------
-- C30: evaluation_participants - Child table (via evaluation_cycles)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "participants_select" ON public.evaluation_participants;
DROP POLICY IF EXISTS "participants_manage" ON public.evaluation_participants;

CREATE POLICY "participants_select" ON public.evaluation_participants
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.evaluation_cycles c
      WHERE c.id = evaluation_participants.cycle_id
      AND is_same_org(c.organization_id)
      AND (
        evaluation_participants.evaluator_id = auth.uid() OR
        evaluation_participants.evaluated_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.organization_members om
          JOIN public.roles r ON r.id = om.role_id
          WHERE om.user_id = auth.uid() AND om.organization_id = c.organization_id
          AND r.slug IN ('admin', 'people')
        )
      )
    )
  );

CREATE POLICY "participants_manage" ON public.evaluation_participants
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.evaluation_cycles c
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = c.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE c.id = evaluation_participants.cycle_id
      AND r.slug IN ('admin', 'people')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.evaluation_cycles c
      JOIN public.organization_members om ON om.user_id = auth.uid() 
        AND om.organization_id = c.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE c.id = evaluation_participants.cycle_id
      AND r.slug IN ('admin', 'people')
    )
  );

-- -----------------------------------------------------------------------------
-- C31: evaluation_responses - Child table (via participants→cycles)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "responses_select" ON public.evaluation_responses;
DROP POLICY IF EXISTS "responses_insert" ON public.evaluation_responses;
DROP POLICY IF EXISTS "responses_update" ON public.evaluation_responses;

CREATE POLICY "responses_select" ON public.evaluation_responses
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.evaluation_participants p
      JOIN public.evaluation_cycles c ON c.id = p.cycle_id
      WHERE p.id = evaluation_responses.participant_id
      AND is_same_org(c.organization_id)
      AND (
        p.evaluator_id = auth.uid() OR
        p.evaluated_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.organization_members om
          JOIN public.roles r ON r.id = om.role_id
          WHERE om.user_id = auth.uid() AND om.organization_id = c.organization_id
          AND r.slug IN ('admin', 'people')
        )
      )
    )
  );

CREATE POLICY "responses_insert" ON public.evaluation_responses
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.evaluation_participants p
      JOIN public.evaluation_cycles c ON c.id = p.cycle_id
      WHERE p.id = evaluation_responses.participant_id
      AND is_same_org(c.organization_id)
      AND p.evaluator_id = auth.uid()
    )
  );

CREATE POLICY "responses_update" ON public.evaluation_responses
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.evaluation_participants p
      JOIN public.evaluation_cycles c ON c.id = p.cycle_id
      WHERE p.id = evaluation_responses.participant_id
      AND is_same_org(c.organization_id)
      AND p.evaluator_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- C32: evaluation_general_comments - Child table (via participants→cycles)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "general_comments_select" ON public.evaluation_general_comments;
DROP POLICY IF EXISTS "general_comments_insert" ON public.evaluation_general_comments;
DROP POLICY IF EXISTS "general_comments_update" ON public.evaluation_general_comments;

CREATE POLICY "general_comments_select" ON public.evaluation_general_comments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.evaluation_participants p
      JOIN public.evaluation_cycles c ON c.id = p.cycle_id
      WHERE p.id = evaluation_general_comments.participant_id
      AND is_same_org(c.organization_id)
      AND (
        p.evaluator_id = auth.uid() OR
        p.evaluated_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.organization_members om
          JOIN public.roles r ON r.id = om.role_id
          WHERE om.user_id = auth.uid() AND om.organization_id = c.organization_id
          AND r.slug IN ('admin', 'people')
        )
      )
    )
  );

CREATE POLICY "general_comments_insert" ON public.evaluation_general_comments
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.evaluation_participants p
      JOIN public.evaluation_cycles c ON c.id = p.cycle_id
      WHERE p.id = evaluation_general_comments.participant_id
      AND is_same_org(c.organization_id)
      AND p.evaluator_id = auth.uid()
    )
  );

CREATE POLICY "general_comments_update" ON public.evaluation_general_comments
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.evaluation_participants p
      JOIN public.evaluation_cycles c ON c.id = p.cycle_id
      WHERE p.id = evaluation_general_comments.participant_id
      AND is_same_org(c.organization_id)
      AND p.evaluator_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- C33: employee_documents SELECT - Update to use org-scoped check
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "employee_documents_select_same_org" ON public.employee_documents;

CREATE POLICY "employee_documents_select_same_org" ON public.employee_documents
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_documents.employee_id
      AND is_same_org(e.organization_id)
    )
  );

-- =============================================================================
-- DEPRECATE has_role() FUNCTION (KEEP FOR ROLLBACK SAFETY)
-- =============================================================================
COMMENT ON FUNCTION public.has_role IS 'DEPRECATED: Use has_org_role() instead. Kept for rollback safety. Will be removed in a future migration.';