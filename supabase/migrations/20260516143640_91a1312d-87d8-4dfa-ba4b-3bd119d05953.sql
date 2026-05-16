
-- ============================================================
-- FASE 1: Base operacional de frequência multicanal
-- ============================================================

-- =========================================
-- 1. COST CENTERS
-- =========================================
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  cnpj TEXT,
  responsible_id UUID,
  address JSONB,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);
CREATE INDEX IF NOT EXISTS idx_cost_centers_org ON public.cost_centers(organization_id) WHERE active;

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cost_centers_select_org_member" ON public.cost_centers
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "cost_centers_insert_manage" ON public.cost_centers
  FOR INSERT TO authenticated
  WITH CHECK (public.has_org_permission(auth.uid(), organization_id, 'cost_centers.manage'));

CREATE POLICY "cost_centers_update_manage" ON public.cost_centers
  FOR UPDATE TO authenticated
  USING (public.has_org_permission(auth.uid(), organization_id, 'cost_centers.manage'))
  WITH CHECK (public.has_org_permission(auth.uid(), organization_id, 'cost_centers.manage'));

CREATE POLICY "cost_centers_delete_manage" ON public.cost_centers
  FOR DELETE TO authenticated
  USING (public.has_org_permission(auth.uid(), organization_id, 'cost_centers.manage'));

CREATE TRIGGER trg_cost_centers_updated
  BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 2. LEGAL ENTITIES (CNPJs operacionais)
-- =========================================
CREATE TABLE IF NOT EXISTS public.legal_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT NOT NULL,
  state_registration TEXT,
  municipal_registration TEXT,
  cnae_code TEXT,
  address JSONB,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, cnpj)
);
CREATE INDEX IF NOT EXISTS idx_legal_entities_org ON public.legal_entities(organization_id) WHERE active;

ALTER TABLE public.legal_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "legal_entities_select" ON public.legal_entities
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "legal_entities_insert" ON public.legal_entities
  FOR INSERT TO authenticated
  WITH CHECK (public.has_org_permission(auth.uid(), organization_id, 'legal_entities.manage'));

CREATE POLICY "legal_entities_update" ON public.legal_entities
  FOR UPDATE TO authenticated
  USING (public.has_org_permission(auth.uid(), organization_id, 'legal_entities.manage'))
  WITH CHECK (public.has_org_permission(auth.uid(), organization_id, 'legal_entities.manage'));

CREATE POLICY "legal_entities_delete" ON public.legal_entities
  FOR DELETE TO authenticated
  USING (public.has_org_permission(auth.uid(), organization_id, 'legal_entities.manage'));

CREATE TRIGGER trg_legal_entities_updated
  BEFORE UPDATE ON public.legal_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 3. Estender organization_locations com cost_center_id e legal_entity_id
-- =========================================
ALTER TABLE public.organization_locations
  ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS legal_entity_id UUID REFERENCES public.legal_entities(id) ON DELETE SET NULL;

-- =========================================
-- 4. TIME CLOCK DEVICES
-- =========================================
DO $$ BEGIN
  CREATE TYPE public.time_clock_device_type AS ENUM ('rep_p','rep_a','rep_c','tablet_kiosk','mobile_app','web','qr_gps','biometric','manual_upload');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.time_clock_integration_mode AS ENUM ('api','webhook','afd_file','csv_file','manual_upload','native');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.time_clock_device_status AS ENUM ('active','inactive','offline','error','pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.time_clock_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  legal_entity_id UUID REFERENCES public.legal_entities(id) ON DELETE SET NULL,
  work_location_id UUID REFERENCES public.organization_locations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  serial_number TEXT,
  device_type public.time_clock_device_type NOT NULL DEFAULT 'web',
  integration_mode public.time_clock_integration_mode NOT NULL DEFAULT 'native',
  status public.time_clock_device_status NOT NULL DEFAULT 'active',
  firmware_version TEXT,
  last_sync_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tcdevices_org ON public.time_clock_devices(organization_id);
CREATE INDEX IF NOT EXISTS idx_tcdevices_cc ON public.time_clock_devices(cost_center_id);

ALTER TABLE public.time_clock_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tcdevices_select_org" ON public.time_clock_devices
  FOR SELECT TO authenticated
  USING (public.has_org_permission(auth.uid(), organization_id, 'devices.view')
         OR public.has_org_permission(auth.uid(), organization_id, 'devices.manage'));

CREATE POLICY "tcdevices_insert" ON public.time_clock_devices
  FOR INSERT TO authenticated
  WITH CHECK (public.has_org_permission(auth.uid(), organization_id, 'devices.manage'));

CREATE POLICY "tcdevices_update" ON public.time_clock_devices
  FOR UPDATE TO authenticated
  USING (public.has_org_permission(auth.uid(), organization_id, 'devices.manage'))
  WITH CHECK (public.has_org_permission(auth.uid(), organization_id, 'devices.manage'));

CREATE POLICY "tcdevices_delete" ON public.time_clock_devices
  FOR DELETE TO authenticated
  USING (public.has_org_permission(auth.uid(), organization_id, 'devices.manage'));

CREATE TRIGGER trg_tcdevices_updated
  BEFORE UPDATE ON public.time_clock_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 5. TIME CLOCK DEVICE TOKENS (service role only)
-- =========================================
CREATE TABLE IF NOT EXISTS public.time_clock_device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.time_clock_devices(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL DEFAULT 'ingest',
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.time_clock_device_tokens ENABLE ROW LEVEL SECURITY;
-- No policies = service role only access

-- =========================================
-- 6. TIME CLOCK SYNC LOGS (append-only)
-- =========================================
CREATE TABLE IF NOT EXISTS public.time_clock_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.time_clock_devices(id) ON DELETE SET NULL,
  sync_status TEXT NOT NULL,
  events_received INTEGER NOT NULL DEFAULT 0,
  events_accepted INTEGER NOT NULL DEFAULT 0,
  events_rejected INTEGER NOT NULL DEFAULT 0,
  events_duplicated INTEGER NOT NULL DEFAULT 0,
  source_file TEXT,
  error_details JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  triggered_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tcsync_org ON public.time_clock_sync_logs(organization_id, created_at DESC);

ALTER TABLE public.time_clock_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tcsync_select" ON public.time_clock_sync_logs
  FOR SELECT TO authenticated
  USING (public.has_org_permission(auth.uid(), organization_id, 'devices.view')
         OR public.has_org_permission(auth.uid(), organization_id, 'devices.manage'));

-- Append-only: block update/delete
CREATE OR REPLACE FUNCTION public.block_modify_append_only()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Tabela append-only: % não permite alterar ou apagar registros', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER trg_tcsync_no_update BEFORE UPDATE ON public.time_clock_sync_logs
  FOR EACH ROW EXECUTE FUNCTION public.block_modify_append_only();
CREATE TRIGGER trg_tcsync_no_delete BEFORE DELETE ON public.time_clock_sync_logs
  FOR EACH ROW EXECUTE FUNCTION public.block_modify_append_only();

-- =========================================
-- 7. TIME CLOCK RAW EVENTS (ledger imutável)
-- =========================================
DO $$ BEGIN
  CREATE TYPE public.time_clock_direction AS ENUM ('in','out','break_start','break_end','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.time_clock_processing_status AS ENUM ('pending','processed','conflict','rejected','ignored');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.time_clock_raw_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID,
  external_employee_code TEXT,
  device_id UUID REFERENCES public.time_clock_devices(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  source_event_id TEXT,
  event_time TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  direction public.time_clock_direction NOT NULL DEFAULT 'unknown',
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  accuracy NUMERIC(8,2),
  photo_url TEXT,
  biometric_match_status TEXT,
  hash TEXT,
  sync_log_id UUID REFERENCES public.time_clock_sync_logs(id) ON DELETE SET NULL,
  processing_status public.time_clock_processing_status NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  derived_time_entry_id UUID,
  derived_ponto_registro_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, source, source_event_id)
);

CREATE INDEX IF NOT EXISTS idx_tcraw_org_time ON public.time_clock_raw_events(organization_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_tcraw_employee ON public.time_clock_raw_events(employee_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_tcraw_status ON public.time_clock_raw_events(organization_id, processing_status);

ALTER TABLE public.time_clock_raw_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tcraw_select_view_perm" ON public.time_clock_raw_events
  FOR SELECT TO authenticated
  USING (public.has_org_permission(auth.uid(), organization_id, 'time_raw.view'));

-- Append-only: block update/delete for raw events
CREATE TRIGGER trg_tcraw_no_update BEFORE UPDATE ON public.time_clock_raw_events
  FOR EACH ROW EXECUTE FUNCTION public.block_modify_append_only();
CREATE TRIGGER trg_tcraw_no_delete BEFORE DELETE ON public.time_clock_raw_events
  FOR EACH ROW EXECUTE FUNCTION public.block_modify_append_only();

-- Exception: allow service role to mark processing_status via separate function
-- (we use a SECURITY DEFINER updater that bypasses the triggers by using session_replication_role)
CREATE OR REPLACE FUNCTION public.tcraw_mark_processed(
  _event_id UUID,
  _status public.time_clock_processing_status,
  _time_entry_id UUID DEFAULT NULL,
  _ponto_registro_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('session_replication_role', 'replica', true);
  UPDATE public.time_clock_raw_events
  SET processing_status = _status,
      processed_at = now(),
      derived_time_entry_id = COALESCE(_time_entry_id, derived_time_entry_id),
      derived_ponto_registro_id = COALESCE(_ponto_registro_id, derived_ponto_registro_id)
  WHERE id = _event_id;
  PERFORM set_config('session_replication_role', 'origin', true);
END;
$$;

REVOKE ALL ON FUNCTION public.tcraw_mark_processed FROM PUBLIC, anon, authenticated;

-- =========================================
-- 8. time_entries: vincular ao raw event
-- =========================================
ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS source_raw_event_id UUID REFERENCES public.time_clock_raw_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES public.time_clock_devices(id) ON DELETE SET NULL;

-- =========================================
-- 9. PERMISSIONS NOVAS
-- =========================================
INSERT INTO public.permissions (id, module, action, description) VALUES
  ('cost_centers.manage','cost_centers','manage','Gerenciar centros de custo'),
  ('legal_entities.manage','legal_entities','manage','Gerenciar CNPJs operacionais'),
  ('devices.manage','devices','manage','Gerenciar dispositivos de ponto'),
  ('devices.view','devices','view','Visualizar dispositivos de ponto'),
  ('time_raw.view','time_clock','view_raw','Visualizar eventos brutos de ponto'),
  ('time_clock.import','time_clock','import','Importar arquivos AFD/CSV de ponto')
ON CONFLICT (id) DO NOTHING;

-- Atribuir permissões: admin e people recebem tudo; manager/coordinator/director recebem view
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN (VALUES
  ('cost_centers.manage'),('legal_entities.manage'),
  ('devices.manage'),('devices.view'),
  ('time_raw.view'),('time_clock.import')
) AS p(id)
WHERE r.slug IN ('admin','people')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN (VALUES ('devices.view')) AS p(id)
WHERE r.slug IN ('director','coordinator','manager')
ON CONFLICT DO NOTHING;

-- =========================================
-- 10. STORAGE BUCKET: time-clock-imports
-- =========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('time-clock-imports', 'time-clock-imports', false)
ON CONFLICT (id) DO NOTHING;

-- Policies: usuários com time_clock.import podem ver/baixar arquivos da sua org (path = <org_id>/...)
CREATE POLICY "tc_imports_select_org"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'time-clock-imports'
  AND public.has_org_permission(
    auth.uid(),
    (split_part(name, '/', 1))::uuid,
    'time_clock.import'
  )
);

-- Upload via service role only (edge function)
