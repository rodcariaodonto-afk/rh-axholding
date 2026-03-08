
-- Function: seed_org_skills
-- Seeds 14 skill areas, 123 hard skills, and 9 soft skills for new organizations
CREATE OR REPLACE FUNCTION public.seed_org_skills()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _area_id uuid;
BEGIN
  -- ==================== SKILL AREAS + HARD SKILLS ====================

  -- 1. Agilista
  INSERT INTO skill_areas (organization_id, name, slug, display_order) VALUES (NEW.id, 'Agilista', 'agilista', 1) RETURNING id INTO _area_id;
  INSERT INTO hard_skills (organization_id, area_id, name, level_junior, level_pleno, level_senior, display_order) VALUES
    (NEW.id, _area_id, 'Conhecimento de metodologias ágeis', 2, 4, 5, 1),
    (NEW.id, _area_id, 'Conhecimento de mapeamento e otimização de fluxos', 2, 4, 5, 2),
    (NEW.id, _area_id, 'Conhecimento sobre o ciclo de vida dos produtos', 2, 4, 5, 3),
    (NEW.id, _area_id, 'Levantamento de Requisitos', 2, 4, 5, 4),
    (NEW.id, _area_id, 'Gestão de backlog', 2, 4, 5, 5),
    (NEW.id, _area_id, 'Facilitação de Atividades e Cerimônias', 2, 4, 5, 6),
    (NEW.id, _area_id, 'Métricas Ágeis', 2, 4, 5, 7);

  -- 2. Desenvolvedor
  INSERT INTO skill_areas (organization_id, name, slug, display_order) VALUES (NEW.id, 'Desenvolvedor', 'desenvolvedor', 2) RETURNING id INTO _area_id;
  INSERT INTO hard_skills (organization_id, area_id, name, level_junior, level_pleno, level_senior, display_order) VALUES
    (NEW.id, _area_id, '.NET', 3, 3, 4, 1),
    (NEW.id, _area_id, 'Controle de versão com GIT', 3, 4, 5, 2),
    (NEW.id, _area_id, 'Conhecimento em Testes', 2, 4, 5, 3),
    (NEW.id, _area_id, 'SOLID', 2, 4, 5, 4),
    (NEW.id, _area_id, 'Proficiência na linguagem/framework', 3, 5, 5, 5),
    (NEW.id, _area_id, 'Conhecimento de CI/CD', 1, 4, 5, 6),
    (NEW.id, _area_id, 'Conhecimento de UI/UX', 1, 3, 5, 7),
    (NEW.id, _area_id, 'Integração com nativo (iOS/Android)', 2, 4, 5, 8),
    (NEW.id, _area_id, 'Code Review', 2, 4, 5, 9),
    (NEW.id, _area_id, 'Conhecimento em arquitetura', 2, 4, 5, 10),
    (NEW.id, _area_id, 'Camada de rede e segurança', 1, 3, 5, 11);

  -- 3. Designer
  INSERT INTO skill_areas (organization_id, name, slug, display_order) VALUES (NEW.id, 'Designer', 'designer', 3) RETURNING id INTO _area_id;
  INSERT INTO hard_skills (organization_id, area_id, name, level_junior, level_pleno, level_senior, display_order) VALUES
    (NEW.id, _area_id, 'Conhecimento em Figma', 2, 4, 5, 1),
    (NEW.id, _area_id, 'Conhecimento em Design Thinking', 1, 3, 4, 2),
    (NEW.id, _area_id, 'Princípios de design de interação e arquitetura', 2, 4, 5, 3),
    (NEW.id, _area_id, 'Design critics', 1, 4, 5, 4),
    (NEW.id, _area_id, 'Prototipagem', 2, 4, 5, 5),
    (NEW.id, _area_id, 'Conhecimento básico em FrontEnd', 1, 1, 3, 6),
    (NEW.id, _area_id, 'Boas práticas de design', 2, 3, 5, 7),
    (NEW.id, _area_id, 'Princípios de acessibilidade', 1, 3, 4, 8),
    (NEW.id, _area_id, 'Design System', 1, 3, 4, 9);

  -- 4. People
  INSERT INTO skill_areas (organization_id, name, slug, display_order) VALUES (NEW.id, 'People', 'people', 4) RETURNING id INTO _area_id;
  INSERT INTO hard_skills (organization_id, area_id, name, level_junior, level_pleno, level_senior, display_order) VALUES
    (NEW.id, _area_id, 'Recrutamento & Seleção', 2, 4, 5, 1),
    (NEW.id, _area_id, 'Gestão de Performance', 2, 4, 5, 2),
    (NEW.id, _area_id, 'Treinamento & Desenvolvimento', 1, 3, 5, 3),
    (NEW.id, _area_id, 'Clima Organizacional', 1, 3, 5, 4),
    (NEW.id, _area_id, 'Employer Branding', 1, 3, 4, 5),
    (NEW.id, _area_id, 'Onboarding & Offboarding', 2, 4, 5, 6),
    (NEW.id, _area_id, 'Gestão de Benefícios e Remuneração', 1, 3, 5, 7),
    (NEW.id, _area_id, 'People Analytics', 1, 3, 4, 8),
    (NEW.id, _area_id, 'Legislação Trabalhista (CLT/PJ)', 2, 3, 5, 9),
    (NEW.id, _area_id, 'Cultura e Diversidade', 1, 3, 4, 10);

  -- 5. QA / Teste de Software
  INSERT INTO skill_areas (organization_id, name, slug, display_order) VALUES (NEW.id, 'QA / Teste de Software', 'qa-teste-software', 5) RETURNING id INTO _area_id;
  INSERT INTO hard_skills (organization_id, area_id, name, level_junior, level_pleno, level_senior, display_order) VALUES
    (NEW.id, _area_id, 'Planejamento e Estratégia de Testes', 2, 4, 5, 1),
    (NEW.id, _area_id, 'Testes Manuais (funcional, regressão, exploratório)', 3, 4, 5, 2),
    (NEW.id, _area_id, 'Automação de Testes', 1, 3, 5, 3),
    (NEW.id, _area_id, 'Testes de API (Postman, REST)', 1, 3, 5, 4),
    (NEW.id, _area_id, 'Testes de Performance e Carga', 1, 2, 4, 5),
    (NEW.id, _area_id, 'CI/CD aplicado a QA', 1, 3, 4, 6),
    (NEW.id, _area_id, 'BDD / Gherkin', 1, 3, 4, 7);

  -- 6. Dados / Analytics
  INSERT INTO skill_areas (organization_id, name, slug, display_order) VALUES (NEW.id, 'Dados / Analytics', 'dados-analytics', 6) RETURNING id INTO _area_id;
  INSERT INTO hard_skills (organization_id, area_id, name, level_junior, level_pleno, level_senior, display_order) VALUES
    (NEW.id, _area_id, 'SQL e Modelagem de Dados', 2, 4, 5, 1),
    (NEW.id, _area_id, 'ETL e Pipelines de Dados', 1, 3, 5, 2),
    (NEW.id, _area_id, 'Visualização de Dados (Power BI, Looker, Metabase)', 2, 4, 5, 3),
    (NEW.id, _area_id, 'Python para Dados', 1, 3, 5, 4),
    (NEW.id, _area_id, 'Estatística e Análise Exploratória', 1, 3, 5, 5),
    (NEW.id, _area_id, 'Data Governance e Qualidade', 1, 2, 4, 6),
    (NEW.id, _area_id, 'Cloud Data (BigQuery, Redshift, Snowflake)', 1, 3, 4, 7);

  -- 7. Produto
  INSERT INTO skill_areas (organization_id, name, slug, display_order) VALUES (NEW.id, 'Produto', 'produto', 7) RETURNING id INTO _area_id;
  INSERT INTO hard_skills (organization_id, area_id, name, level_junior, level_pleno, level_senior, display_order) VALUES
    (NEW.id, _area_id, 'Discovery e Validação de Hipóteses', 1, 4, 5, 1),
    (NEW.id, _area_id, 'Definição de Roadmap', 1, 3, 5, 2),
    (NEW.id, _area_id, 'Métricas de Produto (North Star, OKRs, KPIs)', 1, 3, 5, 3),
    (NEW.id, _area_id, 'Gestão de Stakeholders', 2, 4, 5, 4),
    (NEW.id, _area_id, 'User Research e Análise Qualitativa', 1, 3, 5, 5),
    (NEW.id, _area_id, 'Priorização (RICE, MoSCoW, Impact Mapping)', 1, 3, 5, 6),
    (NEW.id, _area_id, 'Experimentação e A/B Testing', 1, 2, 4, 7);

  -- 8. DevOps / Infraestrutura
  INSERT INTO skill_areas (organization_id, name, slug, display_order) VALUES (NEW.id, 'DevOps / Infraestrutura', 'devops-infraestrutura', 8) RETURNING id INTO _area_id;
  INSERT INTO hard_skills (organization_id, area_id, name, level_junior, level_pleno, level_senior, display_order) VALUES
    (NEW.id, _area_id, 'Linux e Administração de Servidores', 2, 4, 5, 1),
    (NEW.id, _area_id, 'Docker e Containerização', 2, 4, 5, 2),
    (NEW.id, _area_id, 'CI/CD (GitHub Actions, Jenkins, GitLab CI)', 2, 4, 5, 3),
    (NEW.id, _area_id, 'Cloud (AWS, Azure, GCP)', 1, 3, 5, 4),
    (NEW.id, _area_id, 'Kubernetes e Orquestração', 1, 3, 5, 5),
    (NEW.id, _area_id, 'Monitoramento e Observabilidade', 1, 3, 5, 6),
    (NEW.id, _area_id, 'IaC (Terraform, Ansible)', 1, 3, 4, 7);

  -- 9. Comercial / Vendas
  INSERT INTO skill_areas (organization_id, name, slug, display_order) VALUES (NEW.id, 'Comercial / Vendas', 'comercial-vendas', 9) RETURNING id INTO _area_id;
  INSERT INTO hard_skills (organization_id, area_id, name, level_junior, level_pleno, level_senior, display_order) VALUES
    (NEW.id, _area_id, 'Prospecção e Geração de Leads', 2, 4, 5, 1),
    (NEW.id, _area_id, 'CRM e Gestão de Pipeline', 2, 4, 5, 2),
    (NEW.id, _area_id, 'Técnicas de Negociação e Fechamento', 1, 3, 5, 3),
    (NEW.id, _area_id, 'Elaboração de Propostas Comerciais', 2, 4, 5, 4),
    (NEW.id, _area_id, 'Customer Success e Pós-venda', 1, 3, 5, 5),
    (NEW.id, _area_id, 'Análise de Mercado e Concorrência', 1, 3, 4, 6),
    (NEW.id, _area_id, 'Social Selling e Networking', 1, 3, 4, 7),
    (NEW.id, _area_id, 'Vendas Consultivas (B2B/B2C)', 1, 3, 5, 8),
    (NEW.id, _area_id, 'Gestão de Contratos e SLAs', 1, 3, 5, 9);

  -- 10. Marketing Digital
  INSERT INTO skill_areas (organization_id, name, slug, display_order) VALUES (NEW.id, 'Marketing Digital', 'marketing-digital', 10) RETURNING id INTO _area_id;
  INSERT INTO hard_skills (organization_id, area_id, name, level_junior, level_pleno, level_senior, display_order) VALUES
    (NEW.id, _area_id, 'Planejamento de Marketing e Campanhas', 1, 3, 5, 1),
    (NEW.id, _area_id, 'SEO e Otimização de Conteúdo', 2, 4, 5, 2),
    (NEW.id, _area_id, 'Mídia Paga (Google Ads, Meta Ads)', 1, 3, 5, 3),
    (NEW.id, _area_id, 'Automação de Marketing (RD Station, HubSpot)', 1, 3, 5, 4),
    (NEW.id, _area_id, 'E-mail Marketing e Nutrição de Leads', 2, 4, 5, 5),
    (NEW.id, _area_id, 'Analytics e Métricas (GA4, UTMs, atribuição)', 1, 3, 5, 6),
    (NEW.id, _area_id, 'Copywriting', 2, 4, 5, 7),
    (NEW.id, _area_id, 'Inbound Marketing e Funil de Conversão', 1, 3, 5, 8),
    (NEW.id, _area_id, 'Branding e Posicionamento', 1, 3, 4, 9);

  -- 11. Redes Sociais / Social Media
  INSERT INTO skill_areas (organization_id, name, slug, display_order) VALUES (NEW.id, 'Redes Sociais / Social Media', 'redes-sociais', 11) RETURNING id INTO _area_id;
  INSERT INTO hard_skills (organization_id, area_id, name, level_junior, level_pleno, level_senior, display_order) VALUES
    (NEW.id, _area_id, 'Planejamento de Conteúdo e Calendário Editorial', 2, 4, 5, 1),
    (NEW.id, _area_id, 'Produção de Conteúdo (texto, imagem, vídeo)', 2, 4, 5, 2),
    (NEW.id, _area_id, 'Gestão de Comunidade e SAC Social', 2, 4, 5, 3),
    (NEW.id, _area_id, 'Métricas e Relatórios de Redes Sociais', 1, 3, 5, 4),
    (NEW.id, _area_id, 'Ferramentas de Gestão (mLabs, Hootsuite, Buffer)', 2, 3, 4, 5),
    (NEW.id, _area_id, 'Tendências e Social Listening', 1, 3, 5, 6),
    (NEW.id, _area_id, 'Reels, Stories e Formatos Nativos', 2, 4, 5, 7),
    (NEW.id, _area_id, 'Marketing de Influência', 1, 3, 4, 8),
    (NEW.id, _area_id, 'Estratégia de Crescimento Orgânico', 1, 3, 5, 9);

  -- 12. Conteúdo / Redação
  INSERT INTO skill_areas (organization_id, name, slug, display_order) VALUES (NEW.id, 'Conteúdo / Redação', 'conteudo-redacao', 12) RETURNING id INTO _area_id;
  INSERT INTO hard_skills (organization_id, area_id, name, level_junior, level_pleno, level_senior, display_order) VALUES
    (NEW.id, _area_id, 'Redação Publicitária e Criativa', 2, 4, 5, 1),
    (NEW.id, _area_id, 'Produção de Conteúdo para Blog e SEO', 2, 4, 5, 2),
    (NEW.id, _area_id, 'Storytelling', 1, 3, 5, 3),
    (NEW.id, _area_id, 'Roteiro para Vídeo e Podcast', 1, 3, 5, 4),
    (NEW.id, _area_id, 'Revisão e Edição de Textos', 2, 4, 5, 5),
    (NEW.id, _area_id, 'UX Writing', 1, 3, 4, 6),
    (NEW.id, _area_id, 'Adaptação de Tom de Voz por Canal', 1, 3, 5, 7);

  -- 13. Financeiro / Administrativo
  INSERT INTO skill_areas (organization_id, name, slug, display_order) VALUES (NEW.id, 'Financeiro / Administrativo', 'financeiro-administrativo', 13) RETURNING id INTO _area_id;
  INSERT INTO hard_skills (organization_id, area_id, name, level_junior, level_pleno, level_senior, display_order) VALUES
    (NEW.id, _area_id, 'Contas a Pagar e Receber', 2, 4, 5, 1),
    (NEW.id, _area_id, 'Conciliação Bancária', 2, 4, 5, 2),
    (NEW.id, _area_id, 'Fluxo de Caixa e Projeções', 1, 3, 5, 3),
    (NEW.id, _area_id, 'Faturamento e Nota Fiscal', 2, 4, 5, 4),
    (NEW.id, _area_id, 'DRE e Relatórios Financeiros', 1, 3, 5, 5),
    (NEW.id, _area_id, 'Gestão de Contratos e Fornecedores', 1, 3, 5, 6),
    (NEW.id, _area_id, 'Planejamento Orçamentário', 1, 3, 5, 7),
    (NEW.id, _area_id, 'Compliance Fiscal e Tributário', 1, 2, 4, 8);

  -- 14. Suporte / Atendimento ao Cliente
  INSERT INTO skill_areas (organization_id, name, slug, display_order) VALUES (NEW.id, 'Suporte / Atendimento ao Cliente', 'suporte-atendimento', 14) RETURNING id INTO _area_id;
  INSERT INTO hard_skills (organization_id, area_id, name, level_junior, level_pleno, level_senior, display_order) VALUES
    (NEW.id, _area_id, 'Atendimento Multicanal (chat, e-mail, telefone)', 2, 4, 5, 1),
    (NEW.id, _area_id, 'Ferramentas de Help Desk (Zendesk, Freshdesk)', 2, 4, 5, 2),
    (NEW.id, _area_id, 'SLA e Gestão de Tickets', 1, 3, 5, 3),
    (NEW.id, _area_id, 'Base de Conhecimento e FAQ', 2, 3, 5, 4),
    (NEW.id, _area_id, 'Análise de Satisfação (NPS, CSAT)', 1, 3, 5, 5),
    (NEW.id, _area_id, 'Escalonamento e Resolução de Crises', 1, 3, 5, 6),
    (NEW.id, _area_id, 'Onboarding de Clientes', 1, 3, 4, 7);

  -- ==================== SOFT SKILLS (using L2 values) ====================
  INSERT INTO soft_skills (organization_id, name, description, level_junior, level_pleno, level_senior, display_order) VALUES
    (NEW.id, 'Comunicação', 'Transmitir informação com clareza e assertividade', 3, 3, 5, 1),
    (NEW.id, 'Inteligência Emocional', 'Compreender e lidar com as próprias emoções', 2, 3, 5, 2),
    (NEW.id, 'Aprendizagem Ágil', 'Aprender de forma contínua e atualizada', 3, 4, 5, 3),
    (NEW.id, 'Criatividade', 'Encontrar caminhos criativos para resolver problemas', 2, 3, 5, 4),
    (NEW.id, 'Liderança', 'Influenciar e guiar pessoas em direção a um objetivo', 1, 2, 5, 5),
    (NEW.id, 'Negociação e influência', 'Convencer e chegar a resultados compartilhados', 1, 2, 5, 6),
    (NEW.id, 'Pensamento crítico', 'Analisar situações e propor soluções lógicas', 3, 3, 5, 7),
    (NEW.id, 'Produtividade', 'Gerenciar tempo e priorizar tarefas', 2, 3, 4, 8),
    (NEW.id, 'Relacionamento interpessoal', 'Vínculos criados com base em interações sociais', 2, 3, 5, 9);

  RETURN NEW;
END;
$$;

-- Trigger
CREATE TRIGGER trg_seed_org_skills
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_org_skills();
