-- Inserir departamentos iniciais
INSERT INTO public.departments (name, description) VALUES
  ('Diretoria', 'Diretoria executiva e estratégica'),
  ('Recursos Humanos', 'Gestão de pessoas e desenvolvimento organizacional'),
  ('Financeiro', 'Gestão financeira e contábil'),
  ('Comercial', 'Vendas e relacionamento com clientes'),
  ('Marketing', 'Marketing e comunicação'),
  ('Tecnologia', 'Desenvolvimento e infraestrutura de TI'),
  ('Produtos', 'Gestão e desenvolvimento de produtos'),
  ('Design', 'Design de produtos e interfaces'),
  ('Operações', 'Operações e processos'),
  ('Customer Success', 'Sucesso do cliente'),
  ('Suporte', 'Suporte técnico e atendimento'),
  ('Jurídico', 'Departamento jurídico'),
  ('Administrativo', 'Administração geral'),
  ('Qualidade', 'Qualidade e processos'),
  ('Inovação', 'Pesquisa e inovação'),
  ('Compras', 'Compras e aquisições'),
  ('Facilities', 'Infraestrutura e facilities')
ON CONFLICT (name) DO NOTHING;