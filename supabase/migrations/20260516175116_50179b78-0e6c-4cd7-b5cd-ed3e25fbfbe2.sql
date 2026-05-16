
-- Adicionar token público para portal do colaborador
ALTER TABLE public.onboarding_processes
  ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS portal_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS portal_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS portal_data JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Tabela de documentos do onboarding
CREATE TABLE IF NOT EXISTS public.onboarding_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  process_id UUID NOT NULL REFERENCES public.onboarding_processes(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  doc_label TEXT NOT NULL,
  file_path TEXT,
  file_name TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','enviado','aprovado','rejeitado')),
  required BOOLEAN NOT NULL DEFAULT true,
  uploaded_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_onb_docs_process ON public.onboarding_documents(process_id);

CREATE TRIGGER trg_onb_documents_updated BEFORE UPDATE ON public.onboarding_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.onboarding_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onb_docs_view" ON public.onboarding_documents FOR SELECT
  USING (has_org_permission(auth.uid(), organization_id, 'onboarding.view') OR employee_id = auth.uid());
CREATE POLICY "onb_docs_manage" ON public.onboarding_documents FOR ALL
  USING (has_org_permission(auth.uid(), organization_id, 'onboarding.manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'onboarding.manage'));

-- Bucket privado para documentos do onboarding
INSERT INTO storage.buckets (id, name, public) VALUES ('onboarding-docs', 'onboarding-docs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "onb_storage_view" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'onboarding-docs'
    AND EXISTS (
      SELECT 1 FROM public.onboarding_documents od
      WHERE od.file_path = name
        AND (has_org_permission(auth.uid(), od.organization_id, 'onboarding.view') OR od.employee_id = auth.uid())
    )
  );

CREATE POLICY "onb_storage_insert_rh" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'onboarding-docs'
    AND auth.uid() IS NOT NULL
  );

-- Função pública para acessar onboarding via token
CREATE OR REPLACE FUNCTION public.get_onboarding_by_token(_token TEXT)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _process RECORD;
  _employee RECORD;
  _org RECORD;
  _tasks jsonb;
  _docs jsonb;
BEGIN
  SELECT * INTO _process FROM onboarding_processes WHERE public_token = _token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Token inválido');
  END IF;

  SELECT id, full_name, email INTO _employee FROM employees WHERE id = _process.employee_id;
  SELECT id, name, logo_url INTO _org FROM organizations WHERE id = _process.organization_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id, 'title', t.title, 'task_type', t.task_type,
    'status', t.status, 'required', t.required, 'sort_order', t.sort_order,
    'description', t.description
  ) ORDER BY t.sort_order), '[]'::jsonb)
  INTO _tasks FROM onboarding_tasks t WHERE t.process_id = _process.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', d.id, 'doc_type', d.doc_type, 'doc_label', d.doc_label,
    'status', d.status, 'required', d.required, 'file_name', d.file_name
  )), '[]'::jsonb)
  INTO _docs FROM onboarding_documents d WHERE d.process_id = _process.id;

  RETURN jsonb_build_object(
    'ok', true,
    'process', row_to_json(_process),
    'employee', row_to_json(_employee),
    'organization', row_to_json(_org),
    'tasks', _tasks,
    'documents', _docs
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_onboarding_by_token(TEXT) TO anon, authenticated;
