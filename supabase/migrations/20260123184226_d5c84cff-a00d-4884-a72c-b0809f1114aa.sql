-- ============================================
-- Multi-Tenant Integrations Infrastructure
-- Secure API key storage using Supabase Vault
-- ============================================

-- ============================================
-- 1. Helper Function: Check if user can manage org integrations
-- ============================================
CREATE OR REPLACE FUNCTION public.can_manage_org_integrations(p_user_id UUID, p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    -- Admin global (suporte técnico)
    has_role(p_user_id, 'admin'::app_role)
    OR
    -- Admin/owner da organização específica
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE user_id = p_user_id 
      AND organization_id = p_org_id 
      AND (is_owner = true OR role = 'admin'::app_role)
    );
$$;

-- ============================================
-- 2. Table: organization_integrations (internal - no direct access)
-- ============================================
CREATE TABLE public.organization_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  vault_secret_id UUID NOT NULL,
  last_four TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_used_at TIMESTAMPTZ,
  last_error TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, provider, environment)
);

-- Indexes
CREATE INDEX idx_org_integrations_org ON organization_integrations(organization_id);
CREATE INDEX idx_org_integrations_provider ON organization_integrations(provider);
CREATE INDEX idx_org_integrations_active ON organization_integrations(status) WHERE status = 'active';

-- RLS enabled but NO SELECT policies for authenticated (access via function only)
ALTER TABLE organization_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_integrations FORCE ROW LEVEL SECURITY;

-- REVOKE direct access to table (vault_secret_id must never be exposed)
REVOKE ALL ON TABLE public.organization_integrations FROM anon, authenticated;

-- Trigger for updated_at
CREATE TRIGGER update_org_integrations_updated_at
  BEFORE UPDATE ON organization_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Function: Get organization integrations (safe - no vault_secret_id)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_organization_integrations(p_org_id UUID)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  provider TEXT,
  environment TEXT,
  last_four TEXT,
  status TEXT,
  last_used_at TIMESTAMPTZ,
  last_error TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    oi.id, oi.organization_id, oi.provider, oi.environment,
    oi.last_four, oi.status, oi.last_used_at, oi.last_error,
    oi.created_by, oi.created_at, oi.updated_at
  FROM public.organization_integrations oi
  WHERE oi.organization_id = p_org_id
  AND oi.organization_id IN (SELECT user_orgs_ids(auth.uid()));
$$;

-- ============================================
-- 4. Table: integration_access_logs
-- ============================================
CREATE TABLE public.integration_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_integration_logs_org ON integration_access_logs(organization_id);
CREATE INDEX idx_integration_logs_created ON integration_access_logs(created_at DESC);

-- RLS
ALTER TABLE integration_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_access_logs FORCE ROW LEVEL SECURITY;

-- Only users who can manage integrations can see logs
CREATE POLICY "integration_logs_select" ON integration_access_logs
  FOR SELECT TO authenticated
  USING (can_manage_org_integrations(auth.uid(), organization_id));

-- ============================================
-- 5. RPC: Upsert integration secret (atomic with lock)
-- ============================================
CREATE OR REPLACE FUNCTION public.upsert_integration_secret(
  p_org_id UUID,
  p_provider TEXT,
  p_environment TEXT,
  p_secret_plain TEXT,
  p_user_id UUID,
  p_last_four TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_old_vault_id UUID;
  v_new_vault_id UUID;
  v_secret_name TEXT;
  v_is_rotation BOOLEAN := false;
BEGIN
  -- Check permission
  IF NOT can_manage_org_integrations(p_user_id, p_org_id) THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  -- Lock to prevent race condition
  PERFORM pg_advisory_xact_lock(hashtext(p_org_id::text || p_provider || p_environment));

  -- Get existing integration (if any)
  SELECT vault_secret_id INTO v_old_vault_id
  FROM organization_integrations
  WHERE organization_id = p_org_id 
    AND provider = p_provider 
    AND environment = p_environment;

  v_is_rotation := v_old_vault_id IS NOT NULL;

  -- 1. CREATE new secret in Vault
  v_secret_name := p_org_id::text || '_' || p_provider || '_' || p_environment || '_' || extract(epoch from now())::bigint;
  
  INSERT INTO vault.secrets (secret, name, description)
  VALUES (p_secret_plain, v_secret_name, p_provider || ' API key for org ' || p_org_id)
  RETURNING id INTO v_new_vault_id;

  -- 2. UPSERT integration pointing to new secret
  INSERT INTO organization_integrations (
    organization_id, provider, environment, vault_secret_id,
    last_four, status, created_by, updated_at
  ) VALUES (
    p_org_id, p_provider, p_environment, v_new_vault_id,
    p_last_four, 'active', p_user_id, now()
  )
  ON CONFLICT (organization_id, provider, environment)
  DO UPDATE SET
    vault_secret_id = v_new_vault_id,
    last_four = p_last_four,
    status = 'active',
    last_error = NULL,
    updated_at = now();

  -- 3. LOG action
  INSERT INTO integration_access_logs (
    organization_id, provider, action, performed_by,
    ip_address, user_agent, success
  ) VALUES (
    p_org_id, p_provider, 
    CASE WHEN v_is_rotation THEN 'rotated' ELSE 'created' END,
    p_user_id, p_ip_address, p_user_agent, true
  );

  -- 4. DELETE old secret (best effort, after success)
  IF v_old_vault_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_old_vault_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action', CASE WHEN v_is_rotation THEN 'rotated' ELSE 'created' END,
    'provider', p_provider
  );

EXCEPTION WHEN OTHERS THEN
  -- Log failure
  INSERT INTO integration_access_logs (
    organization_id, provider, action, performed_by,
    ip_address, user_agent, success, error_message
  ) VALUES (
    p_org_id, p_provider, 'error', p_user_id,
    p_ip_address, p_user_agent, false, SQLERRM
  );
  
  RAISE;
END;
$$;

-- Revoke public access (only via service role)
REVOKE EXECUTE ON FUNCTION public.upsert_integration_secret FROM public, anon, authenticated;

-- ============================================
-- 6. RPC: Delete integration secret (atomic)
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_integration_secret(
  p_org_id UUID,
  p_provider TEXT,
  p_environment TEXT,
  p_user_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_vault_id UUID;
BEGIN
  -- Check permission
  IF NOT can_manage_org_integrations(p_user_id, p_org_id) THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  -- Lock
  PERFORM pg_advisory_xact_lock(hashtext(p_org_id::text || p_provider || p_environment));

  -- Get vault_secret_id
  SELECT vault_secret_id INTO v_vault_id
  FROM organization_integrations
  WHERE organization_id = p_org_id 
    AND provider = p_provider 
    AND environment = p_environment;

  IF v_vault_id IS NULL THEN
    RAISE EXCEPTION 'Integração não encontrada';
  END IF;

  -- Delete integration
  DELETE FROM organization_integrations
  WHERE organization_id = p_org_id 
    AND provider = p_provider 
    AND environment = p_environment;

  -- Delete from Vault
  DELETE FROM vault.secrets WHERE id = v_vault_id;

  -- Log
  INSERT INTO integration_access_logs (
    organization_id, provider, action, performed_by,
    ip_address, user_agent, success
  ) VALUES (
    p_org_id, p_provider, 'deleted', p_user_id,
    p_ip_address, p_user_agent, true
  );

  RETURN jsonb_build_object('success', true, 'provider', p_provider);

EXCEPTION WHEN OTHERS THEN
  INSERT INTO integration_access_logs (
    organization_id, provider, action, performed_by,
    ip_address, user_agent, success, error_message
  ) VALUES (
    p_org_id, p_provider, 'delete_error', p_user_id,
    p_ip_address, p_user_agent, false, SQLERRM
  );
  
  RAISE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_integration_secret FROM public, anon, authenticated;

-- ============================================
-- 7. RPC: Get integration secret for use (with debounce)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_integration_secret_for_use(
  p_org_id UUID,
  p_provider TEXT,
  p_update_last_used BOOLEAN DEFAULT false
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_vault_id UUID;
  v_status TEXT;
  v_secret TEXT;
  v_last_used TIMESTAMPTZ;
BEGIN
  -- Get integration
  SELECT vault_secret_id, status, last_used_at 
  INTO v_vault_id, v_status, v_last_used
  FROM organization_integrations
  WHERE organization_id = p_org_id 
    AND provider = p_provider 
    AND environment = 'production';

  IF v_vault_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_status != 'active' THEN
    RETURN NULL;
  END IF;

  -- Get secret from Vault
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE id = v_vault_id;

  IF v_secret IS NULL THEN
    -- Mark as error
    UPDATE organization_integrations
    SET status = 'error', last_error = 'Secret não encontrado no Vault'
    WHERE organization_id = p_org_id AND provider = p_provider;
    RETURN NULL;
  END IF;

  -- Update last_used_at with debounce (only if requested AND 10 min passed)
  IF p_update_last_used AND (v_last_used IS NULL OR v_last_used < now() - interval '10 minutes') THEN
    UPDATE organization_integrations
    SET last_used_at = now()
    WHERE organization_id = p_org_id AND provider = p_provider;
  END IF;

  RETURN v_secret;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_integration_secret_for_use FROM public, anon, authenticated;