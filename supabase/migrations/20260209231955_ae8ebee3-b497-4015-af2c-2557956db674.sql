
-- ============================================================
-- Step 1: Populate permissions table with all 34 permission keys
-- ============================================================
INSERT INTO permissions (id, module, action, description) VALUES
  ('employees.view', 'employees', 'view', 'Visualizar colaboradores'),
  ('employees.view_all', 'employees', 'view_all', 'Visualizar todos os colaboradores'),
  ('employees.edit', 'employees', 'edit', 'Editar colaboradores'),
  ('employees.delete', 'employees', 'delete', 'Excluir colaboradores'),
  ('devices.view', 'devices', 'view', 'Visualizar dispositivos'),
  ('devices.create', 'devices', 'create', 'Criar dispositivos'),
  ('devices.edit', 'devices', 'edit', 'Editar dispositivos'),
  ('devices.delete', 'devices', 'delete', 'Excluir dispositivos'),
  ('time_off.view', 'time_off', 'view', 'Visualizar férias e ausências'),
  ('time_off.create', 'time_off', 'create', 'Solicitar férias e ausências'),
  ('time_off.approve', 'time_off', 'approve', 'Aprovar férias e ausências'),
  ('time_off.delete', 'time_off', 'delete', 'Excluir solicitações de férias'),
  ('certificates.view', 'certificates', 'view', 'Visualizar certificados'),
  ('certificates.create', 'certificates', 'create', 'Criar certificados'),
  ('certificates.delete', 'certificates', 'delete', 'Excluir certificados'),
  ('trainings.view', 'trainings', 'view', 'Visualizar treinamentos'),
  ('trainings.create', 'trainings', 'create', 'Criar treinamentos'),
  ('trainings.delete', 'trainings', 'delete', 'Excluir treinamentos'),
  ('jobs.view', 'jobs', 'view', 'Visualizar vagas'),
  ('jobs.create', 'jobs', 'create', 'Criar vagas'),
  ('jobs.edit', 'jobs', 'edit', 'Editar vagas'),
  ('jobs.delete', 'jobs', 'delete', 'Excluir vagas'),
  ('jobs.publish', 'jobs', 'publish', 'Publicar vagas'),
  ('positions.view', 'positions', 'view', 'Visualizar cargos'),
  ('positions.create', 'positions', 'create', 'Criar cargos'),
  ('positions.edit', 'positions', 'edit', 'Editar cargos'),
  ('positions.delete', 'positions', 'delete', 'Excluir cargos'),
  ('applications.view', 'applications', 'view', 'Visualizar candidaturas'),
  ('applications.manage', 'applications', 'manage', 'Gerenciar candidaturas'),
  ('applications.delete', 'applications', 'delete', 'Excluir candidaturas'),
  ('users.view', 'users', 'view', 'Visualizar usuários'),
  ('users.manage_roles', 'users', 'manage_roles', 'Gerenciar roles e permissões'),
  ('admin.view_costs', 'admin', 'view_costs', 'Visualizar custos da empresa'),
  ('admin.system_settings', 'admin', 'system_settings', 'Configurações do sistema')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 2: Link permissions to existing org roles
-- ============================================================

-- Admin roles get ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin'
  AND r.organization_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- People roles get everything EXCEPT admin.* and users.manage_roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'people'
  AND r.organization_id IS NOT NULL
  AND p.id NOT IN ('admin.view_costs', 'admin.system_settings', 'users.manage_roles')
ON CONFLICT DO NOTHING;

-- User roles get read-only permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'user'
  AND r.organization_id IS NOT NULL
  AND p.id IN ('employees.view', 'devices.view', 'time_off.view', 'certificates.view', 'trainings.view', 'jobs.view', 'positions.view')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Step 3: Update seed_org_roles() to also seed role_permissions
-- ============================================================
CREATE OR REPLACE FUNCTION seed_org_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
  v_people_id uuid;
  v_user_id uuid;
BEGIN
  -- Create the 3 default roles
  INSERT INTO roles (slug, organization_id, name, description, is_system)
  VALUES ('admin', NEW.id, 'Admin', 'Administrador com acesso total', false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_admin_id;

  INSERT INTO roles (slug, organization_id, name, description, is_system)
  VALUES ('people', NEW.id, 'People', 'Gestão de pessoas', false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_people_id;

  INSERT INTO roles (slug, organization_id, name, description, is_system)
  VALUES ('user', NEW.id, 'Colaborador', 'Acesso básico de colaborador', false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_user_id;

  -- Admin: ALL permissions
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_admin_id, p.id FROM permissions p
    ON CONFLICT DO NOTHING;
  END IF;

  -- People: all except admin.* and users.manage_roles
  IF v_people_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_people_id, p.id FROM permissions p
    WHERE p.id NOT IN ('admin.view_costs', 'admin.system_settings', 'users.manage_roles')
    ON CONFLICT DO NOTHING;
  END IF;

  -- User: read-only basics
  IF v_user_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_user_id, p.id FROM permissions p
    WHERE p.id IN ('employees.view', 'devices.view', 'time_off.view', 'certificates.view', 'trainings.view', 'jobs.view', 'positions.view')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
