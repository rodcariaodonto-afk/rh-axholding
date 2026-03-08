-- ============================================
-- PoPeople Migration: RLS Policies (Part 2 - Remaining)
-- ============================================

-- ORGANIZATION_MEMBERS
CREATE POLICY "org_members_select" ON public.organization_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "org_members_manage" ON public.organization_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- EMPLOYEES_CONTACT
CREATE POLICY "contact_select" ON public.employees_contact FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));
CREATE POLICY "contact_modify" ON public.employees_contact FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

-- EMPLOYEES_CONTRACTS
CREATE POLICY "contracts_select" ON public.employees_contracts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));
CREATE POLICY "contracts_manage" ON public.employees_contracts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

-- DEVICES
CREATE POLICY "devices_select" ON public.devices FOR SELECT TO authenticated USING (true);
CREATE POLICY "devices_manage" ON public.devices FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people') OR user_id = auth.uid()) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

-- JOBS
CREATE POLICY "jobs_select" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "jobs_manage" ON public.jobs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

-- JOB_APPLICATIONS (público pode inserir)
CREATE POLICY "applications_insert" ON public.job_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "applications_select" ON public.job_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));
CREATE POLICY "applications_update" ON public.job_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

-- JOB_DESCRIPTIONS
CREATE POLICY "job_desc_select" ON public.job_descriptions FOR SELECT USING (true);
CREATE POLICY "job_desc_manage" ON public.job_descriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

-- PDIS
CREATE POLICY "pdis_select" ON public.pdis FOR SELECT TO authenticated USING (employee_id = auth.uid() OR manager_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));
CREATE POLICY "pdis_manage" ON public.pdis FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people') OR manager_id = auth.uid()) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people') OR manager_id = auth.uid());

-- PDI_GOALS
CREATE POLICY "pdi_goals_select" ON public.pdi_goals FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_goals.pdi_id AND (pdis.employee_id = auth.uid() OR pdis.manager_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))));
CREATE POLICY "pdi_goals_manage" ON public.pdi_goals FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_goals.pdi_id AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people') OR pdis.manager_id = auth.uid() OR pdis.employee_id = auth.uid())));

-- PDI_COMMENTS
CREATE POLICY "pdi_comments_select" ON public.pdi_comments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_comments.pdi_id AND (pdis.employee_id = auth.uid() OR pdis.manager_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))));
CREATE POLICY "pdi_comments_insert" ON public.pdi_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "pdi_comments_update" ON public.pdi_comments FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- PDI_LOGS
CREATE POLICY "pdi_logs_select" ON public.pdi_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_logs.pdi_id AND (pdis.employee_id = auth.uid() OR pdis.manager_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))));
CREATE POLICY "pdi_logs_insert" ON public.pdi_logs FOR INSERT TO authenticated WITH CHECK (logged_by = auth.uid());

-- PDI_ATTACHMENTS
CREATE POLICY "pdi_attach_select" ON public.pdi_attachments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_attachments.pdi_id AND (pdis.employee_id = auth.uid() OR pdis.manager_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))));
CREATE POLICY "pdi_attach_insert" ON public.pdi_attachments FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

-- TIME_OFF_POLICIES
CREATE POLICY "timeoff_policies_select" ON public.time_off_policies FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "timeoff_policies_manage" ON public.time_off_policies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

-- TIME_OFF_BALANCES
CREATE POLICY "timeoff_balances_select" ON public.time_off_balances FOR SELECT TO authenticated USING (employee_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));
CREATE POLICY "timeoff_balances_manage" ON public.time_off_balances FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

-- TIME_OFF_REQUESTS
CREATE POLICY "timeoff_requests_select" ON public.time_off_requests FOR SELECT TO authenticated USING (employee_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));
CREATE POLICY "timeoff_requests_insert" ON public.time_off_requests FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));
CREATE POLICY "timeoff_requests_update" ON public.time_off_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people') OR (employee_id = auth.uid() AND status = 'pending_people'));

-- FEEDBACKS
CREATE POLICY "feedbacks_select" ON public.feedbacks FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));
CREATE POLICY "feedbacks_insert" ON public.feedbacks FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- PROFILER_HISTORY
CREATE POLICY "profiler_select" ON public.profiler_history FOR SELECT TO authenticated USING (employee_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));
CREATE POLICY "profiler_insert" ON public.profiler_history FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

-- COMPANY_CULTURE
CREATE POLICY "culture_select" ON public.company_culture FOR SELECT TO authenticated USING (true);
CREATE POLICY "culture_manage" ON public.company_culture FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'));

-- COMPANY_COST_SETTINGS
CREATE POLICY "cost_settings_select" ON public.company_cost_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "cost_settings_manage" ON public.company_cost_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- AUDIT_LOG
CREATE POLICY "audit_select" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));