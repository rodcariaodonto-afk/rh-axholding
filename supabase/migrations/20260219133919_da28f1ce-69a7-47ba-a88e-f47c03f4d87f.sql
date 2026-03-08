
-- Adicionar colunas de geolocalização na tabela time_entries
ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS clock_in_latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS clock_in_longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS clock_in_accuracy NUMERIC,
  ADD COLUMN IF NOT EXISTS clock_out_latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS clock_out_longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS clock_out_accuracy NUMERIC,
  ADD COLUMN IF NOT EXISTS clock_in_within_fence BOOLEAN,
  ADD COLUMN IF NOT EXISTS clock_out_within_fence BOOLEAN;

-- Tabela de locais autorizados por organização
CREATE TABLE public.organization_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 200,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configuração de geolocalização por org (se é obrigatória, etc.)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS geolocation_required BOOLEAN NOT NULL DEFAULT false;

-- RLS para organization_locations
ALTER TABLE public.organization_locations ENABLE ROW LEVEL SECURITY;

-- Membros da org podem ver os locais
CREATE POLICY "org_members_can_view_locations"
  ON public.organization_locations FOR SELECT
  USING (
    organization_id = get_user_organization(auth.uid())
  );

-- Admins podem gerenciar locais
CREATE POLICY "admins_can_insert_locations"
  ON public.organization_locations FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization(auth.uid())
    AND has_org_role(auth.uid(), organization_id, 'admin')
  );

CREATE POLICY "admins_can_update_locations"
  ON public.organization_locations FOR UPDATE
  USING (
    organization_id = get_user_organization(auth.uid())
    AND has_org_role(auth.uid(), organization_id, 'admin')
  );

CREATE POLICY "admins_can_delete_locations"
  ON public.organization_locations FOR DELETE
  USING (
    organization_id = get_user_organization(auth.uid())
    AND has_org_role(auth.uid(), organization_id, 'admin')
  );

-- Trigger de updated_at
CREATE TRIGGER update_organization_locations_updated_at
  BEFORE UPDATE ON public.organization_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index
CREATE INDEX idx_org_locations_org ON public.organization_locations(organization_id);
