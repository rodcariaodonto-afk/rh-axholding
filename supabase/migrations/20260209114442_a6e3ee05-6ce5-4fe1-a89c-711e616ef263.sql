
-- STEP 1: Replace all policies that reference has_role()
-- Plus create helper function

-- Helper function for storage policies (no org_id available)
CREATE OR REPLACE FUNCTION public.user_has_org_role_slug(_user_id uuid, _slug text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    JOIN roles r ON om.role_id = r.id
    WHERE om.user_id = _user_id
      AND r.slug = _slug
  )
$$;

-- PUBLIC TABLE POLICIES
DROP POLICY IF EXISTS "profiler_insert" ON public.profiler_history;
CREATE POLICY "profiler_insert" ON public.profiler_history
  FOR INSERT TO authenticated
  WITH CHECK (
    (EXISTS (SELECT 1 FROM employees e WHERE e.id = profiler_history.employee_id AND is_same_org(e.organization_id)))
    AND (employee_id = auth.uid() OR user_has_org_role_slug(auth.uid(), 'admin') OR user_has_org_role_slug(auth.uid(), 'people'))
  );

DROP POLICY IF EXISTS "timeoff_requests_insert" ON public.time_off_requests;
CREATE POLICY "timeoff_requests_insert" ON public.time_off_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    (EXISTS (SELECT 1 FROM employees e WHERE e.id = time_off_requests.employee_id AND is_same_org(e.organization_id)))
    AND (employee_id = auth.uid() OR user_has_org_role_slug(auth.uid(), 'admin') OR user_has_org_role_slug(auth.uid(), 'people'))
  );

DROP POLICY IF EXISTS "permission_audit_log_insert" ON public.permission_audit_log;
CREATE POLICY "permission_audit_log_insert" ON public.permission_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    is_same_org(organization_id)
    AND (has_org_permission(auth.uid(), organization_id, 'users.manage_roles') OR has_org_role(auth.uid(), organization_id, 'admin'))
  );

-- STORAGE POLICIES
DROP POLICY IF EXISTS "Admin and people can read resumes" ON storage.objects;
CREATE POLICY "Admin and people can read resumes" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'resumes' AND (user_has_org_role_slug(auth.uid(), 'admin') OR user_has_org_role_slug(auth.uid(), 'people')));

DROP POLICY IF EXISTS "Admin and people can delete resumes" ON storage.objects;
CREATE POLICY "Admin and people can delete resumes" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'resumes' AND (user_has_org_role_slug(auth.uid(), 'admin') OR user_has_org_role_slug(auth.uid(), 'people')));

DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'employee-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR user_has_org_role_slug(auth.uid(), 'admin') OR user_has_org_role_slug(auth.uid(), 'people')));

DROP POLICY IF EXISTS "Users can read own documents or admin/people" ON storage.objects;
CREATE POLICY "Users can read own documents or admin/people" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'employee-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR user_has_org_role_slug(auth.uid(), 'admin') OR user_has_org_role_slug(auth.uid(), 'people')));

DROP POLICY IF EXISTS "Users can delete own documents or admin/people" ON storage.objects;
CREATE POLICY "Users can delete own documents or admin/people" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'employee-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR user_has_org_role_slug(auth.uid(), 'admin') OR user_has_org_role_slug(auth.uid(), 'people')));

DROP POLICY IF EXISTS "employee_docs_select_hr" ON storage.objects;
CREATE POLICY "employee_docs_select_hr" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'employee-documents' AND (user_has_org_role_slug(auth.uid(), 'admin') OR user_has_org_role_slug(auth.uid(), 'people')));

DROP POLICY IF EXISTS "employee_docs_insert_hr" ON storage.objects;
CREATE POLICY "employee_docs_insert_hr" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'employee-documents' AND (user_has_org_role_slug(auth.uid(), 'admin') OR user_has_org_role_slug(auth.uid(), 'people')));

DROP POLICY IF EXISTS "employee_docs_update_hr" ON storage.objects;
CREATE POLICY "employee_docs_update_hr" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'employee-documents' AND (user_has_org_role_slug(auth.uid(), 'admin') OR user_has_org_role_slug(auth.uid(), 'people')));

DROP POLICY IF EXISTS "employee_docs_delete_admin" ON storage.objects;
CREATE POLICY "employee_docs_delete_admin" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'employee-documents' AND user_has_org_role_slug(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin and people can delete pdi attachments" ON storage.objects;
CREATE POLICY "Admin and people can delete pdi attachments" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'pdi-attachments' AND (user_has_org_role_slug(auth.uid(), 'admin') OR user_has_org_role_slug(auth.uid(), 'people')));

DROP POLICY IF EXISTS "pdi_attach_select_hr" ON storage.objects;
CREATE POLICY "pdi_attach_select_hr" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'pdi-attachments' AND (user_has_org_role_slug(auth.uid(), 'admin') OR user_has_org_role_slug(auth.uid(), 'people')));

DROP POLICY IF EXISTS "pdi_attach_insert_hr" ON storage.objects;
CREATE POLICY "pdi_attach_insert_hr" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pdi-attachments' AND (user_has_org_role_slug(auth.uid(), 'admin') OR user_has_org_role_slug(auth.uid(), 'people')));

DROP POLICY IF EXISTS "pdi_attach_update_hr" ON storage.objects;
CREATE POLICY "pdi_attach_update_hr" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'pdi-attachments' AND (user_has_org_role_slug(auth.uid(), 'admin') OR user_has_org_role_slug(auth.uid(), 'people')));

DROP POLICY IF EXISTS "pdi_attach_delete_admin" ON storage.objects;
CREATE POLICY "pdi_attach_delete_admin" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'pdi-attachments' AND user_has_org_role_slug(auth.uid(), 'admin'));
