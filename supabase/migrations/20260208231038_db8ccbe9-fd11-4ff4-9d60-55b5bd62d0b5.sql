-- =============================================================================
-- FASE 1: Pure Multi-Tenant Authorization Model
-- =============================================================================
-- Objetivo: Criar trigger para roles locais + garantir roles existentes para orgs atuais
-- =============================================================================

-- 1. Função que cria roles básicas para uma nova organização
CREATE OR REPLACE FUNCTION public.create_org_default_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir as 3 roles básicas para a nova organização
  INSERT INTO public.roles (slug, organization_id, name, description, is_system)
  VALUES
    ('admin', NEW.id, 'Administrador', 'Acesso total à organização', false),
    ('people', NEW.id, 'People/RH', 'Gestão de pessoas e RH', false),
    ('user', NEW.id, 'Colaborador', 'Acesso básico de colaborador', false)
  ON CONFLICT DO NOTHING; -- Evita erro se roles já existirem
  
  RETURN NEW;
END;
$$;

-- 2. Trigger após criação de organização
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_org_default_roles();

-- 3. Criar roles locais para organizações existentes que não têm
INSERT INTO public.roles (slug, organization_id, name, description, is_system)
SELECT 
  role_slug,
  org.id,
  CASE role_slug 
    WHEN 'admin' THEN 'Administrador'
    WHEN 'people' THEN 'People/RH'
    WHEN 'user' THEN 'Colaborador'
  END,
  CASE role_slug 
    WHEN 'admin' THEN 'Acesso total à organização'
    WHEN 'people' THEN 'Gestão de pessoas e RH'
    WHEN 'user' THEN 'Acesso básico de colaborador'
  END,
  false
FROM public.organizations org
CROSS JOIN (VALUES ('admin'), ('people'), ('user')) AS slugs(role_slug)
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles r 
  WHERE r.organization_id = org.id 
  AND r.slug = slugs.role_slug
);

-- 4. Migrar organization_members com role_id de sistema para role_id local
-- Atualizar membros que usam role admin global para role admin local
UPDATE public.organization_members om
SET role_id = (
  SELECT r.id FROM public.roles r 
  WHERE r.organization_id = om.organization_id 
  AND r.slug = 'admin' 
  LIMIT 1
)
WHERE om.role_id IN (
  SELECT id FROM public.roles WHERE is_system = true AND slug = 'admin'
)
AND EXISTS (
  SELECT 1 FROM public.roles r 
  WHERE r.organization_id = om.organization_id 
  AND r.slug = 'admin'
);

-- Atualizar membros que usam role people global para role people local
UPDATE public.organization_members om
SET role_id = (
  SELECT r.id FROM public.roles r 
  WHERE r.organization_id = om.organization_id 
  AND r.slug = 'people' 
  LIMIT 1
)
WHERE om.role_id IN (
  SELECT id FROM public.roles WHERE is_system = true AND slug = 'people'
)
AND EXISTS (
  SELECT 1 FROM public.roles r 
  WHERE r.organization_id = om.organization_id 
  AND r.slug = 'people'
);

-- Atualizar membros que usam role user global para role user local
UPDATE public.organization_members om
SET role_id = (
  SELECT r.id FROM public.roles r 
  WHERE r.organization_id = om.organization_id 
  AND r.slug = 'user' 
  LIMIT 1
)
WHERE om.role_id IN (
  SELECT id FROM public.roles WHERE is_system = true AND slug = 'user'
)
AND EXISTS (
  SELECT 1 FROM public.roles r 
  WHERE r.organization_id = om.organization_id 
  AND r.slug = 'user'
);

-- 5. Atualizar função has_org_role para garantir que verifica roles locais
-- A função atual já está correta, mas vamos garantir que só considera roles da org
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id uuid, _org_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.roles r ON om.role_id = r.id
    WHERE om.user_id = _user_id
      AND om.organization_id = _org_id
      AND r.slug = _role
      -- Garantir que a role pertence à organização (não é global)
      AND (r.organization_id = _org_id OR r.is_system = true)
  )
$$;

-- 6. Atualizar handle_new_user para usar role local
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending RECORD;
  local_role_id UUID;
BEGIN
  -- Buscar pending_employee pelo email
  SELECT * INTO pending
  FROM public.pending_employees
  WHERE email = NEW.email
    AND status = 'invited'
  ORDER BY created_at DESC
  LIMIT 1;

  IF pending IS NOT NULL THEN
    -- Criar employee com dados do pending
    INSERT INTO public.employees (
      id, email, full_name, organization_id,
      department_id, manager_id, base_position_id,
      position_level_detail, unit_id, employment_type, status
    ) VALUES (
      NEW.id, NEW.email, pending.full_name, pending.organization_id,
      pending.department_id, pending.manager_id, pending.base_position_id,
      pending.position_level_detail, pending.unit_id,
      COALESCE(pending.employment_type, 'full_time'), 'active'
    );

    -- Criar contrato se tiver dados
    IF pending.hire_date IS NOT NULL THEN
      INSERT INTO public.employees_contracts (
        user_id, contract_type, hire_date, base_salary
      ) VALUES (
        NEW.id, COALESCE(pending.contract_type, 'clt'),
        pending.hire_date, COALESCE(pending.base_salary, 0)
      );
    END IF;

    -- Buscar role 'user' LOCAL da organização
    SELECT id INTO local_role_id
    FROM public.roles 
    WHERE slug = 'user' 
      AND organization_id = pending.organization_id
    LIMIT 1;

    -- Criar organization_member com role LOCAL
    INSERT INTO public.organization_members (
      user_id, organization_id, role_id, invited_by
    ) VALUES (
      NEW.id, pending.organization_id,
      local_role_id,
      pending.invited_by
    );

    -- Marcar pending como aceito
    UPDATE public.pending_employees 
    SET status = 'accepted', updated_at = now()
    WHERE id = pending.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 7. Copiar permissões das roles de sistema para roles locais (se existirem)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  local_role.id,
  rp.permission_id
FROM public.roles system_role
JOIN public.role_permissions rp ON rp.role_id = system_role.id
JOIN public.roles local_role ON local_role.slug = system_role.slug 
  AND local_role.organization_id IS NOT NULL
  AND local_role.is_system = false
WHERE system_role.is_system = true
ON CONFLICT DO NOTHING;

-- 8. Comentário de deprecação nas roles de sistema
COMMENT ON TABLE public.user_roles IS 
'⚠️ DEPRECATED (2026-02-08): Esta tabela está deprecada. 
Use organization_members + roles para verificação de permissões.
Será removida na próxima major version.
Ver: ADR-0008, docs/permissions.md';