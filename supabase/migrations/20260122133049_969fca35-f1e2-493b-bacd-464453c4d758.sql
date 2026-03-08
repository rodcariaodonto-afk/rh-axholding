-- Insert the Talent Bank job with fixed UUID
INSERT INTO jobs (id, title, status, created_by, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Banco de Talentos',
  'active',
  '4062e1a4-95be-4012-8c2d-e7340603cc9e',
  'Cadastre-se em nosso banco de talentos para fazer parte de uma startup/fintechs com grandes oportunidades de crescimento e um time muito colaborativo.'
)
ON CONFLICT (id) DO NOTHING;