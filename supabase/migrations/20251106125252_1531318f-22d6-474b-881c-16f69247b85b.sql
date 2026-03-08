-- Adicionar campo home_office em employees_contracts
ALTER TABLE public.employees_contracts
ADD COLUMN home_office numeric(10,2) DEFAULT 0;

COMMENT ON COLUMN public.employees_contracts.home_office IS 'Valor mensal do auxílio home office';

-- Criar tabela company_cost_settings
CREATE TABLE public.company_cost_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Percentuais de encargos
  rat_rate numeric(5,2) NOT NULL DEFAULT 1.00,
  system_s_rate numeric(5,2) NOT NULL DEFAULT 5.80,
  inss_employer_rate numeric(5,2) NOT NULL DEFAULT 20.00,
  fgts_rate numeric(5,2) NOT NULL DEFAULT 8.00,
  
  -- Provisões
  enable_severance_provision boolean NOT NULL DEFAULT false,
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  modified_by uuid REFERENCES auth.users(id)
);

COMMENT ON TABLE public.company_cost_settings IS 'Configurações de parâmetros para cálculo de custos da empresa';
COMMENT ON COLUMN public.company_cost_settings.rat_rate IS 'Alíquota RAT (Risco Ambiental do Trabalho) em %';
COMMENT ON COLUMN public.company_cost_settings.system_s_rate IS 'Alíquota Sistema S em %';
COMMENT ON COLUMN public.company_cost_settings.inss_employer_rate IS 'Alíquota INSS Patronal em %';
COMMENT ON COLUMN public.company_cost_settings.fgts_rate IS 'Alíquota FGTS em %';
COMMENT ON COLUMN public.company_cost_settings.enable_severance_provision IS 'Habilitar provisão de multa rescisória (40% FGTS)';

-- RLS: Só admin pode visualizar e modificar
ALTER TABLE public.company_cost_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view settings"
ON public.company_cost_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage settings"
ON public.company_cost_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Inserir configurações padrão
INSERT INTO public.company_cost_settings (rat_rate, system_s_rate, inss_employer_rate, fgts_rate, enable_severance_provision)
VALUES (1.00, 5.80, 20.00, 8.00, false);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_company_cost_settings_updated_at
BEFORE UPDATE ON public.company_cost_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para registrar modified_by
CREATE TRIGGER set_company_cost_settings_modified_by
BEFORE UPDATE ON public.company_cost_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_modified_by();