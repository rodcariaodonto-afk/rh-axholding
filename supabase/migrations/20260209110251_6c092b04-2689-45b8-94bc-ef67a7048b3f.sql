-- ============================================
-- Auto-seed roles when a new organization is created
-- and ensure the creator is always admin + owner
-- ============================================

-- Function: copies the 3 system roles into the new org
CREATE OR REPLACE FUNCTION public.seed_org_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO roles (slug, organization_id, name, description, is_system)
  SELECT slug, NEW.id, name, description, false
  FROM roles
  WHERE is_system = true
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger: fires after every organization insert
DROP TRIGGER IF EXISTS trg_seed_org_roles ON organizations;
CREATE TRIGGER trg_seed_org_roles
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION seed_org_roles();

-- ============================================
-- Function: ensure the first member of an org is always admin
-- CORRIGIDO: Busca roles LOCAIS da organização
-- ============================================

CREATE OR REPLACE FUNCTION public.enforce_first_member_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _member_count INTEGER;
  _local_role_id UUID;
BEGIN
  -- Count existing members in this org
  SELECT COUNT(*) INTO _member_count
  FROM organization_members
  WHERE organization_id = NEW.organization_id;

  -- If this is the first member, force admin role and owner flag
  IF _member_count = 0 THEN
    -- Buscar role admin LOCAL da organização (não global!)
    SELECT id INTO _local_role_id
    FROM roles
    WHERE slug = 'admin' 
      AND organization_id = NEW.organization_id
    LIMIT 1;

    NEW.role_id := _local_role_id;
    NEW.is_owner := true;
  END IF;

  -- Fallback: if role_id is still NULL, default to local 'user'
  IF NEW.role_id IS NULL THEN
    SELECT id INTO NEW.role_id
    FROM roles
    WHERE slug = 'user' 
      AND organization_id = NEW.organization_id
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_first_member_admin ON organization_members;
CREATE TRIGGER trg_enforce_first_member_admin
  BEFORE INSERT ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION enforce_first_member_admin();