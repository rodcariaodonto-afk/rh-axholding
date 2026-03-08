-- Add missing FK so PostgREST can resolve uploader relationship
ALTER TABLE public.employee_documents
  ADD CONSTRAINT employee_documents_uploaded_by_fkey
  FOREIGN KEY (uploaded_by)
  REFERENCES public.employees(id)
  ON DELETE RESTRICT;

-- Helpful index for filtering/grouping by uploader
CREATE INDEX IF NOT EXISTS idx_employee_documents_uploaded_by
  ON public.employee_documents(uploaded_by);