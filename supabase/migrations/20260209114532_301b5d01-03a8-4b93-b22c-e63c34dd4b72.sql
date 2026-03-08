
-- STEP 2: Drop all legacy role infrastructure

-- Drop overloaded has_org_role(uuid, uuid, app_role)
DROP FUNCTION IF EXISTS public.has_org_role(uuid, uuid, app_role);

-- Drop legacy has_role(uuid, app_role)
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Drop legacy user_roles table
DROP TABLE IF EXISTS public.user_roles;

-- Drop legacy role column from organization_members
ALTER TABLE public.organization_members DROP COLUMN IF EXISTS role;

-- Drop legacy enum
DROP TYPE IF EXISTS public.app_role;

-- Drop duplicate trigger/function
DROP TRIGGER IF EXISTS on_organization_created ON organizations;
DROP FUNCTION IF EXISTS public.create_org_default_roles();
