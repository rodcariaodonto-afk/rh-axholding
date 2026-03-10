
-- Table: ponto_registros
CREATE TABLE public.ponto_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.organization_locations(id) ON DELETE CASCADE,
  gps_latitude DECIMAL(10,8) NOT NULL,
  gps_longitude DECIMAL(11,8) NOT NULL,
  gps_accuracy NUMERIC,
  distance_meters NUMERIC NOT NULL,
  hash_sha256 VARCHAR(64) UNIQUE NOT NULL,
  metodo_registro VARCHAR(50) DEFAULT 'qrcode_gps',
  status VARCHAR(50) DEFAULT 'registrado',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: auditoria_ponto
CREATE TABLE public.auditoria_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  acao VARCHAR(100) NOT NULL,
  detalhes JSONB,
  hash_atual VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add address column to organization_locations
ALTER TABLE public.organization_locations ADD COLUMN IF NOT EXISTS address TEXT;

-- Indexes
CREATE INDEX idx_ponto_registros_org ON public.ponto_registros(organization_id);
CREATE INDEX idx_ponto_registros_employee ON public.ponto_registros(employee_id);
CREATE INDEX idx_ponto_registros_created ON public.ponto_registros(created_at DESC);
CREATE INDEX idx_auditoria_ponto_org ON public.auditoria_ponto(organization_id);
CREATE INDEX idx_auditoria_ponto_created ON public.auditoria_ponto(created_at DESC);

-- RLS: ponto_registros
ALTER TABLE public.ponto_registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own ponto_registros"
ON public.ponto_registros FOR INSERT TO authenticated
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can view own ponto_registros"
ON public.ponto_registros FOR SELECT TO authenticated
USING (employee_id = auth.uid());

CREATE POLICY "Org members can view org ponto_registros"
ON public.ponto_registros FOR SELECT TO authenticated
USING (user_belongs_to_org(auth.uid(), organization_id));

-- RLS: auditoria_ponto
ALTER TABLE public.auditoria_ponto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view auditoria_ponto"
ON public.auditoria_ponto FOR SELECT TO authenticated
USING (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Users can insert auditoria_ponto"
ON public.auditoria_ponto FOR INSERT TO authenticated
WITH CHECK (user_belongs_to_org(auth.uid(), organization_id));
