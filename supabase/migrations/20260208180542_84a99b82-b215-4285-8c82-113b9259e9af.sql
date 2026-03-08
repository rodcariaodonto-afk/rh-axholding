-- Criar roles de sistema (globais, sem organization_id)
INSERT INTO public.roles (id, slug, name, description, is_system, organization_id)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Administrador', 'Acesso total ao sistema', true, NULL),
  ('00000000-0000-0000-0000-000000000002', 'people', 'People/RH', 'Gestão de pessoas e RH', true, NULL),
  ('00000000-0000-0000-0000-000000000003', 'user', 'Colaborador', 'Acesso básico de colaborador', true, NULL)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system = EXCLUDED.is_system;