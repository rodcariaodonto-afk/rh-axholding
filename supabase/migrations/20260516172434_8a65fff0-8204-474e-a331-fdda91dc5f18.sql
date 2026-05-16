
-- =====================
-- Saúde Ocupacional - schedules + events
-- =====================
CREATE TABLE IF NOT EXISTS public.medical_exam_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('admissional','periodico','retorno_ao_trabalho','mudanca_de_funcao','demissional','complementar')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_phone TEXT,
  doctor_name TEXT,
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado','confirmado','realizado','cancelado','remarcado','nao_compareceu')),
  notes TEXT,
  reminder_sent_at TIMESTAMPTZ,
  exam_id UUID REFERENCES public.medical_exams(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_med_sched_employee ON public.medical_exam_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_med_sched_org_status ON public.medical_exam_schedules(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_med_sched_date ON public.medical_exam_schedules(scheduled_at);

CREATE TABLE IF NOT EXISTS public.medical_exam_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES public.medical_exams(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.medical_exam_schedules(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_user_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_med_events_exam ON public.medical_exam_events(exam_id);
CREATE INDEX IF NOT EXISTS idx_med_events_schedule ON public.medical_exam_events(schedule_id);

CREATE TRIGGER trg_med_sched_updated BEFORE UPDATE ON public.medical_exam_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.medical_exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_exam_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "med_sched_view" ON public.medical_exam_schedules FOR SELECT
  USING (has_org_permission(auth.uid(), organization_id, 'medical_exams.view') OR employee_id = auth.uid());
CREATE POLICY "med_sched_manage" ON public.medical_exam_schedules FOR ALL
  USING (has_org_permission(auth.uid(), organization_id, 'medical_exams.manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'medical_exams.manage'));

CREATE POLICY "med_events_view" ON public.medical_exam_events FOR SELECT
  USING (has_org_permission(auth.uid(), organization_id, 'medical_exams.view'));
CREATE POLICY "med_events_insert" ON public.medical_exam_events FOR INSERT
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'medical_exams.manage'));

-- =====================
-- Rescisão - processo workflow
-- =====================
CREATE TABLE IF NOT EXISTS public.termination_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'iniciado' CHECK (status IN ('iniciado','aviso_previo','exames','calculos','documentos','assinatura','homologacao','pagamento','concluido','cancelado')),
  termination_reason TEXT,
  termination_decision TEXT,
  termination_cause TEXT,
  notice_type TEXT CHECK (notice_type IN ('worked','indemnified','waived')),
  notice_start_date DATE,
  notice_end_date DATE,
  termination_date DATE,
  exam_schedule_id UUID REFERENCES public.medical_exam_schedules(id) ON DELETE SET NULL,
  exam_id UUID REFERENCES public.medical_exams(id) ON DELETE SET NULL,
  signature_envelope_id UUID REFERENCES public.signature_envelopes(id) ON DELETE SET NULL,
  termination_details_id UUID REFERENCES public.termination_details(id) ON DELETE SET NULL,
  responsible_user_id UUID,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_term_proc_org_status ON public.termination_processes(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_term_proc_employee ON public.termination_processes(employee_id);

CREATE TABLE IF NOT EXISTS public.termination_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.termination_processes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  required BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','skipped')),
  done_at TIMESTAMPTZ,
  done_by UUID,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_term_checklist_process ON public.termination_checklist_items(process_id);

CREATE TABLE IF NOT EXISTS public.termination_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.termination_processes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_user_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_term_events_process ON public.termination_events(process_id);

CREATE TRIGGER trg_term_proc_updated BEFORE UPDATE ON public.termination_processes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_term_checklist_updated BEFORE UPDATE ON public.termination_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.termination_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termination_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termination_events ENABLE ROW LEVEL SECURITY;

-- termination_processes policies
CREATE POLICY "term_proc_view" ON public.termination_processes FOR SELECT
  USING (
    has_org_permission(auth.uid(), organization_id, 'employees.view')
    OR employee_id = auth.uid()
  );
CREATE POLICY "term_proc_manage" ON public.termination_processes FOR ALL
  USING (has_org_permission(auth.uid(), organization_id, 'employees.manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'employees.manage'));

-- checklist policies (via process)
CREATE POLICY "term_checklist_view" ON public.termination_checklist_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.termination_processes p
    WHERE p.id = process_id
      AND (has_org_permission(auth.uid(), p.organization_id, 'employees.view') OR p.employee_id = auth.uid())
  ));
CREATE POLICY "term_checklist_manage" ON public.termination_checklist_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.termination_processes p
    WHERE p.id = process_id
      AND has_org_permission(auth.uid(), p.organization_id, 'employees.manage')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.termination_processes p
    WHERE p.id = process_id
      AND has_org_permission(auth.uid(), p.organization_id, 'employees.manage')
  ));

-- events
CREATE POLICY "term_events_view" ON public.termination_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.termination_processes p
    WHERE p.id = process_id
      AND (has_org_permission(auth.uid(), p.organization_id, 'employees.view') OR p.employee_id = auth.uid())
  ));
CREATE POLICY "term_events_insert" ON public.termination_events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.termination_processes p
    WHERE p.id = process_id
      AND has_org_permission(auth.uid(), p.organization_id, 'employees.manage')
  ));

-- =====================
-- Storage bucket for ASO files
-- =====================
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-exams', 'medical-exams', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "medical_exams_read_org"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-exams'
    AND EXISTS (
      SELECT 1 FROM public.medical_exams me
      WHERE me.file_path = storage.objects.name
        AND (
          has_org_permission(auth.uid(), me.organization_id, 'medical_exams.view')
          OR me.employee_id = auth.uid()
        )
    )
  );

CREATE POLICY "medical_exams_write_org"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-exams'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "medical_exams_update_org"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'medical-exams'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "medical_exams_delete_org"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'medical-exams'
    AND auth.uid() IS NOT NULL
  );
