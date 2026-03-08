-- Tabela de organizações para suporte multi-tenant
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  employee_count TEXT,
  industry TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir organização padrão (Popcode)
INSERT INTO public.organizations (slug, name, description, employee_count, industry, website) 
VALUES (
  'popcode', 
  'Popcode', 
  'A Popcode é uma startup brasileira criada para explorar um novo e eficaz canal de comunicação.',
  '11-50 funcionários',
  'technology',
  'https://popcode.com.br'
);

-- Habilitar RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem visualizar organizações (público)
CREATE POLICY "organizations_select_public" ON public.organizations
FOR SELECT TO anon, authenticated USING (true);

-- Policy: Admin/People podem gerenciar
CREATE POLICY "organizations_manage" ON public.organizations
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'people'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'people'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();