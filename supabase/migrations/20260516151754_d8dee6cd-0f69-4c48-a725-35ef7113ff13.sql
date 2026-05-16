
CREATE TABLE IF NOT EXISTS public.onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_template_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.onboarding_templates(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('documento','formulario','exame','treinamento','assinatura','tarefa')),
  responsible_role TEXT NOT NULL DEFAULT 'colaborador' CHECK (responsible_role IN ('colaborador','gestor','rh','sesmt')),
  due_offset_days INTEGER NOT NULL DEFAULT 7,
  sort_order INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.onboarding_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','concluido','cancelado')),
  started_at TIMESTAMPTZ,
  expected_completion_at DATE,
  completed_at TIMESTAMPTZ,
  responsible_user_id UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.onboarding_processes(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('documento','formulario','exame','treinamento','assinatura','tarefa')),
  responsible_role TEXT NOT NULL DEFAULT 'colaborador',
  assigned_to UUID,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','concluido','dispensado')),
  required BOOLEAN NOT NULL DEFAULT true,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  document_id UUID REFERENCES public.hr_documents(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onb_tasks_process ON public.onboarding_tasks(process_id);
CREATE INDEX IF NOT EXISTS idx_onb_tasks_employee ON public.onboarding_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_onb_proc_employee ON public.onboarding_processes(employee_id);

CREATE TABLE IF NOT EXISTS public.medical_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('admissional','periodico','retorno_ao_trabalho','mudanca_de_funcao','demissional','complementar')),
  exam_date DATE NOT NULL,
  valid_until DATE,
  doctor_name TEXT,
  doctor_crm TEXT,
  clinic_name TEXT,
  result TEXT CHECK (result IN ('apto','apto_com_restricoes','inapto','pendente')),
  restrictions TEXT,
  file_path TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medical_exams_employee ON public.medical_exams(employee_id);
CREATE INDEX IF NOT EXISTS idx_medical_exams_valid ON public.medical_exams(valid_until);

CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  receipt_type TEXT NOT NULL CHECK (receipt_type IN ('vale','adiantamento','epi','uniforme','ferramenta','treinamento','outro')),
  reference_competency DATE,
  description TEXT NOT NULL,
  amount NUMERIC(14,2),
  quantity NUMERIC(10,2),
  item_description TEXT,
  delivered_at DATE,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aguardando_assinatura','assinado','cancelado')),
  signature_envelope_id UUID REFERENCES public.signature_envelopes(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipts_employee ON public.receipts(employee_id);
CREATE INDEX IF NOT EXISTS idx_receipts_org_type ON public.receipts(organization_id, receipt_type);

CREATE TRIGGER trg_onb_templates_updated BEFORE UPDATE ON public.onboarding_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_onb_processes_updated BEFORE UPDATE ON public.onboarding_processes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_onb_tasks_updated BEFORE UPDATE ON public.onboarding_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_medical_exams_updated BEFORE UPDATE ON public.medical_exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_receipts_updated BEFORE UPDATE ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onb_templates_view" ON public.onboarding_templates FOR SELECT
  USING (has_org_permission(auth.uid(), organization_id, 'onboarding.view'));
CREATE POLICY "onb_templates_manage" ON public.onboarding_templates FOR ALL
  USING (has_org_permission(auth.uid(), organization_id, 'onboarding.manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'onboarding.manage'));

CREATE POLICY "onb_tpl_tasks_view" ON public.onboarding_template_tasks FOR SELECT
  USING (has_org_permission(auth.uid(), organization_id, 'onboarding.view'));
CREATE POLICY "onb_tpl_tasks_manage" ON public.onboarding_template_tasks FOR ALL
  USING (has_org_permission(auth.uid(), organization_id, 'onboarding.manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'onboarding.manage'));

CREATE POLICY "onb_proc_view_manage" ON public.onboarding_processes FOR SELECT
  USING (has_org_permission(auth.uid(), organization_id, 'onboarding.view') OR employee_id = auth.uid());
CREATE POLICY "onb_proc_manage" ON public.onboarding_processes FOR ALL
  USING (has_org_permission(auth.uid(), organization_id, 'onboarding.manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'onboarding.manage'));

CREATE POLICY "onb_tasks_view" ON public.onboarding_tasks FOR SELECT
  USING (has_org_permission(auth.uid(), organization_id, 'onboarding.view') OR employee_id = auth.uid());
CREATE POLICY "onb_tasks_manage" ON public.onboarding_tasks FOR ALL
  USING (has_org_permission(auth.uid(), organization_id, 'onboarding.manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'onboarding.manage'));
CREATE POLICY "onb_tasks_execute_own" ON public.onboarding_tasks FOR UPDATE
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "medex_view" ON public.medical_exams FOR SELECT
  USING (has_org_permission(auth.uid(), organization_id, 'medical_exams.view') OR employee_id = auth.uid());
CREATE POLICY "medex_manage" ON public.medical_exams FOR ALL
  USING (has_org_permission(auth.uid(), organization_id, 'medical_exams.manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'medical_exams.manage'));

CREATE POLICY "receipts_view" ON public.receipts FOR SELECT
  USING (has_org_permission(auth.uid(), organization_id, 'receipts.view') OR employee_id = auth.uid());
CREATE POLICY "receipts_manage" ON public.receipts FOR ALL
  USING (has_org_permission(auth.uid(), organization_id, 'receipts.manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'receipts.manage'));
CREATE POLICY "receipts_sign_own" ON public.receipts FOR UPDATE
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());
