-- ============================================
-- SEC-003: Storage Policies para buckets sensíveis
-- ============================================

-- ============================================
-- POLÍTICAS DE STORAGE - EMPLOYEE-DOCUMENTS
-- ============================================

-- Colaborador visualiza próprios documentos (baseado na pasta com seu user_id)
CREATE POLICY "employee_docs_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RH (admin/people) pode visualizar todos os documentos
CREATE POLICY "employee_docs_select_hr"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
);

-- Colaborador pode fazer upload em sua própria pasta
CREATE POLICY "employee_docs_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RH (admin/people) pode fazer upload em qualquer pasta
CREATE POLICY "employee_docs_insert_hr"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
);

-- RH (admin/people) pode atualizar documentos
CREATE POLICY "employee_docs_update_hr"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
);

-- Apenas admin pode deletar documentos
CREATE POLICY "employee_docs_delete_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  public.has_role(auth.uid(), 'admin')
);

-- ============================================
-- POLÍTICAS DE STORAGE - PDI-ATTACHMENTS
-- ============================================

-- Colaborador visualiza anexos de seus próprios PDIs
CREATE POLICY "pdi_attach_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pdi-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Manager pode visualizar anexos de PDIs que gerencia
-- (estrutura: pdi-attachments/{employee_id}/{pdi_id}/arquivo)
CREATE POLICY "pdi_attach_select_manager"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pdi-attachments' AND
  EXISTS (
    SELECT 1 FROM public.pdis
    WHERE pdis.employee_id::text = (storage.foldername(name))[1]
    AND pdis.manager_id = auth.uid()
  )
);

-- RH (admin/people) pode visualizar todos os anexos de PDI
CREATE POLICY "pdi_attach_select_hr"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pdi-attachments' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
);

-- Colaborador pode fazer upload em sua própria pasta de PDI
CREATE POLICY "pdi_attach_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdi-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RH (admin/people) pode fazer upload em qualquer pasta
CREATE POLICY "pdi_attach_insert_hr"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdi-attachments' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
);

-- Colaborador pode atualizar seus próprios anexos
CREATE POLICY "pdi_attach_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pdi-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RH (admin/people) pode atualizar qualquer anexo
CREATE POLICY "pdi_attach_update_hr"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pdi-attachments' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
);

-- Apenas admin pode deletar anexos de PDI
CREATE POLICY "pdi_attach_delete_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pdi-attachments' AND
  public.has_role(auth.uid(), 'admin')
);