-- Create employee_documents table for storing document uploads
CREATE TABLE public.employee_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT,
  description TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.employee_documents IS 'Stores document uploads for employees';
COMMENT ON COLUMN public.employee_documents.category IS 'Document category: contrato, certificado, documento_pessoal, atestado, outro';
COMMENT ON COLUMN public.employee_documents.file_url IS 'Storage path for signed URL generation';

-- Create index for faster lookups
CREATE INDEX idx_employee_documents_employee_id ON public.employee_documents(employee_id);

-- Enable RLS
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents FORCE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view documents of employees in their organization
CREATE POLICY "employee_documents_select_same_org" ON public.employee_documents
  FOR SELECT TO authenticated
  USING (
    employee_id IN (
      SELECT e.id FROM public.employees e
      WHERE e.organization_id = get_user_organization(auth.uid())
    )
  );

-- Admin/People can insert documents
CREATE POLICY "employee_documents_insert_admin_people" ON public.employee_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people')
  );

-- Admin/People can delete documents
CREATE POLICY "employee_documents_delete_admin_people" ON public.employee_documents
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people')
  );

-- Create trigger for updated_at
CREATE TRIGGER update_employee_documents_updated_at
  BEFORE UPDATE ON public.employee_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();