
-- =====================
-- Catálogo de rubricas
-- =====================
CREATE TABLE IF NOT EXISTS public.payroll_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  kind public.payroll_event_kind NOT NULL,
  default_formula TEXT,
  default_reference NUMERIC(12,4),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_payroll_rubrics_org_kind
  ON public.payroll_rubrics (organization_id, kind);

ALTER TABLE public.payroll_rubrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_rubrics_view" ON public.payroll_rubrics FOR SELECT
  TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'payroll.view'));

CREATE POLICY "payroll_rubrics_manage" ON public.payroll_rubrics FOR ALL
  TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'payroll.manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'payroll.manage'));

CREATE TRIGGER trg_payroll_rubrics_updated
  BEFORE UPDATE ON public.payroll_rubrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed para orgs existentes
INSERT INTO public.payroll_rubrics (organization_id, code, description, kind, is_system, sort_order)
SELECT o.id, v.code, v.description, v.kind::public.payroll_event_kind, true, v.sort_order
FROM public.organizations o
CROSS JOIN (VALUES
  ('SALARIO',         'Salário base',                  'provento',     10),
  ('HORAS_EXTRAS',    'Horas extras',                  'provento',     20),
  ('ADIC_NOTURNO',    'Adicional noturno',             'provento',     30),
  ('COMISSAO',        'Comissões',                     'provento',     40),
  ('FERIAS',          'Férias',                        'provento',     50),
  ('TERCEIRO',        '13º salário',                   'provento',     60),
  ('AJUDA_CUSTO',     'Ajuda de custo',                'provento',     70),
  ('INSS',            'INSS',                          'desconto',     110),
  ('IRRF',            'IRRF',                          'desconto',     120),
  ('VT_DESCONTO',     'Vale-transporte (desconto)',    'desconto',     130),
  ('VR_DESCONTO',     'Vale-refeição (desconto)',      'desconto',     140),
  ('PLANO_SAUDE',     'Plano de saúde',                'desconto',     150),
  ('PLANO_ODONTO',    'Plano odontológico',            'desconto',     160),
  ('ADIANTAMENTO',    'Adiantamento',                  'desconto',     170),
  ('FALTAS',          'Faltas / DSR',                  'desconto',     180),
  ('FGTS',            'FGTS (informativo)',            'informativo',  210),
  ('BASE_INSS',       'Base de cálculo INSS',          'base',         310),
  ('BASE_IRRF',       'Base de cálculo IRRF',          'base',         320),
  ('BASE_FGTS',       'Base de cálculo FGTS',          'base',         330)
) AS v(code, description, kind, sort_order)
ON CONFLICT (organization_id, code) DO NOTHING;

-- Garante seed também para novas organizações
CREATE OR REPLACE FUNCTION public.seed_org_payroll_rubrics()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.payroll_rubrics (organization_id, code, description, kind, is_system, sort_order)
  VALUES
    (NEW.id, 'SALARIO',        'Salário base',                  'provento',     10),
    (NEW.id, 'HORAS_EXTRAS',   'Horas extras',                  'provento',     20),
    (NEW.id, 'ADIC_NOTURNO',   'Adicional noturno',             'provento',     30),
    (NEW.id, 'COMISSAO',       'Comissões',                     'provento',     40),
    (NEW.id, 'FERIAS',         'Férias',                        'provento',     50),
    (NEW.id, 'TERCEIRO',       '13º salário',                   'provento',     60),
    (NEW.id, 'AJUDA_CUSTO',    'Ajuda de custo',                'provento',     70),
    (NEW.id, 'INSS',           'INSS',                          'desconto',     110),
    (NEW.id, 'IRRF',           'IRRF',                          'desconto',     120),
    (NEW.id, 'VT_DESCONTO',    'Vale-transporte (desconto)',    'desconto',     130),
    (NEW.id, 'VR_DESCONTO',    'Vale-refeição (desconto)',      'desconto',     140),
    (NEW.id, 'PLANO_SAUDE',    'Plano de saúde',                'desconto',     150),
    (NEW.id, 'PLANO_ODONTO',   'Plano odontológico',            'desconto',     160),
    (NEW.id, 'ADIANTAMENTO',   'Adiantamento',                  'desconto',     170),
    (NEW.id, 'FALTAS',         'Faltas / DSR',                  'desconto',     180),
    (NEW.id, 'FGTS',           'FGTS (informativo)',            'informativo',  210),
    (NEW.id, 'BASE_INSS',      'Base de cálculo INSS',          'base',         310),
    (NEW.id, 'BASE_IRRF',      'Base de cálculo IRRF',          'base',         320),
    (NEW.id, 'BASE_FGTS',      'Base de cálculo FGTS',          'base',         330)
  ON CONFLICT (organization_id, code) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_seed_org_payroll_rubrics ON public.organizations;
CREATE TRIGGER trg_seed_org_payroll_rubrics
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.seed_org_payroll_rubrics();
