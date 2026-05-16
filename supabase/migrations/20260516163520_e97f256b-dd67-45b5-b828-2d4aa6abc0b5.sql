
-- =====================================================
-- FASE 1: Super Admin AXIS — Fundação SaaS Multi-tenant
-- =====================================================

-- 1) Extender organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('trial','active','suspended','cancelled','pending_deletion','deleted')),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS responsible_name TEXT,
  ADD COLUMN IF NOT EXISTS responsible_email TEXT,
  ADD COLUMN IF NOT EXISTS responsible_phone TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS last_access_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_id UUID;

-- 2) Plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_modules TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_plan_id_fkey,
  ADD CONSTRAINT organizations_plan_id_fkey
    FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE SET NULL;

-- 3) Organization modules
CREATE TABLE IF NOT EXISTS public.organization_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  enabled_by UUID,
  enabled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, module_key)
);

-- 4) Platform audit log (global, append-only)
CREATE TABLE IF NOT EXISTS public.platform_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_organization_id UUID,
  target_user_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) Super admin sessions (impersonation)
CREATE TABLE IF NOT EXISTS public.super_admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_user_id UUID NOT NULL,
  target_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reason TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT
);

-- =====================================================
-- 6) is_platform_admin function
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.organizations o ON o.id = om.organization_id
    LEFT JOIN public.roles r ON r.id = om.role_id
    WHERE om.user_id = _user_id
      AND o.is_internal = true
      AND (om.is_owner = true OR r.slug = 'admin')
  )
$$;

-- =====================================================
-- 7) Log helper
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_platform_action(
  _action TEXT,
  _target_organization_id UUID DEFAULT NULL,
  _target_user_id UUID DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _id UUID;
BEGIN
  INSERT INTO public.platform_audit_log (actor_user_id, action, target_organization_id, target_user_id, metadata)
  VALUES (auth.uid(), _action, _target_organization_id, _target_user_id, _metadata)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- =====================================================
-- 8) RLS
-- =====================================================
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_sessions ENABLE ROW LEVEL SECURITY;

-- Plans: todos podem ler (catálogo público de planos), apenas platform admin escreve
DROP POLICY IF EXISTS "plans_read_all" ON public.plans;
CREATE POLICY "plans_read_all" ON public.plans FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "plans_write_platform_admin" ON public.plans;
CREATE POLICY "plans_write_platform_admin" ON public.plans
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Organization modules: membros da org leem; platform admin lê tudo e escreve
DROP POLICY IF EXISTS "org_modules_read_member" ON public.organization_modules;
CREATE POLICY "org_modules_read_member" ON public.organization_modules
  FOR SELECT TO authenticated
  USING (
    public.is_platform_admin(auth.uid())
    OR public.user_belongs_to_org(auth.uid(), organization_id)
  );

DROP POLICY IF EXISTS "org_modules_write_platform_admin" ON public.organization_modules;
CREATE POLICY "org_modules_write_platform_admin" ON public.organization_modules
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Platform audit log: apenas platform admin lê
DROP POLICY IF EXISTS "platform_audit_read_admin" ON public.platform_audit_log;
CREATE POLICY "platform_audit_read_admin" ON public.platform_audit_log
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));

-- Append-only (sem update/delete)
DROP POLICY IF EXISTS "platform_audit_insert_admin" ON public.platform_audit_log;
CREATE POLICY "platform_audit_insert_admin" ON public.platform_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin(auth.uid()));

-- Super admin sessions: apenas o próprio super admin vê suas sessões
DROP POLICY IF EXISTS "sas_select_own" ON public.super_admin_sessions;
CREATE POLICY "sas_select_own" ON public.super_admin_sessions
  FOR SELECT TO authenticated
  USING (super_admin_user_id = auth.uid() AND public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "sas_insert_admin" ON public.super_admin_sessions;
CREATE POLICY "sas_insert_admin" ON public.super_admin_sessions
  FOR INSERT TO authenticated
  WITH CHECK (super_admin_user_id = auth.uid() AND public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "sas_update_admin" ON public.super_admin_sessions;
CREATE POLICY "sas_update_admin" ON public.super_admin_sessions
  FOR UPDATE TO authenticated
  USING (super_admin_user_id = auth.uid() AND public.is_platform_admin(auth.uid()));

-- =====================================================
-- 9) Allow platform admin to SELECT organizations globally
-- =====================================================
DROP POLICY IF EXISTS "orgs_select_platform_admin" ON public.organizations;
CREATE POLICY "orgs_select_platform_admin" ON public.organizations
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "orgs_update_platform_admin" ON public.organizations;
CREATE POLICY "orgs_update_platform_admin" ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "orgs_insert_platform_admin" ON public.organizations;
CREATE POLICY "orgs_insert_platform_admin" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Platform admin can read all organization_members
DROP POLICY IF EXISTS "om_select_platform_admin" ON public.organization_members;
CREATE POLICY "om_select_platform_admin" ON public.organization_members
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));

-- =====================================================
-- 10) Seeds: plans
-- =====================================================
INSERT INTO public.plans (slug, name, description, price_cents, default_modules, display_order, features)
VALUES
  ('starter', 'Starter', 'Plano inicial para pequenas empresas', 9900,
    ARRAY['employees','time_tracking','documents','organogram'], 1,
    '{"max_employees": 25, "max_storage_gb": 5, "signature_provider_required": false}'::jsonb),
  ('professional', 'Professional', 'Plano profissional com recursos avançados', 29900,
    ARRAY['employees','time_tracking','documents','organogram','payroll','recruitment','pdi','training','signature'], 2,
    '{"max_employees": 200, "max_storage_gb": 50, "signature_provider_required": true}'::jsonb),
  ('enterprise', 'Enterprise', 'Plano completo com suporte e ICP-Brasil', 99900,
    ARRAY['employees','time_tracking','documents','organogram','payroll','recruitment','pdi','training','signature','culture','governance','audit'], 3,
    '{"max_employees": -1, "max_storage_gb": 500, "signature_provider_required": true, "icp_brasil": true}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 11) Seed: AXHolding Internal organization
-- =====================================================
INSERT INTO public.organizations (name, slug, description, is_internal, status)
VALUES ('AXHolding Internal', 'axholding-internal', 'Organização interna da AXHolding — Super Admin AXIS', true, 'active')
ON CONFLICT (slug) DO UPDATE SET is_internal = true;

-- =====================================================
-- 12) Trigger: auto-promove rodcaria.odonto@gmail.com a Super Admin
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_promote_axis_super_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _internal_org_id UUID;
  _admin_role_id UUID;
BEGIN
  IF NEW.email != 'rodcaria.odonto@gmail.com' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO _internal_org_id FROM public.organizations WHERE slug = 'axholding-internal' LIMIT 1;
  IF _internal_org_id IS NULL THEN RETURN NEW; END IF;

  -- Garante role admin local para a org interna
  SELECT id INTO _admin_role_id FROM public.roles
   WHERE organization_id = _internal_org_id AND slug = 'admin' LIMIT 1;

  IF _admin_role_id IS NULL THEN
    INSERT INTO public.roles (slug, organization_id, name, description, is_system)
    VALUES ('admin', _internal_org_id, 'Admin', 'Administrador AXIS', false)
    RETURNING id INTO _admin_role_id;
  END IF;

  -- Insere membership se ainda não existe
  INSERT INTO public.organization_members (user_id, organization_id, role_id, is_owner, joined_at)
  VALUES (NEW.id, _internal_org_id, _admin_role_id, true, now())
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_promote_axis_super_admin ON auth.users;
CREATE TRIGGER trg_auto_promote_axis_super_admin
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_promote_axis_super_admin();

-- Caso o usuário já exista, promove agora
DO $$
DECLARE
  _user_id UUID;
  _internal_org_id UUID;
  _admin_role_id UUID;
BEGIN
  SELECT id INTO _user_id FROM auth.users WHERE email = 'rodcaria.odonto@gmail.com' LIMIT 1;
  IF _user_id IS NULL THEN RETURN; END IF;

  SELECT id INTO _internal_org_id FROM public.organizations WHERE slug = 'axholding-internal';
  
  -- Garante seed de roles para a org interna (se trigger seed_org_roles ainda não rodou)
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE organization_id = _internal_org_id AND slug = 'admin') THEN
    INSERT INTO public.roles (slug, organization_id, name, description, is_system)
    VALUES ('admin', _internal_org_id, 'Admin', 'Administrador AXIS', false);
  END IF;

  SELECT id INTO _admin_role_id FROM public.roles
   WHERE organization_id = _internal_org_id AND slug = 'admin' LIMIT 1;

  INSERT INTO public.organization_members (user_id, organization_id, role_id, is_owner, joined_at)
  VALUES (_user_id, _internal_org_id, _admin_role_id, true, now())
  ON CONFLICT DO NOTHING;
END $$;
