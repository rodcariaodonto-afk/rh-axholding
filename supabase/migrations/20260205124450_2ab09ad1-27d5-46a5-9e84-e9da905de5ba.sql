-- ============================================
-- FASE 1: Sistema de Permissões Multi-Tenant
-- Tabelas: roles, permissions, role_permissions, permission_audit_log
-- ============================================

-- 1.1 Criar tabela ROLES (versão simplificada com UUID PK)
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.roles IS 'Roles do sistema. organization_id NULL = role de sistema global';

-- Índice único para garantir slug único por org (usando expressão)
CREATE UNIQUE INDEX idx_roles_slug_org_unique 
ON roles (slug, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX idx_roles_org_id ON roles(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_roles_system ON roles(is_system) WHERE is_system = true;
CREATE INDEX idx_roles_slug ON roles(slug);

-- Trigger para updated_at
CREATE TRIGGER set_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 1.2 Criar tabela PERMISSIONS (global)
CREATE TABLE public.permissions (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_permissions_module ON permissions(module);

-- 1.3 Criar tabela ROLE_PERMISSIONS
CREATE TABLE public.role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- 1.4 Atualizar ORGANIZATION_MEMBERS com role_id
ALTER TABLE organization_members
ADD COLUMN role_id UUID REFERENCES roles(id) ON DELETE RESTRICT;

CREATE INDEX idx_org_members_user_org ON organization_members(user_id, organization_id);
CREATE INDEX idx_org_members_role ON organization_members(role_id);

-- 1.5 Criar tabela PERMISSION_AUDIT_LOG
CREATE TABLE public.permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID,
  target_role_id UUID,
  permission_id TEXT,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  changed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_permission_audit_org ON permission_audit_log(organization_id);
CREATE INDEX idx_permission_audit_created ON permission_audit_log(created_at DESC);
CREATE INDEX idx_permission_audit_action ON permission_audit_log(action);

-- ============================================
-- 1.6 SEED: Roles de Sistema
-- ============================================
INSERT INTO roles (id, slug, organization_id, name, description, is_system) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin', NULL, 'Administrador', 'Acesso total ao sistema', true),
  ('22222222-2222-2222-2222-222222222222', 'people', NULL, 'People', 'Gestão de pessoas e processos de RH', true),
  ('33333333-3333-3333-3333-333333333333', 'user', NULL, 'Usuário', 'Acesso básico de visualização', true);

-- ============================================
-- 1.7 SEED: 35 Permissões
-- ============================================
INSERT INTO permissions (id, module, action, description, display_order) VALUES
  ('devices.view', 'devices', 'view', 'Visualizar dispositivos', 10),
  ('devices.create', 'devices', 'create', 'Criar dispositivos', 11),
  ('devices.edit', 'devices', 'edit', 'Editar dispositivos', 12),
  ('devices.delete', 'devices', 'delete', 'Excluir dispositivos', 13),
  ('employees.view', 'employees', 'view', 'Visualizar próprio perfil', 20),
  ('employees.view_all', 'employees', 'view_all', 'Visualizar todos os colaboradores', 21),
  ('employees.edit', 'employees', 'edit', 'Editar colaboradores', 22),
  ('employees.delete', 'employees', 'delete', 'Excluir colaboradores', 23),
  ('time_off.view', 'time_off', 'view', 'Visualizar férias/folgas', 30),
  ('time_off.create', 'time_off', 'create', 'Solicitar férias/folgas', 31),
  ('time_off.approve', 'time_off', 'approve', 'Aprovar férias/folgas', 32),
  ('time_off.delete', 'time_off', 'delete', 'Excluir férias/folgas', 33),
  ('certificates.view', 'certificates', 'view', 'Visualizar certificados', 40),
  ('certificates.create', 'certificates', 'create', 'Criar certificados', 41),
  ('certificates.delete', 'certificates', 'delete', 'Excluir certificados', 42),
  ('trainings.view', 'trainings', 'view', 'Visualizar treinamentos', 50),
  ('trainings.create', 'trainings', 'create', 'Criar treinamentos', 51),
  ('trainings.delete', 'trainings', 'delete', 'Excluir treinamentos', 52),
  ('jobs.view', 'jobs', 'view', 'Visualizar vagas', 60),
  ('jobs.create', 'jobs', 'create', 'Criar vagas', 61),
  ('jobs.edit', 'jobs', 'edit', 'Editar vagas', 62),
  ('jobs.delete', 'jobs', 'delete', 'Excluir vagas', 63),
  ('jobs.publish', 'jobs', 'publish', 'Publicar vagas', 64),
  ('positions.view', 'positions', 'view', 'Visualizar cargos', 70),
  ('positions.create', 'positions', 'create', 'Criar cargos', 71),
  ('positions.edit', 'positions', 'edit', 'Editar cargos', 72),
  ('positions.delete', 'positions', 'delete', 'Excluir cargos', 73),
  ('applications.view', 'applications', 'view', 'Visualizar candidaturas', 80),
  ('applications.manage', 'applications', 'manage', 'Gerenciar candidaturas', 81),
  ('applications.delete', 'applications', 'delete', 'Excluir candidaturas', 82),
  ('users.view', 'users', 'view', 'Visualizar usuários', 90),
  ('users.manage_roles', 'users', 'manage_roles', 'Gerenciar roles e permissões', 91),
  ('admin.view_costs', 'admin', 'view_costs', 'Visualizar custos', 100),
  ('admin.system_settings', 'admin', 'system_settings', 'Configurações do sistema', 101);

-- ============================================
-- 1.8 SEED: Mapeamento Role -> Permissions
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM permissions;

INSERT INTO role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222', id 
FROM permissions 
WHERE module != 'admin' AND id != 'users.manage_roles';

INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333333', id 
FROM permissions 
WHERE id IN ('employees.view', 'time_off.view', 'time_off.create', 'certificates.view', 'trainings.view');

-- ============================================
-- 1.9 Migração de Dados Existentes
-- ============================================
UPDATE organization_members om
SET role_id = r.id
FROM roles r
WHERE r.slug = om.role::text
  AND r.is_system = true
  AND om.role_id IS NULL;

-- ============================================
-- FASE 2: Funções de Banco de Dados
-- ============================================

CREATE OR REPLACE FUNCTION public.has_org_permission(
  _user_id UUID, 
  _org_id UUID, 
  _permission TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    JOIN role_permissions rp ON rp.role_id = om.role_id
    WHERE om.user_id = _user_id
      AND om.organization_id = _org_id
      AND rp.permission_id = _permission
  )
$$;

COMMENT ON FUNCTION has_org_permission IS 'Verifica se usuário tem permissão específica na organização';

CREATE OR REPLACE FUNCTION public.get_org_user_permissions(
  _user_id UUID, 
  _org_id UUID
)
RETURNS TABLE (
  permission_id TEXT, 
  module TEXT, 
  action TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.id, p.module, p.action
  FROM organization_members om
  JOIN role_permissions rp ON rp.role_id = om.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE om.user_id = _user_id
    AND om.organization_id = _org_id
$$;

DROP FUNCTION IF EXISTS public.has_org_role(UUID, UUID, TEXT);
CREATE OR REPLACE FUNCTION public.has_org_role(
  _user_id UUID, 
  _org_id UUID, 
  _role TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    JOIN roles r ON om.role_id = r.id
    WHERE om.user_id = _user_id
      AND om.organization_id = _org_id
      AND r.slug = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.count_org_admins(_org_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM organization_members om
  JOIN roles r ON om.role_id = r.id
  WHERE om.organization_id = _org_id
    AND r.slug = 'admin'
$$;

COMMENT ON FUNCTION count_org_admins IS 'Conta admins da org para prevenir remoção do último';

-- ============================================
-- FASE 3: RLS nas Novas Tabelas
-- ============================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles FORCE ROW LEVEL SECURITY;

CREATE POLICY "roles_select" ON roles
  FOR SELECT TO authenticated
  USING (
    is_system = true 
    OR is_same_org(organization_id)
  );

CREATE POLICY "roles_insert" ON roles
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_same_org(organization_id)
    AND (
      has_org_permission(auth.uid(), organization_id, 'users.manage_roles')
      OR has_org_role(auth.uid(), organization_id, 'admin')
    )
  );

CREATE POLICY "roles_update" ON roles
  FOR UPDATE TO authenticated
  USING (
    NOT is_system
    AND is_same_org(organization_id)
    AND (
      has_org_permission(auth.uid(), organization_id, 'users.manage_roles')
      OR has_org_role(auth.uid(), organization_id, 'admin')
    )
  );

CREATE POLICY "roles_delete" ON roles
  FOR DELETE TO authenticated
  USING (
    NOT is_system
    AND is_same_org(organization_id)
    AND (
      has_org_permission(auth.uid(), organization_id, 'users.manage_roles')
      OR has_org_role(auth.uid(), organization_id, 'admin')
    )
  );

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions FORCE ROW LEVEL SECURITY;

CREATE POLICY "permissions_select" ON permissions
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions FORCE ROW LEVEL SECURITY;

CREATE POLICY "role_permissions_select" ON role_permissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles r 
      WHERE r.id = role_id 
      AND (r.is_system OR is_same_org(r.organization_id))
    )
  );

CREATE POLICY "role_permissions_insert" ON role_permissions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles r 
      WHERE r.id = role_id 
      AND NOT r.is_system
      AND is_same_org(r.organization_id)
      AND (
        has_org_permission(auth.uid(), r.organization_id, 'users.manage_roles')
        OR has_org_role(auth.uid(), r.organization_id, 'admin')
      )
    )
  );

CREATE POLICY "role_permissions_delete" ON role_permissions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles r 
      WHERE r.id = role_id 
      AND NOT r.is_system
      AND is_same_org(r.organization_id)
      AND (
        has_org_permission(auth.uid(), r.organization_id, 'users.manage_roles')
        OR has_org_role(auth.uid(), r.organization_id, 'admin')
      )
    )
  );

ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_audit_log FORCE ROW LEVEL SECURITY;

CREATE POLICY "permission_audit_log_select" ON permission_audit_log
  FOR SELECT TO authenticated
  USING (
    is_same_org(organization_id)
    AND (
      has_org_permission(auth.uid(), organization_id, 'users.manage_roles')
      OR has_org_role(auth.uid(), organization_id, 'admin')
    )
  );