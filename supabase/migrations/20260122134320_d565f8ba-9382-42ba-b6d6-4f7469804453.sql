-- =============================================
-- 1. Create Storage Bucket for Employee Documents
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-documents',
  'employee-documents',
  false,
  1048576, -- 1MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);

-- =============================================
-- 2. Storage RLS Policies
-- =============================================

-- Admin e People podem fazer upload de documentos
CREATE POLICY "Admin and People can upload employee documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'employee-documents' AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'people'::app_role)
  )
);

-- Admin, People podem ver TODOS os documentos
-- Colaborador pode ver apenas os próprios (pasta com seu ID)
CREATE POLICY "Authorized users can view employee documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'employee-documents' AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'people'::app_role) OR
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Admin e People podem deletar documentos
CREATE POLICY "Admin and People can delete employee documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'employee-documents' AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'people'::app_role)
  )
);

-- Admin e People podem atualizar documentos
CREATE POLICY "Admin and People can update employee documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'employee-documents' AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'people'::app_role)
  )
);

-- =============================================
-- 3. Create employee_documents Table
-- =============================================
CREATE TABLE public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  
  category TEXT,
  description TEXT,
  
  uploaded_by UUID NOT NULL REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster queries
CREATE INDEX idx_employee_documents_employee_id ON employee_documents(employee_id);

-- Enable RLS
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents FORCE ROW LEVEL SECURITY;

-- =============================================
-- 4. Table RLS Policies
-- =============================================

-- SELECT: Admin e People veem todos; Colaborador vê apenas próprios
CREATE POLICY "employee_documents_select"
ON employee_documents FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'people'::app_role) OR
  employee_id = auth.uid()
);

-- INSERT: Apenas Admin e People
CREATE POLICY "employee_documents_insert"
ON employee_documents FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'people'::app_role)
);

-- UPDATE: Apenas Admin e People
CREATE POLICY "employee_documents_update"
ON employee_documents FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'people'::app_role)
);

-- DELETE: Apenas Admin e People
CREATE POLICY "employee_documents_delete"
ON employee_documents FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'people'::app_role)
);

-- Trigger for updated_at
CREATE TRIGGER update_employee_documents_updated_at
  BEFORE UPDATE ON employee_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();