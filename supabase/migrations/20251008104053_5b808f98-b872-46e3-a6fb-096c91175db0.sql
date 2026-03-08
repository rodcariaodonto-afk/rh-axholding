-- 1. Criar enum para níveis detalhados
CREATE TYPE position_level_detail AS ENUM (
  'junior_i',
  'junior_ii',
  'junior_iii',
  'pleno_i',
  'pleno_ii',
  'pleno_iii',
  'senior_i',
  'senior_ii',
  'senior_iii'
);

-- 2. Alterar tabela employees
ALTER TABLE employees DROP COLUMN IF EXISTS position_id;
ALTER TABLE employees ADD COLUMN base_position_id uuid REFERENCES positions(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN position_level_detail position_level_detail;

-- 3. Alterar tabela positions
ALTER TABLE positions DROP COLUMN IF EXISTS level;
ALTER TABLE positions DROP COLUMN IF EXISTS department_id;
ALTER TABLE positions ADD COLUMN has_levels boolean NOT NULL DEFAULT true;

-- 4. Cadastrar cargos base
-- Desenvolvimento (5 cargos - COM níveis)
INSERT INTO positions (title, has_levels, description) VALUES
('Desenvolvedor iOS', true, 'Desenvolvimento de aplicativos iOS nativos'),
('Desenvolvedor Android', true, 'Desenvolvimento de aplicativos Android nativos'),
('Desenvolvedor Flutter', true, 'Desenvolvimento multiplataforma com Flutter'),
('Desenvolvedor React Native', true, 'Desenvolvimento multiplataforma com React Native'),
('Desenvolvedor Web', true, 'Desenvolvimento de aplicações web');

-- Design (1 cargo - COM níveis)
INSERT INTO positions (title, has_levels, description) VALUES
('UI/UX Designer', true, 'Design de interfaces e experiência do usuário');

-- Produto (1 cargo - COM níveis)
INSERT INTO positions (title, has_levels, description) VALUES
('Product Owner', true, 'Gestão de produtos e backlog');

-- Gestão Ágil (1 cargo - COM níveis)
INSERT INTO positions (title, has_levels, description) VALUES
('Scrum Master', true, 'Facilitação de processos ágeis');

-- People & Cultura (1 cargo - COM níveis)
INSERT INTO positions (title, has_levels, description) VALUES
('People Operations', true, 'Gestão de pessoas e cultura organizacional');

-- Negócios (1 cargo - SEM níveis)
INSERT INTO positions (title, has_levels, description) VALUES
('Business Partner', false, 'Parceria estratégica de negócios');

-- Trainee (5 cargos - SEM níveis)
INSERT INTO positions (title, has_levels, description) VALUES
('Trainee de Desenvolvimento', false, 'Programa trainee - área de desenvolvimento'),
('Trainee de Design', false, 'Programa trainee - área de design'),
('Trainee de Produto', false, 'Programa trainee - área de produto'),
('Trainee de People', false, 'Programa trainee - área de people'),
('Trainee de Negócios', false, 'Programa trainee - área de negócios');

-- C-Level (3 cargos - SEM níveis)
INSERT INTO positions (title, has_levels, description) VALUES
('CEO', false, 'Chief Executive Officer'),
('CTO', false, 'Chief Technology Officer'),
('CFMO', false, 'Chief Financial & Marketing Officer');