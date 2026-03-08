-- =============================================================================
-- FASE 4: RLS Multi-Tenancy para Tabelas Filhas (Pattern EXISTS)
-- =============================================================================
-- As tabelas filhas herdam contexto de organização via FK usando EXISTS subqueries
-- Isso mantém o isolamento entre tenants sem precisar de organization_id direto
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. employees_contact: herda via user_id → employees
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "contact_modify" ON public.employees_contact;
DROP POLICY IF EXISTS "contact_select" ON public.employees_contact;

CREATE POLICY "contact_select" ON public.employees_contact
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employees_contact.user_id
    AND is_same_org(e.organization_id)
  ) AND (
    user_id = auth.uid() OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
);

CREATE POLICY "contact_modify" ON public.employees_contact
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employees_contact.user_id
    AND is_same_org(e.organization_id)
  ) AND (
    user_id = auth.uid() OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employees_contact.user_id
    AND is_same_org(e.organization_id)
  ) AND (
    user_id = auth.uid() OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
);

-- -----------------------------------------------------------------------------
-- 2. employees_contracts: herda via user_id → employees
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "contracts_manage" ON public.employees_contracts;
DROP POLICY IF EXISTS "contracts_select" ON public.employees_contracts;

CREATE POLICY "contracts_select" ON public.employees_contracts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employees_contracts.user_id
    AND is_same_org(e.organization_id)
  ) AND (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
);

CREATE POLICY "contracts_manage" ON public.employees_contracts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employees_contracts.user_id
    AND is_same_org(e.organization_id)
  ) AND (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employees_contracts.user_id
    AND is_same_org(e.organization_id)
  ) AND (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
);

-- -----------------------------------------------------------------------------
-- 3. feedbacks: herda via sender_id/receiver_id → employees
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "feedbacks_insert" ON public.feedbacks;
DROP POLICY IF EXISTS "feedbacks_select" ON public.feedbacks;

CREATE POLICY "feedbacks_select" ON public.feedbacks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = feedbacks.sender_id
    AND is_same_org(e.organization_id)
  ) AND (
    sender_id = auth.uid() OR
    receiver_id = auth.uid() OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
);

CREATE POLICY "feedbacks_insert" ON public.feedbacks
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = sender_id
    AND is_same_org(e.organization_id)
  ) AND sender_id = auth.uid()
);

-- -----------------------------------------------------------------------------
-- 4. profiler_history: herda via employee_id → employees
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiler_insert" ON public.profiler_history;
DROP POLICY IF EXISTS "profiler_select" ON public.profiler_history;

CREATE POLICY "profiler_select" ON public.profiler_history
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = profiler_history.employee_id
    AND is_same_org(e.organization_id)
  ) AND (
    employee_id = auth.uid() OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
);

CREATE POLICY "profiler_insert" ON public.profiler_history
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_id
    AND is_same_org(e.organization_id)
  ) AND (
    employee_id = auth.uid() OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
);

-- -----------------------------------------------------------------------------
-- 5. time_off_balances: herda via employee_id → employees
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "timeoff_balances_manage" ON public.time_off_balances;
DROP POLICY IF EXISTS "timeoff_balances_select" ON public.time_off_balances;

CREATE POLICY "timeoff_balances_select" ON public.time_off_balances
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = time_off_balances.employee_id
    AND is_same_org(e.organization_id)
  ) AND (
    employee_id = auth.uid() OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
);

CREATE POLICY "timeoff_balances_manage" ON public.time_off_balances
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = time_off_balances.employee_id
    AND is_same_org(e.organization_id)
  ) AND (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = time_off_balances.employee_id
    AND is_same_org(e.organization_id)
  ) AND (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
);

-- -----------------------------------------------------------------------------
-- 6. time_off_requests: herda via employee_id → employees
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "timeoff_requests_insert" ON public.time_off_requests;
DROP POLICY IF EXISTS "timeoff_requests_select" ON public.time_off_requests;
DROP POLICY IF EXISTS "timeoff_requests_update" ON public.time_off_requests;

CREATE POLICY "timeoff_requests_select" ON public.time_off_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = time_off_requests.employee_id
    AND is_same_org(e.organization_id)
  ) AND (
    employee_id = auth.uid() OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
);

CREATE POLICY "timeoff_requests_insert" ON public.time_off_requests
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_id
    AND is_same_org(e.organization_id)
  ) AND (
    employee_id = auth.uid() OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
);

CREATE POLICY "timeoff_requests_update" ON public.time_off_requests
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = time_off_requests.employee_id
    AND is_same_org(e.organization_id)
  ) AND (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people') OR
    (employee_id = auth.uid() AND status = 'pending_people')
  )
);

-- -----------------------------------------------------------------------------
-- 7. job_applications: herda via job_id → jobs
-- Mantém INSERT público para candidatos externos
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "applications_insert" ON public.job_applications;
DROP POLICY IF EXISTS "applications_select" ON public.job_applications;
DROP POLICY IF EXISTS "applications_update" ON public.job_applications;

-- INSERT: Público para candidatos (mantém comportamento atual)
CREATE POLICY "applications_insert" ON public.job_applications
FOR INSERT WITH CHECK (true);

-- SELECT: Apenas admin/people da mesma org que a vaga
CREATE POLICY "applications_select" ON public.job_applications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_applications.job_id
    AND is_same_org(j.organization_id)
  ) AND (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
);

-- UPDATE: Apenas admin/people da mesma org
CREATE POLICY "applications_update" ON public.job_applications
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_applications.job_id
    AND is_same_org(j.organization_id)
  ) AND (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
);

-- -----------------------------------------------------------------------------
-- 8. pdis: herda via employee_id → employees
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "pdis_manage" ON public.pdis;
DROP POLICY IF EXISTS "pdis_select" ON public.pdis;

CREATE POLICY "pdis_select" ON public.pdis
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = pdis.employee_id
    AND is_same_org(e.organization_id)
  ) AND (
    employee_id = auth.uid() OR
    manager_id = auth.uid() OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people')
  )
);

CREATE POLICY "pdis_manage" ON public.pdis
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = pdis.employee_id
    AND is_same_org(e.organization_id)
  ) AND (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people') OR
    manager_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = pdis.employee_id
    AND is_same_org(e.organization_id)
  ) AND (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'people') OR
    manager_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- 9. pdi_goals: herda via pdi_id → pdis → employees
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "pdi_goals_manage" ON public.pdi_goals;
DROP POLICY IF EXISTS "pdi_goals_select" ON public.pdi_goals;

CREATE POLICY "pdi_goals_select" ON public.pdi_goals
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_goals.pdi_id
    AND is_same_org(e.organization_id)
  ) AND EXISTS (
    SELECT 1 FROM public.pdis
    WHERE pdis.id = pdi_goals.pdi_id AND (
      pdis.employee_id = auth.uid() OR
      pdis.manager_id = auth.uid() OR
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'people')
    )
  )
);

CREATE POLICY "pdi_goals_manage" ON public.pdi_goals
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_goals.pdi_id
    AND is_same_org(e.organization_id)
  ) AND EXISTS (
    SELECT 1 FROM public.pdis
    WHERE pdis.id = pdi_goals.pdi_id AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'people') OR
      pdis.manager_id = auth.uid() OR
      pdis.employee_id = auth.uid()
    )
  )
);

-- -----------------------------------------------------------------------------
-- 10. pdi_comments: herda via pdi_id → pdis → employees
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "pdi_comments_insert" ON public.pdi_comments;
DROP POLICY IF EXISTS "pdi_comments_select" ON public.pdi_comments;
DROP POLICY IF EXISTS "pdi_comments_update" ON public.pdi_comments;

CREATE POLICY "pdi_comments_select" ON public.pdi_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_comments.pdi_id
    AND is_same_org(e.organization_id)
  ) AND EXISTS (
    SELECT 1 FROM public.pdis
    WHERE pdis.id = pdi_comments.pdi_id AND (
      pdis.employee_id = auth.uid() OR
      pdis.manager_id = auth.uid() OR
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'people')
    )
  )
);

CREATE POLICY "pdi_comments_insert" ON public.pdi_comments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_id
    AND is_same_org(e.organization_id)
  ) AND user_id = auth.uid()
);

CREATE POLICY "pdi_comments_update" ON public.pdi_comments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_comments.pdi_id
    AND is_same_org(e.organization_id)
  ) AND user_id = auth.uid()
);

-- -----------------------------------------------------------------------------
-- 11. pdi_logs: herda via pdi_id → pdis → employees
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "pdi_logs_insert" ON public.pdi_logs;
DROP POLICY IF EXISTS "pdi_logs_select" ON public.pdi_logs;

CREATE POLICY "pdi_logs_select" ON public.pdi_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_logs.pdi_id
    AND is_same_org(e.organization_id)
  ) AND EXISTS (
    SELECT 1 FROM public.pdis
    WHERE pdis.id = pdi_logs.pdi_id AND (
      pdis.employee_id = auth.uid() OR
      pdis.manager_id = auth.uid() OR
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'people')
    )
  )
);

CREATE POLICY "pdi_logs_insert" ON public.pdi_logs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_id
    AND is_same_org(e.organization_id)
  ) AND logged_by = auth.uid()
);

-- -----------------------------------------------------------------------------
-- 12. pdi_attachments: herda via pdi_id → pdis → employees
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "pdi_attach_insert" ON public.pdi_attachments;
DROP POLICY IF EXISTS "pdi_attach_select" ON public.pdi_attachments;

CREATE POLICY "pdi_attach_select" ON public.pdi_attachments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_attachments.pdi_id
    AND is_same_org(e.organization_id)
  ) AND EXISTS (
    SELECT 1 FROM public.pdis
    WHERE pdis.id = pdi_attachments.pdi_id AND (
      pdis.employee_id = auth.uid() OR
      pdis.manager_id = auth.uid() OR
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'people')
    )
  )
);

CREATE POLICY "pdi_attach_insert" ON public.pdi_attachments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_id
    AND is_same_org(e.organization_id)
  ) AND uploaded_by = auth.uid()
);