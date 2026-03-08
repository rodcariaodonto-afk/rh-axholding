-- positions (19 registros)
-- Execute SELECT * FROM positions no Lovable Cloud para obter dados completos
-- Exemplo de estrutura:
INSERT INTO public.positions (id, title, description, has_levels, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Desenvolvedor', 'Desenvolvedor de software', true, now(), now()),
  (gen_random_uuid(), 'Designer', 'Designer de UI/UX', true, now(), now()),
  (gen_random_uuid(), 'Product Manager', 'Gerente de Produto', true, now(), now()),
  (gen_random_uuid(), 'DevOps', 'Engenheiro DevOps', true, now(), now()),
  (gen_random_uuid(), 'QA', 'Analista de Qualidade', true, now(), now());
-- NOTA: Execute a query no banco origem para obter todos os 19 registros com IDs corretos
