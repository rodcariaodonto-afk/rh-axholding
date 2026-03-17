
-- 1. employee_journey_config
CREATE TABLE public.employee_journey_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tipo_jornada TEXT NOT NULL DEFAULT '44h',
  horas_semana NUMERIC(5,2) NOT NULL DEFAULT 44,
  horas_dia NUMERIC(5,2) NOT NULL DEFAULT 8,
  dias_trabalho TEXT[] NOT NULL DEFAULT ARRAY['seg','ter','qua','qui','sex'],
  tolerancia_atraso INT NOT NULL DEFAULT 10,
  tolerancia_saida_antecipada INT NOT NULL DEFAULT 10,
  intervalo_padrao INT NOT NULL DEFAULT 60,
  fator_hora_extra_normal NUMERIC(3,2) NOT NULL DEFAULT 1.50,
  fator_hora_extra_noturna NUMERIC(3,2) NOT NULL DEFAULT 2.00,
  fator_sabado NUMERIC(3,2) NOT NULL DEFAULT 1.50,
  fator_domingo NUMERIC(3,2) NOT NULL DEFAULT 2.00,
  fator_feriado NUMERIC(3,2) NOT NULL DEFAULT 2.00,
  limite_saldo_negativo INT NOT NULL DEFAULT -2400,
  validade_horas_dias INT NOT NULL DEFAULT 365,
  compensacao_automatica BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  data_vigencia DATE NOT NULL DEFAULT CURRENT_DATE,
  data_termino DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_journey_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read journey config"
  ON public.employee_journey_config FOR SELECT
  TO authenticated
  USING (public.is_same_org(organization_id));

CREATE POLICY "Org members can insert journey config"
  ON public.employee_journey_config FOR INSERT
  TO authenticated
  WITH CHECK (public.is_same_org(organization_id));

CREATE POLICY "Org members can update journey config"
  ON public.employee_journey_config FOR UPDATE
  TO authenticated
  USING (public.is_same_org(organization_id));

CREATE POLICY "Org members can delete journey config"
  ON public.employee_journey_config FOR DELETE
  TO authenticated
  USING (public.is_same_org(organization_id));

-- 2. banco_horas_registros
CREATE TABLE public.banco_horas_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  tipo_jornada TEXT,
  horas_esperadas INT NOT NULL DEFAULT 0,
  entrada TIMESTAMPTZ,
  saida TIMESTAMPTZ,
  lunch_out TIMESTAMPTZ,
  lunch_return TIMESTAMPTZ,
  intervalo_minutos INT DEFAULT 0,
  horas_trabalhadas_minutos INT DEFAULT 0,
  diferenca_minutos INT DEFAULT 0,
  horas_extras_minutos INT DEFAULT 0,
  tipo_registro TEXT NOT NULL DEFAULT 'presenca',
  observacoes TEXT,
  banco_horas_acumulado_minutos INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.banco_horas_registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read banco_horas_registros"
  ON public.banco_horas_registros FOR SELECT TO authenticated
  USING (public.is_same_org(organization_id));

CREATE POLICY "Org members can insert banco_horas_registros"
  ON public.banco_horas_registros FOR INSERT TO authenticated
  WITH CHECK (public.is_same_org(organization_id));

CREATE POLICY "Org members can update banco_horas_registros"
  ON public.banco_horas_registros FOR UPDATE TO authenticated
  USING (public.is_same_org(organization_id));

-- 3. banco_horas_totalizadores
CREATE TABLE public.banco_horas_totalizadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  mes INT NOT NULL,
  ano INT NOT NULL,
  horas_presentes INT DEFAULT 0,
  entrada_feriado INT DEFAULT 0,
  entrada_feriado_dias INT DEFAULT 0,
  atrasados INT DEFAULT 0,
  horas_trabalhadas_dias INT DEFAULT 0,
  faltas INT DEFAULT 0,
  horas_extras_positivas INT DEFAULT 0,
  banco_acumulado_anterior INT DEFAULT 0,
  banco_acumulado_mes INT DEFAULT 0,
  saldo_atual INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, employee_id, mes, ano)
);

ALTER TABLE public.banco_horas_totalizadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read banco_horas_totalizadores"
  ON public.banco_horas_totalizadores FOR SELECT TO authenticated
  USING (public.is_same_org(organization_id));

CREATE POLICY "Org members can insert banco_horas_totalizadores"
  ON public.banco_horas_totalizadores FOR INSERT TO authenticated
  WITH CHECK (public.is_same_org(organization_id));

CREATE POLICY "Org members can update banco_horas_totalizadores"
  ON public.banco_horas_totalizadores FOR UPDATE TO authenticated
  USING (public.is_same_org(organization_id));

-- 4. historico_saldo_banco_horas
CREATE TABLE public.historico_saldo_banco_horas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  mes INT NOT NULL,
  ano INT NOT NULL,
  saldo_anterior INT DEFAULT 0,
  horas_acumuladas_mes INT DEFAULT 0,
  horas_compensadas INT DEFAULT 0,
  saldo_atual INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, employee_id, mes, ano)
);

ALTER TABLE public.historico_saldo_banco_horas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read historico_saldo"
  ON public.historico_saldo_banco_horas FOR SELECT TO authenticated
  USING (public.is_same_org(organization_id));

CREATE POLICY "Org members can insert historico_saldo"
  ON public.historico_saldo_banco_horas FOR INSERT TO authenticated
  WITH CHECK (public.is_same_org(organization_id));

CREATE POLICY "Org members can update historico_saldo"
  ON public.historico_saldo_banco_horas FOR UPDATE TO authenticated
  USING (public.is_same_org(organization_id));
