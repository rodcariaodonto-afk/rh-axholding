-- Enums
DO $$ BEGIN CREATE TYPE public.document_kind AS ENUM ('contrato_admissao','aditivo','distrato','recibo','ferias','advertencia','declaracao','procuracao','politica','outro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.document_status AS ENUM ('rascunho','aguardando_assinatura','assinado','recusado','arquivado','expirado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.signature_provider AS ENUM ('clicksign','d4sign','zapsign','docusign','manual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.signature_envelope_status AS ENUM ('draft','sent','partially_signed','signed','refused','cancelled','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.signer_status AS ENUM ('pending','signed','refused','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payslip_source AS ENUM ('internal_generated','batch_upload','external'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payslip_ack_status AS ENUM ('pending','viewed','acknowledged','signed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- document_templates
CREATE TABLE IF NOT EXISTS public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  kind public.document_kind NOT NULL,
  body_html text,
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_doc_templates_org ON public.document_templates(organization_id);
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_tpl_view" ON public.document_templates FOR SELECT TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'documents.view'));
CREATE POLICY "doc_tpl_manage" ON public.document_templates FOR ALL TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'documents.manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'documents.manage'));
CREATE TRIGGER trg_doc_tpl_updated_at BEFORE UPDATE ON public.document_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- hr_documents (substituiu employee_documents legado)
CREATE TABLE IF NOT EXISTS public.hr_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  template_id uuid REFERENCES public.document_templates(id) ON DELETE SET NULL,
  kind public.document_kind NOT NULL,
  title text NOT NULL,
  status public.document_status NOT NULL DEFAULT 'rascunho',
  file_path text,
  file_mime text,
  file_size_bytes bigint,
  competency_id uuid REFERENCES public.payroll_competencies(id) ON DELETE SET NULL,
  signature_envelope_id uuid,
  requires_signature boolean NOT NULL DEFAULT false,
  signed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hr_docs_org ON public.hr_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_hr_docs_employee ON public.hr_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_docs_status ON public.hr_documents(status);
ALTER TABLE public.hr_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hr_docs_view_self_or_rh" ON public.hr_documents FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR has_org_permission(auth.uid(), organization_id, 'documents.view'));
CREATE POLICY "hr_docs_manage" ON public.hr_documents FOR ALL TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'documents.manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'documents.manage'));
CREATE TRIGGER trg_hr_docs_updated_at BEFORE UPDATE ON public.hr_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- signature_envelopes
CREATE TABLE IF NOT EXISTS public.signature_envelopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  document_id uuid REFERENCES public.hr_documents(id) ON DELETE CASCADE,
  provider public.signature_provider NOT NULL DEFAULT 'clicksign',
  provider_envelope_id text,
  status public.signature_envelope_status NOT NULL DEFAULT 'draft',
  subject text,
  message text,
  sent_at timestamptz,
  finished_at timestamptz,
  deadline_at timestamptz,
  webhook_payload jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sig_env_org ON public.signature_envelopes(organization_id);
CREATE INDEX IF NOT EXISTS idx_sig_env_doc ON public.signature_envelopes(document_id);
CREATE INDEX IF NOT EXISTS idx_sig_env_provider_id ON public.signature_envelopes(provider, provider_envelope_id);
ALTER TABLE public.signature_envelopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sig_env_view" ON public.signature_envelopes FOR SELECT TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'documents.view'));
CREATE POLICY "sig_env_send" ON public.signature_envelopes FOR INSERT TO authenticated
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'signatures.send'));
CREATE POLICY "sig_env_update" ON public.signature_envelopes FOR UPDATE TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'signatures.send'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'signatures.send'));
CREATE TRIGGER trg_sig_env_updated_at BEFORE UPDATE ON public.signature_envelopes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.hr_documents
  ADD CONSTRAINT hr_documents_signature_envelope_fkey
  FOREIGN KEY (signature_envelope_id) REFERENCES public.signature_envelopes(id) ON DELETE SET NULL;

-- signers
CREATE TABLE IF NOT EXISTS public.signature_envelope_signers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  envelope_id uuid NOT NULL REFERENCES public.signature_envelopes(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  user_id uuid,
  email text NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'sign',
  signing_order int DEFAULT 1,
  status public.signer_status NOT NULL DEFAULT 'pending',
  signed_at timestamptz,
  provider_signer_id text,
  signing_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sig_signers_env ON public.signature_envelope_signers(envelope_id);
ALTER TABLE public.signature_envelope_signers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sig_signers_view_self_or_rh" ON public.signature_envelope_signers FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_org_permission(auth.uid(), organization_id, 'documents.view'));
CREATE POLICY "sig_signers_manage" ON public.signature_envelope_signers FOR ALL TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'signatures.send'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'signatures.send'));
CREATE TRIGGER trg_sig_signers_updated_at BEFORE UPDATE ON public.signature_envelope_signers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- payslips
CREATE TABLE IF NOT EXISTS public.payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  competency_id uuid REFERENCES public.payroll_competencies(id) ON DELETE SET NULL,
  employee_id uuid NOT NULL,
  source public.payslip_source NOT NULL DEFAULT 'internal_generated',
  file_path text NOT NULL,
  file_size_bytes bigint,
  net_amount numeric(14,2),
  gross_amount numeric(14,2),
  ack_status public.payslip_ack_status NOT NULL DEFAULT 'pending',
  viewed_at timestamptz,
  acknowledged_at timestamptz,
  signature_envelope_id uuid REFERENCES public.signature_envelopes(id) ON DELETE SET NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, competency_id, employee_id)
);
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON public.payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_competency ON public.payslips(competency_id);
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payslips_view_self" ON public.payslips FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR has_org_permission(auth.uid(), organization_id, 'payslips.manage'));
CREATE POLICY "payslips_manage" ON public.payslips FOR ALL TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'payslips.manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'payslips.manage'));
CREATE POLICY "payslips_ack_self" ON public.payslips FOR UPDATE TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());
CREATE TRIGGER trg_payslips_updated_at BEFORE UPDATE ON public.payslips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Permissions
INSERT INTO public.permissions (id, module, action, description) VALUES
  ('documents.view',     'documents',  'view',     'Visualizar documentos de colaboradores'),
  ('documents.manage',   'documents',  'manage',   'Gerenciar documentos e templates'),
  ('signatures.send',    'signatures', 'send',     'Enviar documentos para assinatura eletrônica'),
  ('payslips.view_own',  'payslips',   'view_own', 'Visualizar próprios holerites'),
  ('payslips.manage',    'payslips',   'manage',   'Publicar/gerenciar holerites da organização')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r
CROSS JOIN (VALUES ('documents.view'),('documents.manage'),('signatures.send'),('payslips.view_own'),('payslips.manage')) p(id)
WHERE r.slug IN ('admin','people')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r
CROSS JOIN (VALUES ('payslips.view_own')) p(id)
WHERE r.slug IN ('user','manager','coordinator','director')
ON CONFLICT DO NOTHING;

-- Storage bucket employee-files
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-files', 'employee-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "employee_files_read_org" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'employee-files'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM public.organization_members WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "employee_files_insert_rh" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'employee-files'
    AND (storage.foldername(name))[1] IN (
      SELECT om.organization_id::text FROM public.organization_members om
      JOIN public.role_permissions rp ON rp.role_id = om.role_id
      WHERE om.user_id = auth.uid() AND rp.permission_id IN ('documents.manage','payslips.manage')
    )
  );
CREATE POLICY "employee_files_update_rh" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'employee-files'
    AND (storage.foldername(name))[1] IN (
      SELECT om.organization_id::text FROM public.organization_members om
      JOIN public.role_permissions rp ON rp.role_id = om.role_id
      WHERE om.user_id = auth.uid() AND rp.permission_id IN ('documents.manage','payslips.manage')
    )
  );