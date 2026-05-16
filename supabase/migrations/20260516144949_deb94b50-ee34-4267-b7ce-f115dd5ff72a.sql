-- =========================================
-- PHASE 2: OPERATIONAL CONTROL
-- =========================================

-- 1. NEW PERMISSIONS
INSERT INTO public.permissions (id, module, action, description) VALUES
  ('calendars.view',         'calendars',        'view',   'Visualizar calendários operacionais'),
  ('calendars.manage',       'calendars',        'manage', 'Gerenciar calendários operacionais'),
  ('inconsistencies.view',   'inconsistencies',  'view',   'Visualizar inconsistências de ponto'),
  ('inconsistencies.manage', 'inconsistencies',  'manage', 'Tratar inconsistências de ponto'),
  ('tasks.view',             'tasks',            'view',   'Visualizar tarefas pendentes de terceiros'),
  ('tasks.manage',           'tasks',            'manage', 'Gerenciar tarefas pendentes de terceiros')
ON CONFLICT (id) DO NOTHING;

-- Grant new permissions to admin + people roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug IN ('admin','people')
  AND p.id IN ('calendars.view','calendars.manage','inconsistencies.view','inconsistencies.manage','tasks.view','tasks.manage')
ON CONFLICT DO NOTHING;

-- View-only for director/coordinator/manager
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug IN ('director','coordinator','manager')
  AND p.id IN ('calendars.view','inconsistencies.view','inconsistencies.manage','tasks.view','tasks.manage')
ON CONFLICT DO NOTHING;

-- =========================================
-- 2. OPERATIONAL CALENDARS
-- =========================================
DO $$ BEGIN
  CREATE TYPE public.calendar_scope AS ENUM ('default','regional','unit','cost_center','legal_entity');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.calendar_day_type AS ENUM (
    'feriado_nacional','feriado_estadual','feriado_municipal',
    'ponto_facultativo','evento_interno','dia_util_extra'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.operational_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  scope public.calendar_scope NOT NULL DEFAULT 'default',
  unit_id UUID,
  cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  legal_entity_id UUID REFERENCES public.legal_entities(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_opcal_org ON public.operational_calendars(organization_id, year);
ALTER TABLE public.operational_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opcal_select" ON public.operational_calendars
  FOR SELECT TO authenticated
  USING (public.has_org_permission(auth.uid(), organization_id, 'calendars.view')
      OR public.has_org_permission(auth.uid(), organization_id, 'calendars.manage'));
CREATE POLICY "opcal_manage" ON public.operational_calendars
  FOR ALL TO authenticated
  USING (public.has_org_permission(auth.uid(), organization_id, 'calendars.manage'))
  WITH CHECK (public.has_org_permission(auth.uid(), organization_id, 'calendars.manage'));

CREATE TRIGGER trg_opcal_updated_at BEFORE UPDATE ON public.operational_calendars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.operational_calendar_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  calendar_id UUID NOT NULL REFERENCES public.operational_calendars(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  day_type public.calendar_day_type NOT NULL,
  description TEXT,
  counts_as_workday BOOLEAN NOT NULL DEFAULT false,
  overtime_multiplier NUMERIC(4,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (calendar_id, day)
);
CREATE INDEX IF NOT EXISTS idx_opcalday_cal ON public.operational_calendar_days(calendar_id, day);
ALTER TABLE public.operational_calendar_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opcalday_select" ON public.operational_calendar_days
  FOR SELECT TO authenticated
  USING (public.has_org_permission(auth.uid(), organization_id, 'calendars.view')
      OR public.has_org_permission(auth.uid(), organization_id, 'calendars.manage'));
CREATE POLICY "opcalday_manage" ON public.operational_calendar_days
  FOR ALL TO authenticated
  USING (public.has_org_permission(auth.uid(), organization_id, 'calendars.manage'))
  WITH CHECK (public.has_org_permission(auth.uid(), organization_id, 'calendars.manage'));

-- =========================================
-- 3. TIME INCONSISTENCIES
-- =========================================
DO $$ BEGIN
  CREATE TYPE public.inconsistency_type AS ENUM (
    'falta','atraso','saida_antecipada','marcacao_faltante','marcacao_excedente',
    'jornada_nao_cumprida','fora_da_cerca','intervalo_insuficiente','duplicado','horas_extras_nao_autorizadas'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.inconsistency_severity AS ENUM ('info','warning','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.inconsistency_status AS ENUM ('open','in_review','resolved','justified','ignored');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.time_inconsistencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  manager_id UUID,
  day DATE NOT NULL,
  type public.inconsistency_type NOT NULL,
  severity public.inconsistency_severity NOT NULL DEFAULT 'warning',
  status public.inconsistency_status NOT NULL DEFAULT 'open',
  expected_value JSONB,
  actual_value JSONB,
  description TEXT,
  raw_event_id UUID REFERENCES public.time_clock_raw_events(id) ON DELETE SET NULL,
  time_entry_id UUID REFERENCES public.time_entries(id) ON DELETE SET NULL,
  justification_id UUID REFERENCES public.justificativas_ponto(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_incons_org ON public.time_inconsistencies(organization_id, day DESC);
CREATE INDEX IF NOT EXISTS idx_incons_employee ON public.time_inconsistencies(employee_id, day DESC);
CREATE INDEX IF NOT EXISTS idx_incons_status ON public.time_inconsistencies(organization_id, status);
ALTER TABLE public.time_inconsistencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "incons_select_manage" ON public.time_inconsistencies
  FOR SELECT TO authenticated
  USING (
    public.has_org_permission(auth.uid(), organization_id, 'inconsistencies.view')
    OR public.has_org_permission(auth.uid(), organization_id, 'inconsistencies.manage')
    OR employee_id = auth.uid()
    OR manager_id = auth.uid()
  );
CREATE POLICY "incons_manage" ON public.time_inconsistencies
  FOR ALL TO authenticated
  USING (public.has_org_permission(auth.uid(), organization_id, 'inconsistencies.manage'))
  WITH CHECK (public.has_org_permission(auth.uid(), organization_id, 'inconsistencies.manage'));

CREATE TRIGGER trg_incons_updated_at BEFORE UPDATE ON public.time_inconsistencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 4. PENDING TASKS (central inbox)
-- =========================================
DO $$ BEGIN
  CREATE TYPE public.pending_task_status AS ENUM ('open','in_progress','done','dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.pending_task_priority AS ENUM ('low','medium','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.pending_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL,
  created_by UUID,
  module TEXT NOT NULL,
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority public.pending_task_priority NOT NULL DEFAULT 'medium',
  status public.pending_task_status NOT NULL DEFAULT 'open',
  due_at TIMESTAMPTZ,
  related_resource_type TEXT,
  related_resource_id UUID,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ptasks_assignee ON public.pending_tasks(assigned_to, status, due_at);
CREATE INDEX IF NOT EXISTS idx_ptasks_org ON public.pending_tasks(organization_id, status);
ALTER TABLE public.pending_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ptasks_select_own" ON public.pending_tasks
  FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR public.has_org_permission(auth.uid(), organization_id, 'tasks.view')
    OR public.has_org_permission(auth.uid(), organization_id, 'tasks.manage')
  );

CREATE POLICY "ptasks_update_own" ON public.pending_tasks
  FOR UPDATE TO authenticated
  USING (
    assigned_to = auth.uid()
    OR public.has_org_permission(auth.uid(), organization_id, 'tasks.manage')
  )
  WITH CHECK (
    assigned_to = auth.uid()
    OR public.has_org_permission(auth.uid(), organization_id, 'tasks.manage')
  );

CREATE POLICY "ptasks_insert_manage" ON public.pending_tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_org_permission(auth.uid(), organization_id, 'tasks.manage')
    OR created_by = auth.uid()
  );

CREATE POLICY "ptasks_delete_manage" ON public.pending_tasks
  FOR DELETE TO authenticated
  USING (public.has_org_permission(auth.uid(), organization_id, 'tasks.manage'));

CREATE TRIGGER trg_ptasks_updated_at BEFORE UPDATE ON public.pending_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
