-- ============================================
-- PoPeople Database Migration
-- 06 - STORAGE BUCKETS
-- ============================================
-- Execute após 05-rls-policies.sql
-- ============================================

-- ============================================
-- CRIAR BUCKETS
-- ============================================

-- Bucket para currículos (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Bucket para logos de empresas (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
);

-- ============================================
-- POLÍTICAS DE STORAGE - RESUMES
-- ============================================

-- Candidatos podem fazer upload de currículos
CREATE POLICY "Anyone can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes');

-- Apenas admin/people podem visualizar currículos
CREATE POLICY "Admin and People can view resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'people')
  )
);

-- Admin pode deletar currículos
CREATE POLICY "Admin can delete resumes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resumes' AND 
  has_role(auth.uid(), 'admin')
);

-- ============================================
-- POLÍTICAS DE STORAGE - COMPANY LOGOS
-- ============================================

-- Público pode visualizar logos
CREATE POLICY "Anyone can view company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Admin/People podem fazer upload de logos
CREATE POLICY "Admin and People can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'people')
  )
);

-- Admin/People podem atualizar logos
CREATE POLICY "Admin and People can update logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-logos' AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'people')
  )
);

-- Admin pode deletar logos
CREATE POLICY "Admin can delete logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos' AND 
  has_role(auth.uid(), 'admin')
);

-- ============================================
-- POLÍTICAS DE STORAGE - EMPLOYEE-DOCUMENTS
-- ============================================

-- Colaborador visualiza próprios documentos
CREATE POLICY "employee_docs_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RH visualiza todos os documentos
CREATE POLICY "employee_docs_select_hr"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
);

-- Colaborador faz upload em sua pasta
CREATE POLICY "employee_docs_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RH faz upload em qualquer pasta
CREATE POLICY "employee_docs_insert_hr"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
);

-- RH atualiza documentos
CREATE POLICY "employee_docs_update_hr"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
);

-- Admin deleta documentos
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

-- Colaborador visualiza anexos de seus PDIs
CREATE POLICY "pdi_attach_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pdi-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Manager visualiza anexos de PDIs que gerencia
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

-- RH visualiza todos os anexos
CREATE POLICY "pdi_attach_select_hr"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pdi-attachments' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
);

-- Colaborador faz upload em sua pasta
CREATE POLICY "pdi_attach_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdi-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RH faz upload em qualquer pasta
CREATE POLICY "pdi_attach_insert_hr"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdi-attachments' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
);

-- Colaborador atualiza seus anexos
CREATE POLICY "pdi_attach_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pdi-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RH atualiza qualquer anexo
CREATE POLICY "pdi_attach_update_hr"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pdi-attachments' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
);

-- Admin deleta anexos
CREATE POLICY "pdi_attach_delete_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pdi-attachments' AND
  public.has_role(auth.uid(), 'admin')
);

-- ============================================
-- FIM DO STORAGE
-- ============================================
