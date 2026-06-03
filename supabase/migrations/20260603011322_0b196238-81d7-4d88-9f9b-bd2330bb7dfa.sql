
-- ============================================================
-- 1. pdi_action_plans: restrict to PDI owner/manager/RH/admin
-- ============================================================
DROP POLICY IF EXISTS "Users can view action plans" ON public.pdi_action_plans;
DROP POLICY IF EXISTS "Users can insert action plans" ON public.pdi_action_plans;
DROP POLICY IF EXISTS "Users can update action plans" ON public.pdi_action_plans;
DROP POLICY IF EXISTS "Users can delete action plans" ON public.pdi_action_plans;

CREATE POLICY "pdi_action_plans_select" ON public.pdi_action_plans
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_action_plans.pdi_id
      AND (
        p.employee_id = auth.uid()
        OR p.manager_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.organization_members om
          JOIN public.roles r ON r.id = om.role_id
          WHERE om.user_id = auth.uid()
            AND om.organization_id = e.organization_id
            AND r.slug = ANY (ARRAY['admin','people'])
        )
      )
  )
);

CREATE POLICY "pdi_action_plans_modify" ON public.pdi_action_plans
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_action_plans.pdi_id
      AND (
        p.manager_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.organization_members om
          JOIN public.roles r ON r.id = om.role_id
          WHERE om.user_id = auth.uid()
            AND om.organization_id = e.organization_id
            AND r.slug = ANY (ARRAY['admin','people'])
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_action_plans.pdi_id
      AND (
        p.manager_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.organization_members om
          JOIN public.roles r ON r.id = om.role_id
          WHERE om.user_id = auth.uid()
            AND om.organization_id = e.organization_id
            AND r.slug = ANY (ARRAY['admin','people'])
        )
      )
  )
);

-- ============================================================
-- 2. pdi_versions: same scoping
-- ============================================================
DROP POLICY IF EXISTS "Users can view pdi versions" ON public.pdi_versions;
DROP POLICY IF EXISTS "Users can insert pdi versions" ON public.pdi_versions;

CREATE POLICY "pdi_versions_select" ON public.pdi_versions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_versions.pdi_id
      AND (
        p.employee_id = auth.uid()
        OR p.manager_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.organization_members om
          JOIN public.roles r ON r.id = om.role_id
          WHERE om.user_id = auth.uid()
            AND om.organization_id = e.organization_id
            AND r.slug = ANY (ARRAY['admin','people'])
        )
      )
  )
);

CREATE POLICY "pdi_versions_insert" ON public.pdi_versions
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_versions.pdi_id
      AND (
        p.manager_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.organization_members om
          JOIN public.roles r ON r.id = om.role_id
          WHERE om.user_id = auth.uid()
            AND om.organization_id = e.organization_id
            AND r.slug = ANY (ARRAY['admin','people'])
        )
      )
  )
);

-- ============================================================
-- 3. b2b_leads: only platform admins can read
-- ============================================================
DROP POLICY IF EXISTS "Org admins can read leads" ON public.b2b_leads;

CREATE POLICY "platform_admins_read_leads" ON public.b2b_leads
FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- ============================================================
-- 4. Storage: justificativa-anexos
-- Path convention: <organization_id>/<employee_id>/<filename>
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view justificativa files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload justificativa files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete justificativa files" ON storage.objects;

CREATE POLICY "justificativa_select_org" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'justificativa-anexos'
  AND (
    (storage.foldername(name))[2] = (auth.uid())::text
    OR has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'admin')
    OR has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'people')
  )
);

CREATE POLICY "justificativa_insert_org" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'justificativa-anexos'
  AND (
    (storage.foldername(name))[2] = (auth.uid())::text
    OR has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'admin')
    OR has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'people')
  )
);

CREATE POLICY "justificativa_delete_org" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'justificativa-anexos'
  AND (
    has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'admin')
    OR has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'people')
  )
);

-- ============================================================
-- 5. Storage: medical-exams write/update/delete
-- ============================================================
DROP POLICY IF EXISTS "medical_exams_write_org" ON storage.objects;
DROP POLICY IF EXISTS "medical_exams_update_org" ON storage.objects;
DROP POLICY IF EXISTS "medical_exams_delete_org" ON storage.objects;

CREATE POLICY "medical_exams_insert_org" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'medical-exams'
  AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND (om.organization_id)::text = (storage.foldername(name))[1]
      AND has_org_permission(auth.uid(), om.organization_id, 'medical_exams.manage')
  )
);

CREATE POLICY "medical_exams_update_org" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'medical-exams'
  AND EXISTS (
    SELECT 1 FROM public.medical_exams me
    WHERE me.file_path = storage.objects.name
      AND has_org_permission(auth.uid(), me.organization_id, 'medical_exams.manage')
  )
);

CREATE POLICY "medical_exams_delete_org" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'medical-exams'
  AND EXISTS (
    SELECT 1 FROM public.medical_exams me
    WHERE me.file_path = storage.objects.name
      AND has_org_permission(auth.uid(), me.organization_id, 'medical_exams.manage')
  )
);

-- ============================================================
-- 6. Storage: onboarding-docs insert
-- ============================================================
DROP POLICY IF EXISTS "onb_storage_insert_rh" ON storage.objects;

CREATE POLICY "onb_storage_insert_rh" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'onboarding-docs'
  AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND (om.organization_id)::text = (storage.foldername(name))[1]
      AND has_org_permission(auth.uid(), om.organization_id, 'onboarding.manage')
  )
);

-- ============================================================
-- 7. Storage: admission-uploads WITH CHECK tightening
-- ============================================================
DROP POLICY IF EXISTS "admission_uploads_rh_all" ON storage.objects;

CREATE POLICY "admission_uploads_rh_all" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'admission-uploads'
  AND EXISTS (
    SELECT 1 FROM public.admission_processes p
    WHERE (p.id)::text = (storage.foldername(storage.objects.name))[1]
      AND user_belongs_to_org(auth.uid(), p.organization_id)
      AND (
        has_org_role(auth.uid(), p.organization_id, 'admin')
        OR has_org_role(auth.uid(), p.organization_id, 'people')
      )
  )
)
WITH CHECK (
  bucket_id = 'admission-uploads'
  AND EXISTS (
    SELECT 1 FROM public.admission_processes p
    WHERE (p.id)::text = (storage.foldername(storage.objects.name))[1]
      AND user_belongs_to_org(auth.uid(), p.organization_id)
      AND (
        has_org_role(auth.uid(), p.organization_id, 'admin')
        OR has_org_role(auth.uid(), p.organization_id, 'people')
      )
  )
);

-- ============================================================
-- 8. Storage: payroll-receipts WITH CHECK tightening
-- ============================================================
DROP POLICY IF EXISTS "payroll_receipts_rh_all" ON storage.objects;

CREATE POLICY "payroll_receipts_rh_all" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'payroll-receipts'
  AND EXISTS (
    SELECT 1 FROM public.payroll_receipt_batches b
    WHERE (b.id)::text = (storage.foldername(storage.objects.name))[1]
      AND user_belongs_to_org(auth.uid(), b.organization_id)
      AND (
        has_org_role(auth.uid(), b.organization_id, 'admin')
        OR has_org_role(auth.uid(), b.organization_id, 'people')
      )
  )
)
WITH CHECK (
  bucket_id = 'payroll-receipts'
  AND EXISTS (
    SELECT 1 FROM public.payroll_receipt_batches b
    WHERE (b.id)::text = (storage.foldername(storage.objects.name))[1]
      AND user_belongs_to_org(auth.uid(), b.organization_id)
      AND (
        has_org_role(auth.uid(), b.organization_id, 'admin')
        OR has_org_role(auth.uid(), b.organization_id, 'people')
      )
  )
);

-- ============================================================
-- 9. Storage: resumes — scope by org path[1]
-- Path convention: <organization_id>/<job_id>/<filename>
-- ============================================================
DROP POLICY IF EXISTS "Admin and people can read resumes" ON storage.objects;
DROP POLICY IF EXISTS "Admin and people can delete resumes" ON storage.objects;

CREATE POLICY "resumes_select_org" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes'
  AND (
    has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'admin')
    OR has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'people')
  )
);

CREATE POLICY "resumes_delete_org" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'resumes'
  AND (
    has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'admin')
    OR has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'people')
  )
);

-- ============================================================
-- 10. Storage: employee-documents HR — scope by org membership
-- Path convention: <user_id>/<filename>  (existing own-folder policy)
-- For HR access, the file belongs to a user that must be in HR's org.
-- ============================================================
DROP POLICY IF EXISTS "employee_docs_select_hr" ON storage.objects;
DROP POLICY IF EXISTS "employee_docs_insert_hr" ON storage.objects;
DROP POLICY IF EXISTS "employee_docs_update_hr" ON storage.objects;
DROP POLICY IF EXISTS "employee_docs_delete_admin" ON storage.objects;

CREATE POLICY "employee_docs_select_hr" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND EXISTS (
    SELECT 1 FROM public.employees e
    WHERE (e.id)::text = (storage.foldername(name))[1]
      AND (
        has_org_role(auth.uid(), e.organization_id, 'admin')
        OR has_org_role(auth.uid(), e.organization_id, 'people')
      )
  )
);

CREATE POLICY "employee_docs_insert_hr" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents'
  AND EXISTS (
    SELECT 1 FROM public.employees e
    WHERE (e.id)::text = (storage.foldername(name))[1]
      AND (
        has_org_role(auth.uid(), e.organization_id, 'admin')
        OR has_org_role(auth.uid(), e.organization_id, 'people')
      )
  )
);

CREATE POLICY "employee_docs_update_hr" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND EXISTS (
    SELECT 1 FROM public.employees e
    WHERE (e.id)::text = (storage.foldername(name))[1]
      AND (
        has_org_role(auth.uid(), e.organization_id, 'admin')
        OR has_org_role(auth.uid(), e.organization_id, 'people')
      )
  )
);

CREATE POLICY "employee_docs_delete_admin" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND EXISTS (
    SELECT 1 FROM public.employees e
    WHERE (e.id)::text = (storage.foldername(name))[1]
      AND has_org_role(auth.uid(), e.organization_id, 'admin')
  )
);

-- ============================================================
-- 11. Storage: pdi-attachments — scope via parent PDI
-- Path convention: <pdi_id>/<filename>
-- ============================================================
DROP POLICY IF EXISTS "Users can read pdi attachments if involved" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload pdi attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admin and people can delete pdi attachments" ON storage.objects;

CREATE POLICY "pdi_attachments_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'pdi-attachments'
  AND EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE (p.id)::text = (storage.foldername(storage.objects.name))[1]
      AND (
        p.employee_id = auth.uid()
        OR p.manager_id = auth.uid()
        OR has_org_role(auth.uid(), e.organization_id, 'admin')
        OR has_org_role(auth.uid(), e.organization_id, 'people')
      )
  )
);

CREATE POLICY "pdi_attachments_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'pdi-attachments'
  AND EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE (p.id)::text = (storage.foldername(storage.objects.name))[1]
      AND (
        p.employee_id = auth.uid()
        OR p.manager_id = auth.uid()
        OR has_org_role(auth.uid(), e.organization_id, 'admin')
        OR has_org_role(auth.uid(), e.organization_id, 'people')
      )
  )
);

CREATE POLICY "pdi_attachments_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'pdi-attachments'
  AND EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE (p.id)::text = (storage.foldername(storage.objects.name))[1]
      AND (
        has_org_role(auth.uid(), e.organization_id, 'admin')
        OR has_org_role(auth.uid(), e.organization_id, 'people')
      )
  )
);

-- ============================================================
-- 12. Storage: company-logos — scope by org path[1]
-- ============================================================
DROP POLICY IF EXISTS "Admins can upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update company logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete company logos" ON storage.objects;

CREATE POLICY "company_logos_insert_org_admin" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'admin')
);

CREATE POLICY "company_logos_update_org_admin" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'admin')
);

CREATE POLICY "company_logos_delete_org_admin" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'admin')
);
