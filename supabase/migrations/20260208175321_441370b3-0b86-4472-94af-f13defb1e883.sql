-- =============================================
-- UNIFICAÇÃO DE SISTEMAS DE ROLES
-- user_roles → organization_members
-- =============================================

-- =============================================
-- FASE 1: PREPARAÇÃO
-- =============================================

-- 1.1 Adicionar organization_id em audit_log
ALTER TABLE public.audit_log 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 1.2 Backfill dados existentes (via employees)
UPDATE public.audit_log al
SET organization_id = (
  SELECT e.organization_id 
  FROM employees e 
  WHERE e.id = al.user_id
  LIMIT 1
)
WHERE organization_id IS NULL AND user_id IS NOT NULL;

-- 1.3 Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(organization_id);

-- 1.4 Remover policies duplicadas em time_off_policies
DROP POLICY IF EXISTS "timeoff_policies_select" ON public.time_off_policies;
DROP POLICY IF EXISTS "timeoff_policies_manage" ON public.time_off_policies;

-- =============================================
-- FASE 2: DROP DAS 16 POLICIES ANTIGAS
-- =============================================

-- organization_members (2)
DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_manage" ON public.organization_members;

-- organizations (3)
DROP POLICY IF EXISTS "organizations_select_member" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_members" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete_owner" ON public.organizations;

-- organization_integrations (1)
DROP POLICY IF EXISTS "integrations_manage_critical" ON public.organization_integrations;

-- pending_employees (1)
DROP POLICY IF EXISTS "pending_emp_manage" ON public.pending_employees;

-- pdi_attachments (1)
DROP POLICY IF EXISTS "pdi_attach_select" ON public.pdi_attachments;

-- position_seniority_levels (1)
DROP POLICY IF EXISTS "seniority_levels_manage" ON public.position_seniority_levels;

-- profiler_history (1)
DROP POLICY IF EXISTS "profiler_select" ON public.profiler_history;

-- time_off_balances (2)
DROP POLICY IF EXISTS "timeoff_balances_select" ON public.time_off_balances;
DROP POLICY IF EXISTS "timeoff_balances_manage" ON public.time_off_balances;

-- time_off_requests (2)
DROP POLICY IF EXISTS "timeoff_requests_select" ON public.time_off_requests;
DROP POLICY IF EXISTS "timeoff_requests_update" ON public.time_off_requests;

-- audit_log (1)
DROP POLICY IF EXISTS "audit_select" ON public.audit_log;

-- =============================================
-- FASE 2: CREATE DAS 16 POLICIES NOVAS (ORG-SCOPED)
-- =============================================

-- organization_members
CREATE POLICY "org_members_select" ON public.organization_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

CREATE POLICY "org_members_manage" ON public.organization_members
  FOR ALL TO authenticated
  USING (has_org_role(auth.uid(), organization_id, 'admin'))
  WITH CHECK (has_org_role(auth.uid(), organization_id, 'admin'));

-- organizations
CREATE POLICY "organizations_select" ON public.organizations
  FOR SELECT TO authenticated
  USING (is_same_org(id));

CREATE POLICY "organizations_update" ON public.organizations
  FOR UPDATE TO authenticated
  USING (
    has_org_role(auth.uid(), id, 'admin')
    OR EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
      AND is_owner = true
    )
  );

CREATE POLICY "organizations_delete" ON public.organizations
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
      AND is_owner = true
    )
  );

-- organization_integrations
CREATE POLICY "integrations_manage_critical" ON public.organization_integrations
  FOR ALL TO authenticated
  USING (
    sensitivity != 'critical'
    OR has_org_role(auth.uid(), organization_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_integrations.organization_id
      AND user_id = auth.uid()
      AND is_owner = true
    )
  )
  WITH CHECK (
    sensitivity != 'critical'
    OR has_org_role(auth.uid(), organization_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_integrations.organization_id
      AND user_id = auth.uid()
      AND is_owner = true
    )
  );

-- pending_employees
CREATE POLICY "pending_emp_manage" ON public.pending_employees
  FOR ALL TO authenticated
  USING (
    is_same_org(organization_id)
    AND (
      has_org_role(auth.uid(), organization_id, 'admin')
      OR has_org_role(auth.uid(), organization_id, 'people')
    )
  )
  WITH CHECK (
    is_same_org(organization_id)
    AND (
      has_org_role(auth.uid(), organization_id, 'admin')
      OR has_org_role(auth.uid(), organization_id, 'people')
    )
  );

-- pdi_attachments
CREATE POLICY "pdi_attach_select" ON public.pdi_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pdis p
      JOIN employees e ON e.id = p.employee_id
      WHERE p.id = pdi_attachments.pdi_id
      AND is_same_org(e.organization_id)
      AND (
        p.employee_id = auth.uid()
        OR p.manager_id = auth.uid()
        OR has_org_role(auth.uid(), e.organization_id, 'admin')
        OR has_org_role(auth.uid(), e.organization_id, 'people')
      )
    )
  );

-- position_seniority_levels
CREATE POLICY "seniority_levels_manage" ON public.position_seniority_levels
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM positions p
      WHERE p.id = position_seniority_levels.position_id
      AND is_same_org(p.organization_id)
      AND (
        has_org_role(auth.uid(), p.organization_id, 'admin')
        OR has_org_role(auth.uid(), p.organization_id, 'people')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM positions p
      WHERE p.id = position_seniority_levels.position_id
      AND is_same_org(p.organization_id)
      AND (
        has_org_role(auth.uid(), p.organization_id, 'admin')
        OR has_org_role(auth.uid(), p.organization_id, 'people')
      )
    )
  );

-- profiler_history
CREATE POLICY "profiler_select" ON public.profiler_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = profiler_history.employee_id
      AND is_same_org(e.organization_id)
      AND (
        profiler_history.employee_id = auth.uid()
        OR has_org_role(auth.uid(), e.organization_id, 'admin')
        OR has_org_role(auth.uid(), e.organization_id, 'people')
      )
    )
  );

-- time_off_balances
CREATE POLICY "timeoff_balances_select" ON public.time_off_balances
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = time_off_balances.employee_id
      AND is_same_org(e.organization_id)
      AND (
        time_off_balances.employee_id = auth.uid()
        OR has_org_role(auth.uid(), e.organization_id, 'admin')
        OR has_org_role(auth.uid(), e.organization_id, 'people')
      )
    )
  );

CREATE POLICY "timeoff_balances_manage" ON public.time_off_balances
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = time_off_balances.employee_id
      AND is_same_org(e.organization_id)
      AND (
        has_org_role(auth.uid(), e.organization_id, 'admin')
        OR has_org_role(auth.uid(), e.organization_id, 'people')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = time_off_balances.employee_id
      AND is_same_org(e.organization_id)
      AND (
        has_org_role(auth.uid(), e.organization_id, 'admin')
        OR has_org_role(auth.uid(), e.organization_id, 'people')
      )
    )
  );

-- time_off_requests
CREATE POLICY "timeoff_requests_select" ON public.time_off_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = time_off_requests.employee_id
      AND is_same_org(e.organization_id)
      AND (
        time_off_requests.employee_id = auth.uid()
        OR has_org_role(auth.uid(), e.organization_id, 'admin')
        OR has_org_role(auth.uid(), e.organization_id, 'people')
      )
    )
  );

CREATE POLICY "timeoff_requests_update" ON public.time_off_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = time_off_requests.employee_id
      AND is_same_org(e.organization_id)
      AND (
        has_org_role(auth.uid(), e.organization_id, 'admin')
        OR has_org_role(auth.uid(), e.organization_id, 'people')
        OR (time_off_requests.employee_id = auth.uid() AND time_off_requests.status = 'pending_people')
      )
    )
  );

-- audit_log
CREATE POLICY "audit_select" ON public.audit_log
  FOR SELECT TO authenticated
  USING (
    organization_id IS NOT NULL
    AND has_org_role(auth.uid(), organization_id, 'admin')
  );

-- =============================================
-- FASE 4: ATUALIZAR TRIGGER handle_new_user()
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  pending RECORD;
BEGIN
  -- REMOVIDO: Não mais inserir em user_roles
  -- As roles são definidas via organization_members quando:
  -- 1. Usuário cria uma organização (via create_employee_for_org RPC)
  -- 2. Usuário aceita convite (via pending_employees flow)

  -- RECONCILIAÇÃO: Buscar pending_employee pelo email
  SELECT * INTO pending
  FROM public.pending_employees
  WHERE email = NEW.email
    AND status = 'invited'
  ORDER BY created_at DESC
  LIMIT 1;

  IF pending IS NOT NULL THEN
    -- Criar employee com dados do pending
    INSERT INTO public.employees (
      id, email, full_name, organization_id,
      department_id, manager_id, base_position_id,
      position_level_detail, unit_id, employment_type, status
    ) VALUES (
      NEW.id, NEW.email, pending.full_name, pending.organization_id,
      pending.department_id, pending.manager_id, pending.base_position_id,
      pending.position_level_detail, pending.unit_id,
      COALESCE(pending.employment_type, 'full_time'), 'active'
    );

    -- Criar contrato se tiver dados
    IF pending.hire_date IS NOT NULL THEN
      INSERT INTO public.employees_contracts (
        user_id, contract_type, hire_date, base_salary
      ) VALUES (
        NEW.id, COALESCE(pending.contract_type, 'clt'),
        pending.hire_date, COALESCE(pending.base_salary, 0)
      );
    END IF;

    -- Criar organization_member COM role_id (não mais user_roles)
    INSERT INTO public.organization_members (
      user_id, organization_id, role_id, invited_by
    ) VALUES (
      NEW.id, pending.organization_id,
      (SELECT id FROM roles WHERE slug = 'user' AND organization_id IS NULL LIMIT 1),
      pending.invited_by
    );

    -- Marcar pending como aceito
    UPDATE public.pending_employees 
    SET status = 'accepted', updated_at = now()
    WHERE id = pending.id;
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================
-- FASE 4: DEPRECAR TABELA user_roles
-- =============================================

COMMENT ON TABLE public.user_roles IS 
  'DEPRECATED (2026-02-08): Use organization_members.role_id para roles. 
   Esta tabela será removida na próxima major version.';