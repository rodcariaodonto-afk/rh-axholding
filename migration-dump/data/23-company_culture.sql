-- ============================================
-- PoPeople Database Migration
-- DATA: company_culture
-- ============================================

INSERT INTO company_culture (id, mission, vision, values, swot_strengths, swot_weaknesses, swot_opportunities, swot_threats, modified_by, created_at, updated_at) VALUES
  ('07616c5e-6f42-4ab4-b103-b7128f26bfee', 
   'Criar produtos digitais de alta qualidade, melhorando a vida das pessoas e promovendo ótimos relacionamentos ao longo do caminho.',
   'Criar grandes experiências através da pequena tela dos dispositivos móveis, permitindo que empresas e pessoas possam aproveitar o que há de melhor nelas.',
   '[
     {
       "name": "Colaboração",
       "bullets": "Construir redes de trabalho eficazes com colegas, grupos de interesse, clientes e equipes com a finalidade de aproveitar as oportunidades.\nPromover e apoiar os outros para obter resultados que contribuam para os objetivos a curto, médio e longo prazo da empresa.\nGuiar, motivar e impulsionar os outros a dar o melhor de si mesmos."
     },
     {
       "name": "Confiança",
       "bullets": "Partilhar os pensamentos próprios de forma aberta e autêntica levando em conta a sua idoneidade e sinceridade.\nSer transparente dizendo o que pensa, mesmo que seja desconfortável, mas sempre de forma empática.\nSer transparente com a situação/dificuldade que está enfrentando no trabalho.\nCompreender e reconhecer os esforços e resultados das pessoas, equipes e departamentos, procurando o valor e a aprendizagem em todas as atividades e proporcionando críticas construtivas e integradoras."
     },
     {
       "name": "Diversidade",
       "bullets": "Colaborar efetivamente com pessoas de diferentes culturas e backgrounds.\nReconhecer que todos temos preconceitos e trabalhar para superá-los.\nIntervir ao perceber que alguém está sendo marginalizado.\nNão admitir que a textura do cabelo, hábitos culturais, gênero e crenças religiosas sejam usados para constranger, humilhar ou negar direitos e oportunidades a todos da empresa.\nSer agente de transformação dentro da Popcode em prol de promover um ambiente que todos se sintam abraçados e aceitos."
     },
     {
       "name": "Liberdade",
       "bullets": "Estar disposto a correr riscos e estar aberto a possíveis fracassos.\nQuestionar ações inconsistentes com os valores da empresa.\nSentir-se livre para aprender com suas falhas.\nTrabalhar com independência e liberdade, agindo sempre com senso de responsabilidade."
     },
     {
       "name": "Organização",
       "bullets": "Comunicar efetivamente o trabalho que está sendo desenvolvido.\nSeguir e valorizar os padrões orientados pela empresa, buscando a qualidade em 1º lugar.\nOrganizar as prioridades para realizar suas entregas descomplicando a forma de realizar suas tarefas."
     },
     {
       "name": "Trabalhar com o que ama",
       "bullets": "Inspirar outras pessoas com seu trabalho.\nCompartilhar conhecimento sobre o que você ama fazer.\nImportar-se com o sucesso de seus colegas de equipe e da empresa.\nVestir a camisa da empresa para contribuir no alcance dos objetivos."
     }
   ]'::jsonb,
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
Salários altos do mercado',
   NULL,
   '2025-12-10 14:40:08.200118+00',
   '2025-12-10 14:44:32.009654+00');

-- ============================================
-- FIM DOS DADOS DE COMPANY_CULTURE
-- ============================================
