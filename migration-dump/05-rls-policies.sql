-- ============================================
-- PoPeople Database Migration
-- 05 - ROW LEVEL SECURITY POLICIES
-- ============================================
-- Execute após 04-triggers.sql
-- ============================================

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

-- ============================================
-- ORGANIZATIONS
-- ============================================
CREATE POLICY "organizations_select_public" ON public.organizations
  FOR SELECT USING (true);

CREATE POLICY "organizations_manage" ON public.organizations
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

-- ============================================
-- ORGANIZATION_MEMBERS
-- ============================================
CREATE POLICY "organization_members_select_own" ON public.organization_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "organization_members_select_same_org" ON public.organization_members
  FOR SELECT USING (organization_id IN (
    SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
  ));

CREATE POLICY "organization_members_insert_owner_admin" ON public.organization_members
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND (om.is_owner = true OR om.role = 'admin')
  ));

CREATE POLICY "organization_members_update_owner_admin" ON public.organization_members
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND (om.is_owner = true OR om.role = 'admin')
  ));

CREATE POLICY "organization_members_delete_owner" ON public.organization_members
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.is_owner = true
  ));

-- ============================================
-- UNITS
-- ============================================
CREATE POLICY "units_select" ON public.units
  FOR SELECT USING (true);

CREATE POLICY "units_modify" ON public.units
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

-- ============================================
-- POSITIONS
-- ============================================
CREATE POLICY "Everyone can view positions" ON public.positions
  FOR SELECT USING (true);

CREATE POLICY "positions_select_anon" ON public.positions
  FOR SELECT USING (true);

CREATE POLICY "Admin and People can manage positions" ON public.positions
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

-- ============================================
-- EMPLOYEES
-- ============================================
CREATE POLICY "employees_select_own" ON public.employees
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "employees_select_admin_people" ON public.employees
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

CREATE POLICY "managers_select_direct_reports" ON public.employees
  FOR SELECT USING (manager_id = auth.uid());

CREATE POLICY "employees_insert_admin_people" ON public.employees
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

CREATE POLICY "employees_update_admin_people" ON public.employees
  FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

CREATE POLICY "employees_update_own_contact" ON public.employees
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "employees_delete_admin" ON public.employees
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- DEPARTMENTS
-- ============================================
CREATE POLICY "Everyone can view departments" ON public.departments
  FOR SELECT USING (true);

CREATE POLICY "departments_select_anon" ON public.departments
  FOR SELECT USING (true);

CREATE POLICY "Admin and People can manage departments" ON public.departments
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

-- ============================================
-- EMPLOYEES_CONTACT
-- ============================================
CREATE POLICY "employees_contact_select" ON public.employees_contact
  FOR SELECT USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'people') OR 
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "employees_contact_insert" ON public.employees_contact
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'people') OR 
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "employees_contact_update" ON public.employees_contact
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'people') OR 
    has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'people') OR 
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "employees_contact_delete" ON public.employees_contact
  FOR DELETE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

-- ============================================
-- EMPLOYEES_CONTRACTS
-- ============================================
CREATE POLICY "employees_contracts_select" ON public.employees_contracts
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

CREATE POLICY "employees_contracts_insert" ON public.employees_contracts
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

CREATE POLICY "employees_contracts_update" ON public.employees_contracts
  FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

CREATE POLICY "employees_contracts_delete" ON public.employees_contracts
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- USER_ROLES
-- ============================================
CREATE POLICY "Usuários podem ver seus próprios papéis" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Nota: Não há políticas de INSERT/UPDATE/DELETE para user_roles
-- Isso é intencional - roles são gerenciados apenas via trigger ou SQL direto

-- ============================================
-- DEVICES
-- ============================================
CREATE POLICY "Usuários autenticados podem visualizar dispositivos" ON public.devices
  FOR SELECT USING (true);

CREATE POLICY "Admin e People podem adicionar dispositivos" ON public.devices
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

CREATE POLICY "Admin, People e donos podem atualizar dispositivos" ON public.devices
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'people') OR 
    auth.uid() = user_id
  );

CREATE POLICY "Apenas Admin pode excluir dispositivos" ON public.devices
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- JOBS
-- ============================================
CREATE POLICY "jobs_select" ON public.jobs
  FOR SELECT USING (true);

CREATE POLICY "jobs_select_anon" ON public.jobs
  FOR SELECT USING (status = 'active');

CREATE POLICY "jobs_insert" ON public.jobs
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

CREATE POLICY "jobs_update" ON public.jobs
  FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

CREATE POLICY "jobs_delete" ON public.jobs
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- JOB_APPLICATIONS
-- ============================================
CREATE POLICY "job_applications_anon_insert" ON public.job_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "job_applications_auth_insert" ON public.job_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "job_applications_select" ON public.job_applications
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

CREATE POLICY "job_applications_update" ON public.job_applications
  FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

CREATE POLICY "job_applications_delete" ON public.job_applications
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- JOB_DESCRIPTIONS
-- ============================================
CREATE POLICY "Everyone can view job descriptions" ON public.job_descriptions
  FOR SELECT USING (true);

CREATE POLICY "Admin and People can manage job descriptions" ON public.job_descriptions
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

-- ============================================
-- PDIS
-- ============================================
CREATE POLICY "pdis_select" ON public.pdis
  FOR SELECT USING (
    employee_id = auth.uid() OR 
    manager_id = auth.uid() OR 
    has_role(auth.uid(), 'people') OR 
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "pdis_insert" ON public.pdis
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'people') OR 
    has_role(auth.uid(), 'admin') OR 
    manager_id = auth.uid()
  );

CREATE POLICY "pdis_update" ON public.pdis
  FOR UPDATE USING (
    finalized_at IS NULL AND (
      has_role(auth.uid(), 'people') OR 
      has_role(auth.uid(), 'admin') OR 
      manager_id = auth.uid() OR 
      (employee_id = auth.uid() AND status = 'rascunho')
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'people') OR 
    has_role(auth.uid(), 'admin') OR 
    manager_id = auth.uid() OR 
    employee_id = auth.uid()
  );

CREATE POLICY "pdis_delete" ON public.pdis
  FOR DELETE USING (
    has_role(auth.uid(), 'admin') AND 
    NOT EXISTS (
      SELECT 1 FROM pdi_goals WHERE pdi_id = pdis.id AND status = 'concluida'
    )
  );

-- ============================================
-- PDI_GOALS
-- ============================================
CREATE POLICY "pdi_goals_select" ON public.pdi_goals
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM pdis
    WHERE pdis.id = pdi_goals.pdi_id
      AND (
        pdis.employee_id = auth.uid() OR
        pdis.manager_id = auth.uid() OR
        has_role(auth.uid(), 'people') OR
        has_role(auth.uid(), 'admin')
      )
  ));

CREATE POLICY "pdi_goals_modify" ON public.pdi_goals
  FOR ALL USING (EXISTS (
    SELECT 1 FROM pdis
    WHERE pdis.id = pdi_goals.pdi_id
      AND pdis.finalized_at IS NULL
      AND (
        has_role(auth.uid(), 'people') OR
        has_role(auth.uid(), 'admin') OR
        pdis.manager_id = auth.uid() OR
        (pdis.employee_id = auth.uid() AND pdis.status = 'rascunho')
      )
  ));

-- ============================================
-- PDI_COMMENTS
-- ============================================
CREATE POLICY "pdi_comments_select" ON public.pdi_comments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM pdis
    WHERE pdis.id = pdi_comments.pdi_id
      AND (
        pdis.employee_id = auth.uid() OR
        pdis.manager_id = auth.uid() OR
        has_role(auth.uid(), 'people') OR
        has_role(auth.uid(), 'admin')
      )
  ));

CREATE POLICY "pdi_comments_insert" ON public.pdi_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM pdis
      WHERE pdis.id = pdi_comments.pdi_id
        AND (
          pdis.employee_id = auth.uid() OR
          pdis.manager_id = auth.uid() OR
          has_role(auth.uid(), 'people') OR
          has_role(auth.uid(), 'admin')
        )
    )
  );

CREATE POLICY "pdi_comments_update" ON public.pdi_comments
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pdi_comments_delete" ON public.pdi_comments
  FOR DELETE USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- ============================================
-- PDI_LOGS
-- ============================================
CREATE POLICY "pdi_logs_select" ON public.pdi_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM pdis
    WHERE pdis.id = pdi_logs.pdi_id
      AND (
        pdis.employee_id = auth.uid() OR
        pdis.manager_id = auth.uid() OR
        has_role(auth.uid(), 'people') OR
        has_role(auth.uid(), 'admin')
      )
  ));

CREATE POLICY "pdi_logs_insert" ON public.pdi_logs
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM pdis
    WHERE pdis.id = pdi_logs.pdi_id
      AND (
        pdis.employee_id = auth.uid() OR
        pdis.manager_id = auth.uid() OR
        has_role(auth.uid(), 'people') OR
        has_role(auth.uid(), 'admin')
      )
  ));

-- ============================================
-- PDI_ATTACHMENTS
-- ============================================
CREATE POLICY "pdi_attachments_select" ON public.pdi_attachments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM pdis
    WHERE pdis.id = pdi_attachments.pdi_id
      AND (
        pdis.employee_id = auth.uid() OR
        pdis.manager_id = auth.uid() OR
        has_role(auth.uid(), 'people') OR
        has_role(auth.uid(), 'admin')
      )
  ));

CREATE POLICY "pdi_attachments_insert" ON public.pdi_attachments
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM pdis
    WHERE pdis.id = pdi_attachments.pdi_id
      AND pdis.finalized_at IS NULL
      AND (
        pdis.employee_id = auth.uid() OR
        pdis.manager_id = auth.uid() OR
        has_role(auth.uid(), 'people') OR
        has_role(auth.uid(), 'admin')
      )
  ));

CREATE POLICY "pdi_attachments_delete" ON public.pdi_attachments
  FOR DELETE USING (uploaded_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- ============================================
-- TIME_OFF_POLICIES
-- ============================================
CREATE POLICY "Everyone can view active time-off policies" ON public.time_off_policies
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can view all time-off policies" ON public.time_off_policies
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin and People can manage time-off policies" ON public.time_off_policies
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

-- ============================================
-- TIME_OFF_BALANCES
-- ============================================
CREATE POLICY "Users can view own balances" ON public.time_off_balances
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "People and Admin can view all balances" ON public.time_off_balances
  FOR SELECT USING (has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "People and Admin can manage balances" ON public.time_off_balances
  FOR ALL USING (has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin'));

-- ============================================
-- TIME_OFF_REQUESTS
-- ============================================
CREATE POLICY "Users can view own requests" ON public.time_off_requests
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "People and Admin can view all requests" ON public.time_off_requests
  FOR SELECT USING (has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own requests" ON public.time_off_requests
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admin and People can create requests for employees" ON public.time_off_requests
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

CREATE POLICY "Users can update own pending requests" ON public.time_off_requests
  FOR UPDATE USING (employee_id = auth.uid() AND status = 'pending_people')
  WITH CHECK (employee_id = auth.uid() AND status = 'pending_people');

CREATE POLICY "People and Admin can approve/reject requests" ON public.time_off_requests
  FOR UPDATE USING (has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'people') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete requests" ON public.time_off_requests
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- FEEDBACKS
-- ============================================
CREATE POLICY "feedbacks_select_own" ON public.feedbacks
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "feedbacks_select_admin_people" ON public.feedbacks
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

CREATE POLICY "feedbacks_insert" ON public.feedbacks
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "feedbacks_delete" ON public.feedbacks
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- PROFILER_HISTORY
-- ============================================
CREATE POLICY "profiler_history_select_own" ON public.profiler_history
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "profiler_history_select_admin_people" ON public.profiler_history
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

CREATE POLICY "profiler_history_insert" ON public.profiler_history
  FOR INSERT WITH CHECK (
    employee_id = auth.uid() OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'people')
  );

-- ============================================
-- COMPANY_CULTURE
-- ============================================
CREATE POLICY "company_culture_select" ON public.company_culture
  FOR SELECT USING (true);

CREATE POLICY "company_culture_modify" ON public.company_culture
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

-- ============================================
-- COMPANY_COST_SETTINGS
-- ============================================
CREATE POLICY "Admin can view settings" ON public.company_cost_settings
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage settings" ON public.company_cost_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================
-- AUDIT_LOG
-- ============================================
CREATE POLICY "Admin can view all audit logs" ON public.audit_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- FIM DAS RLS POLICIES
-- ============================================
