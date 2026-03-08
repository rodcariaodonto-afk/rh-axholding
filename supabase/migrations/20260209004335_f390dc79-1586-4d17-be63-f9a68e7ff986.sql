-- Corrigir organization_members existentes que têm role_id = NULL
-- Atribuir role admin local para owners existentes

UPDATE organization_members om
SET role_id = (
  SELECT r.id 
  FROM roles r 
  WHERE r.organization_id = om.organization_id 
    AND r.slug = 'admin'
  LIMIT 1
)
WHERE om.role_id IS NULL 
  AND om.is_owner = true;

-- Atribuir role user local para não-owners existentes
UPDATE organization_members om
SET role_id = (
  SELECT r.id 
  FROM roles r 
  WHERE r.organization_id = om.organization_id 
    AND r.slug = 'user'
  LIMIT 1
)
WHERE om.role_id IS NULL 
  AND om.is_owner = false;

-- Adicionar constraint para garantir que role_id não seja NULL no futuro
ALTER TABLE organization_members 
  ALTER COLUMN role_id SET NOT NULL;