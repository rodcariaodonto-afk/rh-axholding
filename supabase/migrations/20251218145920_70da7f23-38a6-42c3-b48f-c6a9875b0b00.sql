-- =============================================
-- FASE 0: Preparação Multi-Tenant
-- =============================================

-- 1. Adicionar novos campos à tabela organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS allowed_domains TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS max_employees INTEGER DEFAULT 50;

-- Atualizar organização Popcode existente com domínio permitido
UPDATE public.organizations
SET allowed_domains = ARRAY['popcode.com.br']
WHERE slug = 'popcode';

-- 2. Criar tabela organization_members
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    is_owner BOOLEAN DEFAULT false,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON public.organization_members(role);

-- Habilitar RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 3. Criar função has_org_role (para futuro uso multi-tenant)
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id UUID, _org_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role = _role
  )
$$;

-- 4. Criar função user_belongs_to_org
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
  )
$$;

-- 5. Criar função get_user_organization (retorna org padrão do usuário)
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id
  ORDER BY is_owner DESC, joined_at ASC
  LIMIT 1
$$;

-- 6. RLS Policies para organization_members
CREATE POLICY "organization_members_select_own"
ON public.organization_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "organization_members_select_same_org"
ON public.organization_members
FOR SELECT
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM public.organization_members om 
    WHERE om.user_id = auth.uid()
  )
);

CREATE POLICY "organization_members_insert_owner_admin"
ON public.organization_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND (om.is_owner = true OR om.role = 'admin')
  )
);

CREATE POLICY "organization_members_update_owner_admin"
ON public.organization_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND (om.is_owner = true OR om.role = 'admin')
  )
);

CREATE POLICY "organization_members_delete_owner"
ON public.organization_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.is_owner = true
  )
);

-- 7. Migrar usuários existentes para organization_members (Popcode)
INSERT INTO public.organization_members (organization_id, user_id, role, is_owner, joined_at)
SELECT 
  (SELECT id FROM public.organizations WHERE slug = 'popcode'),
  ur.user_id,
  ur.role,
  (ur.role = 'admin'),
  COALESCE(e.created_at, now())
FROM public.user_roles ur
LEFT JOIN public.employees e ON e.id = ur.user_id
WHERE EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'popcode')
ON CONFLICT (organization_id, user_id) DO NOTHING;