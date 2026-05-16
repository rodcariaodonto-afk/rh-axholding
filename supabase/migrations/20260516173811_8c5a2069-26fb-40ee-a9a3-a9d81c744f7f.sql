
-- ==========================================
-- FASE 6: EPIs & PATRIMÔNIO
-- ==========================================

-- Catálogo de EPIs
CREATE TABLE public.epi_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  ca_number TEXT,            -- Certificado de Aprovação MTE
  ca_expires_at DATE,
  manufacturer TEXT,
  category TEXT,             -- capacete, luva, óculos, calçado, etc
  unit TEXT NOT NULL DEFAULT 'un',
  stock_qty INTEGER NOT NULL DEFAULT 0,
  min_stock_qty INTEGER NOT NULL DEFAULT 0,
  durability_days INTEGER,   -- vida útil em dias após entrega
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);

CREATE INDEX idx_epi_catalog_org ON public.epi_catalog(organization_id);
CREATE INDEX idx_epi_catalog_ca_exp ON public.epi_catalog(organization_id, ca_expires_at);

ALTER TABLE public.epi_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view EPI catalog"
ON public.epi_catalog FOR SELECT TO authenticated
USING (is_same_org(organization_id));

CREATE POLICY "RH manage EPI catalog"
ON public.epi_catalog FOR ALL TO authenticated
USING (is_same_org(organization_id) AND (has_org_role(auth.uid(), organization_id, 'people') OR has_org_role(auth.uid(), organization_id, 'admin')))
WITH CHECK (is_same_org(organization_id) AND (has_org_role(auth.uid(), organization_id, 'people') OR has_org_role(auth.uid(), organization_id, 'admin')));

CREATE TRIGGER trg_epi_catalog_updated BEFORE UPDATE ON public.epi_catalog
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Movimentos de estoque (kardex)
CREATE TYPE public.epi_movement_kind AS ENUM ('entrada', 'saida', 'ajuste', 'devolucao', 'descarte');

CREATE TABLE public.epi_stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  epi_id UUID NOT NULL REFERENCES public.epi_catalog(id) ON DELETE CASCADE,
  kind public.epi_movement_kind NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC(12,2),
  reason TEXT,
  delivery_id UUID,          -- preenchido em saida/devolucao
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_epi_mov_org ON public.epi_stock_movements(organization_id, created_at DESC);
CREATE INDEX idx_epi_mov_epi ON public.epi_stock_movements(epi_id, created_at DESC);

ALTER TABLE public.epi_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view EPI movements"
ON public.epi_stock_movements FOR SELECT TO authenticated
USING (is_same_org(organization_id));

CREATE POLICY "RH insert EPI movements"
ON public.epi_stock_movements FOR INSERT TO authenticated
WITH CHECK (is_same_org(organization_id) AND (has_org_role(auth.uid(), organization_id, 'people') OR has_org_role(auth.uid(), organization_id, 'admin')));

-- Entregas / Devoluções
CREATE TYPE public.epi_delivery_status AS ENUM ('entregue', 'aguardando_assinatura', 'assinado', 'devolvido', 'cancelado');

CREATE TABLE public.epi_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  epi_id UUID NOT NULL REFERENCES public.epi_catalog(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  delivered_at DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_at DATE,
  ca_at_delivery TEXT,        -- snapshot do CA no momento
  notes TEXT,
  status public.epi_delivery_status NOT NULL DEFAULT 'entregue',
  signed_at TIMESTAMPTZ,
  signature_data TEXT,        -- base64 ou path
  returned_at DATE,
  returned_qty INTEGER,
  return_condition TEXT,      -- bom, danificado, descartado
  delivered_by UUID,
  receipt_id UUID,            -- vínculo opcional com receipts
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_epi_del_org ON public.epi_deliveries(organization_id, delivered_at DESC);
CREATE INDEX idx_epi_del_emp ON public.epi_deliveries(employee_id, delivered_at DESC);
CREATE INDEX idx_epi_del_status ON public.epi_deliveries(organization_id, status);

ALTER TABLE public.epi_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employee view own EPI deliveries"
ON public.epi_deliveries FOR SELECT TO authenticated
USING (employee_id = auth.uid() OR (is_same_org(organization_id) AND (has_org_role(auth.uid(), organization_id, 'people') OR has_org_role(auth.uid(), organization_id, 'admin') OR has_org_role(auth.uid(), organization_id, 'manager'))));

CREATE POLICY "RH manage EPI deliveries"
ON public.epi_deliveries FOR ALL TO authenticated
USING (is_same_org(organization_id) AND (has_org_role(auth.uid(), organization_id, 'people') OR has_org_role(auth.uid(), organization_id, 'admin')))
WITH CHECK (is_same_org(organization_id) AND (has_org_role(auth.uid(), organization_id, 'people') OR has_org_role(auth.uid(), organization_id, 'admin')));

CREATE TRIGGER trg_epi_del_updated BEFORE UPDATE ON public.epi_deliveries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Patrimônio (notebooks, celulares, equipamentos)
CREATE TYPE public.asset_status AS ENUM ('disponivel', 'em_uso', 'manutencao', 'devolvido', 'baixado', 'perdido');

CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,                 -- patrimônio interno
  category TEXT NOT NULL,            -- notebook, celular, monitor...
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  description TEXT,
  acquired_at DATE,
  acquired_value NUMERIC(12,2),
  invoice_number TEXT,
  warranty_until DATE,
  status public.asset_status NOT NULL DEFAULT 'disponivel',
  current_assignee_id UUID,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, tag)
);

CREATE INDEX idx_assets_org ON public.assets(organization_id);
CREATE INDEX idx_assets_assignee ON public.assets(current_assignee_id);
CREATE INDEX idx_assets_status ON public.assets(organization_id, status);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view assets"
ON public.assets FOR SELECT TO authenticated
USING (is_same_org(organization_id));

CREATE POLICY "RH manage assets"
ON public.assets FOR ALL TO authenticated
USING (is_same_org(organization_id) AND (has_org_role(auth.uid(), organization_id, 'people') OR has_org_role(auth.uid(), organization_id, 'admin')))
WITH CHECK (is_same_org(organization_id) AND (has_org_role(auth.uid(), organization_id, 'people') OR has_org_role(auth.uid(), organization_id, 'admin')));

CREATE TRIGGER trg_assets_updated BEFORE UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atribuições de patrimônio
CREATE TYPE public.asset_assignment_status AS ENUM ('ativa', 'aguardando_assinatura', 'devolvida', 'cancelada');

CREATE TABLE public.asset_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  assigned_at DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_at DATE,
  returned_at DATE,
  return_condition TEXT,
  status public.asset_assignment_status NOT NULL DEFAULT 'ativa',
  signed_at TIMESTAMPTZ,
  signature_data TEXT,
  assigned_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_assign_emp ON public.asset_assignments(employee_id, assigned_at DESC);
CREATE INDEX idx_asset_assign_asset ON public.asset_assignments(asset_id, assigned_at DESC);

ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employee view own assignments"
ON public.asset_assignments FOR SELECT TO authenticated
USING (employee_id = auth.uid() OR (is_same_org(organization_id) AND (has_org_role(auth.uid(), organization_id, 'people') OR has_org_role(auth.uid(), organization_id, 'admin') OR has_org_role(auth.uid(), organization_id, 'manager'))));

CREATE POLICY "RH manage asset assignments"
ON public.asset_assignments FOR ALL TO authenticated
USING (is_same_org(organization_id) AND (has_org_role(auth.uid(), organization_id, 'people') OR has_org_role(auth.uid(), organization_id, 'admin')))
WITH CHECK (is_same_org(organization_id) AND (has_org_role(auth.uid(), organization_id, 'people') OR has_org_role(auth.uid(), organization_id, 'admin')));

CREATE TRIGGER trg_asset_assign_updated BEFORE UPDATE ON public.asset_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
