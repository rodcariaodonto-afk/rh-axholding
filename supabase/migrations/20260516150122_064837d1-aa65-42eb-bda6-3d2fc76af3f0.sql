-- ============================================================
-- FASE 3: PAYROLL EVENTS & CENTRAL EXPORTS
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.payroll_competency_status AS ENUM ('aberta', 'em_processamento', 'fechada', 'paga', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payroll_event_kind AS ENUM ('provento', 'desconto', 'informativo', 'base');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.export_job_status AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.export_job_type AS ENUM (
    'payroll_csv', 'payroll_pdf', 'time_entries_csv', 'absenteeism_csv',
    'inconsistencies_csv', 'employees_csv', 'audit_csv', 'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- payroll_competencies
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payroll_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  reference_label text GENERATED ALWAYS AS (lpad(month::text, 2, '0') || '/' || year::text) STORED,
  status public.payroll_competency_status NOT NULL DEFAULT 'aberta',
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  paid_at timestamptz,
  closed_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_payroll_competencies_org_status
  ON public.payroll_competencies (organization_id, status);

ALTER TABLE public.payroll_competencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_comp_view"
  ON public.payroll_competencies FOR SELECT TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'payroll.view'));

CREATE POLICY "payroll_comp_manage"
  ON public.payroll_competencies FOR ALL TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'payroll.manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'payroll.manage'));

CREATE TRIGGER trg_payroll_comp_updated_at
  BEFORE UPDATE ON public.payroll_competencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- payroll_events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payroll_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  competency_id uuid NOT NULL REFERENCES public.payroll_competencies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL,
  kind public.payroll_event_kind NOT NULL,
  code text NOT NULL,
  description text NOT NULL,
  reference numeric(12,4),
  amount numeric(14,2) NOT NULL DEFAULT 0,
  source text DEFAULT 'manual',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payroll_events_comp ON public.payroll_events (competency_id);
CREATE INDEX IF NOT EXISTS idx_payroll_events_employee ON public.payroll_events (employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_events_org ON public.payroll_events (organization_id);

ALTER TABLE public.payroll_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_events_view"
  ON public.payroll_events FOR SELECT TO authenticated
  USING (
    has_org_permission(auth.uid(), organization_id, 'payroll.view')
    OR employee_id = auth.uid()
  );

CREATE POLICY "payroll_events_manage"
  ON public.payroll_events FOR ALL TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'payroll.manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'payroll.manage'));

CREATE TRIGGER trg_payroll_events_updated_at
  BEFORE UPDATE ON public.payroll_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Block edits to events of closed competencies
CREATE OR REPLACE FUNCTION public.payroll_events_block_if_closed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _status public.payroll_competency_status;
BEGIN
  SELECT status INTO _status FROM public.payroll_competencies
  WHERE id = COALESCE(NEW.competency_id, OLD.competency_id);
  IF _status IN ('fechada', 'paga') THEN
    RAISE EXCEPTION 'Competência % está fechada/paga; eventos não podem ser alterados.', _status;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_payroll_events_block_closed
  BEFORE INSERT OR UPDATE OR DELETE ON public.payroll_events
  FOR EACH ROW EXECUTE FUNCTION public.payroll_events_block_if_closed();

-- ============================================================
-- export_jobs (central de exportações assíncronas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  job_type public.export_job_type NOT NULL,
  status public.export_job_status NOT NULL DEFAULT 'queued',
  requested_by uuid NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_path text,
  result_mime text,
  result_size_bytes bigint,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_export_jobs_org_status ON public.export_jobs (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_export_jobs_requester ON public.export_jobs (requested_by);

ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "export_jobs_view_own_or_all"
  ON public.export_jobs FOR SELECT TO authenticated
  USING (
    requested_by = auth.uid()
    OR has_org_permission(auth.uid(), organization_id, 'exports.view_all')
  );

CREATE POLICY "export_jobs_create"
  ON public.export_jobs FOR INSERT TO authenticated
  WITH CHECK (
    has_org_permission(auth.uid(), organization_id, 'exports.create')
    AND requested_by = auth.uid()
  );

CREATE POLICY "export_jobs_update_admin"
  ON public.export_jobs FOR UPDATE TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'exports.view_all'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'exports.view_all'));

CREATE TRIGGER trg_export_jobs_updated_at
  BEFORE UPDATE ON public.export_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Permissions
-- ============================================================
INSERT INTO public.permissions (id, module, action, description) VALUES
  ('payroll.view',    'payroll', 'view',    'Visualizar folha de pagamento'),
  ('payroll.manage',  'payroll', 'manage',  'Lançar/editar eventos de folha'),
  ('payroll.close',   'payroll', 'close',   'Fechar/reabrir competências de folha'),
  ('exports.create',  'exports', 'create',  'Solicitar exportações'),
  ('exports.view_all','exports', 'view_all','Ver exportações de toda a organização')
ON CONFLICT (id) DO NOTHING;

-- Grant to admin roles in every org
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN (VALUES ('payroll.view'),('payroll.manage'),('payroll.close'),('exports.create'),('exports.view_all')) p(id)
WHERE r.slug = 'admin'
ON CONFLICT DO NOTHING;

-- Grant payroll.view + exports.create to people (RH)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN (VALUES ('payroll.view'),('payroll.manage'),('exports.create'),('exports.view_all')) p(id)
WHERE r.slug = 'people'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Storage: payroll-exports bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payroll-exports', 'payroll-exports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "payroll_exports_read_own_org"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payroll-exports'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "payroll_exports_insert_service"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payroll-exports'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM public.organization_members om
      JOIN public.role_permissions rp ON rp.role_id = om.role_id
      WHERE om.user_id = auth.uid() AND rp.permission_id = 'exports.create'
    )
  );