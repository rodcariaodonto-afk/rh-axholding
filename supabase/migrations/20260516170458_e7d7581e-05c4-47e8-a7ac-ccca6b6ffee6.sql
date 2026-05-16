
-- ========== FASE 3 — ADMISSÃO DIGITAL + RECIBOS/HOLERITES EM LOTE ==========

-- ENUMS
CREATE TYPE public.admission_status AS ENUM ('draft','invited','in_progress','review','signed','completed','cancelled');
CREATE TYPE public.admission_doc_status AS ENUM ('pending','submitted','approved','rejected');
CREATE TYPE public.admission_checklist_status AS ENUM ('pending','done','skipped');
CREATE TYPE public.payroll_batch_status AS ENUM ('draft','matching','ready','published','cancelled');
CREATE TYPE public.payroll_receipt_type AS ENUM ('holerite','recibo','decimo_terceiro','ferias','rescisao');
CREATE TYPE public.payroll_match_status AS ENUM ('matched','ambiguous','unmatched');

-- =========================================================================
-- ADMISSÃO DIGITAL
-- =========================================================================

CREATE TABLE public.admission_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
  employee_id UUID,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_phone TEXT,
  base_position_id UUID,
  department_id UUID,
  manager_id UUID,
  unit_id UUID,
  contract_type TEXT,
  expected_start_date DATE,
  status public.admission_status NOT NULL DEFAULT 'draft',
  responsible_user_id UUID,
  invite_token TEXT UNIQUE,
  invite_expires_at TIMESTAMPTZ,
  invite_sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admission_processes_org ON public.admission_processes(organization_id);
CREATE INDEX idx_admission_processes_status ON public.admission_processes(status);
CREATE INDEX idx_admission_processes_token ON public.admission_processes(invite_token);

CREATE TABLE public.admission_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.admission_processes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  required BOOLEAN NOT NULL DEFAULT true,
  status public.admission_checklist_status NOT NULL DEFAULT 'pending',
  done_at TIMESTAMPTZ,
  done_by UUID,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admission_checklist_process ON public.admission_checklist_items(process_id);

CREATE TABLE public.admission_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.admission_processes(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  doc_label TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT true,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  status public.admission_doc_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  review_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admission_documents_process ON public.admission_documents(process_id);

CREATE TABLE public.admission_form_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL UNIQUE REFERENCES public.admission_processes(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.admission_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.admission_processes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT,
  actor_user_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admission_events_process ON public.admission_events(process_id);

-- RLS
ALTER TABLE public.admission_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_form_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_events ENABLE ROW LEVEL SECURITY;

-- Processes: RH/Admin gerenciam; candidato acessa via Edge Function com token
CREATE POLICY "admission_processes_select" ON public.admission_processes
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "admission_processes_insert" ON public.admission_processes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_belongs_to_org(auth.uid(), organization_id)
    AND (public.has_org_role(auth.uid(), organization_id, 'admin')
      OR public.has_org_role(auth.uid(), organization_id, 'people'))
  );

CREATE POLICY "admission_processes_update" ON public.admission_processes
  FOR UPDATE TO authenticated
  USING (
    public.user_belongs_to_org(auth.uid(), organization_id)
    AND (public.has_org_role(auth.uid(), organization_id, 'admin')
      OR public.has_org_role(auth.uid(), organization_id, 'people'))
  );

CREATE POLICY "admission_processes_delete" ON public.admission_processes
  FOR DELETE TO authenticated
  USING (
    public.has_org_role(auth.uid(), organization_id, 'admin')
  );

-- Child tables: derivam permissão do processo pai
CREATE POLICY "admission_checklist_all" ON public.admission_checklist_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admission_processes p WHERE p.id = process_id AND public.user_belongs_to_org(auth.uid(), p.organization_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admission_processes p WHERE p.id = process_id AND public.user_belongs_to_org(auth.uid(), p.organization_id)));

CREATE POLICY "admission_documents_all" ON public.admission_documents
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admission_processes p WHERE p.id = process_id AND public.user_belongs_to_org(auth.uid(), p.organization_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admission_processes p WHERE p.id = process_id AND public.user_belongs_to_org(auth.uid(), p.organization_id)));

CREATE POLICY "admission_form_data_all" ON public.admission_form_data
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admission_processes p WHERE p.id = process_id AND public.user_belongs_to_org(auth.uid(), p.organization_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admission_processes p WHERE p.id = process_id AND public.user_belongs_to_org(auth.uid(), p.organization_id)));

CREATE POLICY "admission_events_select" ON public.admission_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admission_processes p WHERE p.id = process_id AND public.user_belongs_to_org(auth.uid(), p.organization_id)));

CREATE POLICY "admission_events_insert" ON public.admission_events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admission_processes p WHERE p.id = process_id AND public.user_belongs_to_org(auth.uid(), p.organization_id)));

-- Triggers updated_at
CREATE TRIGGER trg_admission_processes_updated BEFORE UPDATE ON public.admission_processes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_admission_checklist_updated BEFORE UPDATE ON public.admission_checklist_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_admission_documents_updated BEFORE UPDATE ON public.admission_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_admission_form_updated BEFORE UPDATE ON public.admission_form_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- RECIBOS / HOLERITES EM LOTE
-- =========================================================================

CREATE TABLE public.payroll_receipt_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  competency TEXT NOT NULL, -- YYYY-MM
  receipt_type public.payroll_receipt_type NOT NULL,
  status public.payroll_batch_status NOT NULL DEFAULT 'draft',
  description TEXT,
  total_files INTEGER NOT NULL DEFAULT 0,
  matched_count INTEGER NOT NULL DEFAULT 0,
  unmatched_count INTEGER NOT NULL DEFAULT 0,
  ambiguous_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  published_by UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payroll_receipt_batches_org ON public.payroll_receipt_batches(organization_id);
CREATE INDEX idx_payroll_receipt_batches_status ON public.payroll_receipt_batches(status);

CREATE TABLE public.payroll_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.payroll_receipt_batches(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  cpf_lookup TEXT,
  matricula_lookup TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  match_status public.payroll_match_status NOT NULL DEFAULT 'unmatched',
  match_candidates JSONB,
  published BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_ip INET,
  acknowledged_user_agent TEXT,
  download_count INTEGER NOT NULL DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payroll_receipts_batch ON public.payroll_receipts(batch_id);
CREATE INDEX idx_payroll_receipts_employee ON public.payroll_receipts(employee_id);
CREATE INDEX idx_payroll_receipts_org ON public.payroll_receipts(organization_id);

CREATE TABLE public.payroll_receipt_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES public.payroll_receipts(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.payroll_receipt_batches(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  actor_user_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payroll_receipt_events_receipt ON public.payroll_receipt_events(receipt_id);
CREATE INDEX idx_payroll_receipt_events_batch ON public.payroll_receipt_events(batch_id);

-- RLS
ALTER TABLE public.payroll_receipt_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_receipt_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_batches_select" ON public.payroll_receipt_batches
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "payroll_batches_manage" ON public.payroll_receipt_batches
  FOR ALL TO authenticated
  USING (
    public.user_belongs_to_org(auth.uid(), organization_id)
    AND (public.has_org_role(auth.uid(), organization_id, 'admin')
      OR public.has_org_role(auth.uid(), organization_id, 'people'))
  )
  WITH CHECK (
    public.user_belongs_to_org(auth.uid(), organization_id)
    AND (public.has_org_role(auth.uid(), organization_id, 'admin')
      OR public.has_org_role(auth.uid(), organization_id, 'people'))
  );

-- RH vê todos; colaborador vê só os próprios já publicados
CREATE POLICY "payroll_receipts_select_rh" ON public.payroll_receipts
  FOR SELECT TO authenticated
  USING (
    public.user_belongs_to_org(auth.uid(), organization_id)
    AND (public.has_org_role(auth.uid(), organization_id, 'admin')
      OR public.has_org_role(auth.uid(), organization_id, 'people'))
  );

CREATE POLICY "payroll_receipts_select_self" ON public.payroll_receipts
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid() AND published = true);

CREATE POLICY "payroll_receipts_manage_rh" ON public.payroll_receipts
  FOR ALL TO authenticated
  USING (
    public.user_belongs_to_org(auth.uid(), organization_id)
    AND (public.has_org_role(auth.uid(), organization_id, 'admin')
      OR public.has_org_role(auth.uid(), organization_id, 'people'))
  )
  WITH CHECK (
    public.user_belongs_to_org(auth.uid(), organization_id)
    AND (public.has_org_role(auth.uid(), organization_id, 'admin')
      OR public.has_org_role(auth.uid(), organization_id, 'people'))
  );

-- Colaborador pode atualizar apenas ack do próprio recibo
CREATE POLICY "payroll_receipts_ack_self" ON public.payroll_receipts
  FOR UPDATE TO authenticated
  USING (employee_id = auth.uid() AND published = true)
  WITH CHECK (employee_id = auth.uid() AND published = true);

CREATE POLICY "payroll_receipt_events_select" ON public.payroll_receipt_events
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "payroll_receipt_events_insert" ON public.payroll_receipt_events
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE TRIGGER trg_payroll_batches_updated BEFORE UPDATE ON public.payroll_receipt_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_payroll_receipts_updated BEFORE UPDATE ON public.payroll_receipts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- STORAGE BUCKETS
-- =========================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('admission-uploads', 'admission-uploads', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payroll-receipts', 'payroll-receipts', false) ON CONFLICT (id) DO NOTHING;

-- Admission uploads: RH lê/escreve por org; público acessa via Edge Function com token
CREATE POLICY "admission_uploads_rh_all" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'admission-uploads'
    AND EXISTS (
      SELECT 1 FROM public.admission_processes p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND public.user_belongs_to_org(auth.uid(), p.organization_id)
        AND (public.has_org_role(auth.uid(), p.organization_id, 'admin')
          OR public.has_org_role(auth.uid(), p.organization_id, 'people'))
    )
  )
  WITH CHECK (
    bucket_id = 'admission-uploads'
    AND EXISTS (
      SELECT 1 FROM public.admission_processes p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND public.user_belongs_to_org(auth.uid(), p.organization_id)
    )
  );

-- Payroll receipts: RH gerencia; colaborador lê o próprio (validado via signed URL na edge function)
CREATE POLICY "payroll_receipts_rh_all" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'payroll-receipts'
    AND EXISTS (
      SELECT 1 FROM public.payroll_receipt_batches b
      WHERE b.id::text = (storage.foldername(name))[1]
        AND public.user_belongs_to_org(auth.uid(), b.organization_id)
        AND (public.has_org_role(auth.uid(), b.organization_id, 'admin')
          OR public.has_org_role(auth.uid(), b.organization_id, 'people'))
    )
  )
  WITH CHECK (
    bucket_id = 'payroll-receipts'
    AND EXISTS (
      SELECT 1 FROM public.payroll_receipt_batches b
      WHERE b.id::text = (storage.foldername(name))[1]
        AND public.user_belongs_to_org(auth.uid(), b.organization_id)
    )
  );
