-- Fix seed_org_roles to create roles directly instead of copying from system roles (which were removed)
CREATE OR REPLACE FUNCTION public.seed_org_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO roles (slug, organization_id, name, description, is_system)
  VALUES
    ('admin', NEW.id, 'Admin', 'Administrador com acesso total', false),
    ('people', NEW.id, 'People', 'Gestão de pessoas', false),
    ('user', NEW.id, 'Colaborador', 'Acesso básico de colaborador', false)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;