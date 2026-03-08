-- Create a special job for Banco de Talentos with a fixed UUID
-- Only insert if there's at least one employee, otherwise skip
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM employees LIMIT 1) THEN
    INSERT INTO jobs (id, title, status, created_by, description)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'Banco de Talentos',
      'active',
      (SELECT id FROM employees LIMIT 1),
      'Cadastre-se em nosso banco de talentos para fazer parte de uma startup/fintechs com grandes oportunidades de crescimento e um time muito colaborativo.'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;