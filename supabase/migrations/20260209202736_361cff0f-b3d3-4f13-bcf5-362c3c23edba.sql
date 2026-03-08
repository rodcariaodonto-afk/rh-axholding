
-- Trigger function to seed default departments and positions for new organizations
CREATE OR REPLACE FUNCTION public.seed_org_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Seed 10 default departments
  INSERT INTO public.departments (organization_id, name, description) VALUES
    (NEW.id, 'Engenharia', 'Desenvolvimento de software e infraestrutura'),
    (NEW.id, 'Produto', 'Gestão de produto e roadmap'),
    (NEW.id, 'Design', 'Design de interfaces e experiência do usuário'),
    (NEW.id, 'People', 'Gestão de pessoas e cultura organizacional'),
    (NEW.id, 'Comercial', 'Vendas e relacionamento com clientes'),
    (NEW.id, 'Financeiro', 'Finanças, contabilidade e controladoria'),
    (NEW.id, 'Marketing', 'Marketing, comunicação e branding'),
    (NEW.id, 'Jurídico', 'Assessoria jurídica e compliance'),
    (NEW.id, 'Operações', 'Operações, processos e logística'),
    (NEW.id, 'Suporte', 'Atendimento ao cliente e suporte técnico');

  -- Seed 12 default positions
  INSERT INTO public.positions (organization_id, title, description, has_levels) VALUES
    (NEW.id, 'Desenvolvedor(a)', 'Desenvolvimento de software', true),
    (NEW.id, 'Designer', 'Design de UI/UX e produto', true),
    (NEW.id, 'Product Manager', 'Gestão de produto', true),
    (NEW.id, 'QA / Analista de Qualidade', 'Garantia de qualidade e testes', true),
    (NEW.id, 'DevOps / SRE', 'Infraestrutura e confiabilidade', true),
    (NEW.id, 'Tech Lead', 'Liderança técnica de equipes', false),
    (NEW.id, 'Data Analyst', 'Análise de dados e métricas', true),
    (NEW.id, 'Scrum Master', 'Facilitação ágil e melhoria de processos', false),
    (NEW.id, 'Analista de RH', 'Gestão de pessoas e processos de RH', true),
    (NEW.id, 'Analista Financeiro', 'Análise financeira e controladoria', true),
    (NEW.id, 'Vendedor(a)', 'Vendas e prospecção de clientes', true),
    (NEW.id, 'Analista de Marketing', 'Estratégia e execução de marketing', true);

  RETURN NEW;
END;
$$;

-- Create trigger on organizations table
CREATE TRIGGER trg_seed_org_defaults
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_org_defaults();
