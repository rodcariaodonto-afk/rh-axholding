-- Create culture table to store organizational culture data
CREATE TABLE public.company_culture (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission text,
  vision text,
  values jsonb DEFAULT '[]'::jsonb,
  swot_strengths text,
  swot_weaknesses text,
  swot_opportunities text,
  swot_threats text,
  modified_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_culture ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view
CREATE POLICY "company_culture_select" ON public.company_culture
FOR SELECT TO authenticated
USING (true);

-- Only admin can modify
CREATE POLICY "company_culture_modify" ON public.company_culture
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_company_culture_updated_at
BEFORE UPDATE ON public.company_culture
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
INSERT INTO public.company_culture (mission, vision, values, swot_strengths, swot_weaknesses, swot_opportunities, swot_threats)
VALUES (
  'Criar produtos digitais de alta qualidade, melhorando a vida das pessoas e promovendo ótimos relacionamentos ao longo do caminho.',
  'Criar grandes experiências através da pequena tela dos dispositivos móveis, permitindo que empresas e pessoas possam aproveitar o que há de melhor nelas.',
  '[]'::jsonb,
  'Cultura organizacional
Qualidade técnica
Ambiente amigável
Investimento em capacitação e desenvolvimento
Conhecimento em apps financeiros
Tempo de mercado
Atestado de capacidade técnica',
  'Salário
Dependência de Hugo nas decisões
Quantidade baixa de projetos
Turn over
Ausência de comercial
Informações descentralizadas
Falta de processos padronizados
Gestão estratégica de resultados',
  'Alta demanda de tecnologia
Crescimento de demanda de apps híbridos
Muitas licitações acontecendo
Alta demanda para outsourcing',
  'Mercado aquecido
Assedio aos colaboradores
Salários altos do mercado'
);