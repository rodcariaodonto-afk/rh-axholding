-- ============================================
-- Tabela organization_integrations (Vault de API Keys)
-- ============================================

CREATE TABLE organization_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  encrypted_api_key TEXT NOT NULL,
  display_name TEXT,
  last_four TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  last_tested_at TIMESTAMPTZ,
  last_test_success BOOLEAN,
  last_error TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, provider, environment)
);

-- Índices para performance
CREATE INDEX idx_org_integrations_org ON organization_integrations(organization_id);
CREATE INDEX idx_org_integrations_provider ON organization_integrations(provider);

-- ============================================
-- Tabela integration_access_logs (Auditoria)
-- ============================================

CREATE TABLE integration_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  action TEXT NOT NULL,
  performed_by UUID,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_access_logs_org ON integration_access_logs(organization_id);
CREATE INDEX idx_access_logs_provider ON integration_access_logs(provider);

-- ============================================
-- Função de Permissão
-- ============================================

CREATE OR REPLACE FUNCTION can_manage_org_integrations(p_user_id UUID, p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = p_user_id
      AND organization_id = p_org_id
      AND (role = 'admin' OR is_owner = true)
  )
  OR has_role(p_user_id, 'admin')
$$;

-- ============================================
-- Políticas RLS - organization_integrations
-- ============================================

ALTER TABLE organization_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_integrations FORCE ROW LEVEL SECURITY;

CREATE POLICY "integrations_manage" ON organization_integrations
FOR ALL USING (can_manage_org_integrations(auth.uid(), organization_id))
WITH CHECK (can_manage_org_integrations(auth.uid(), organization_id));

-- ============================================
-- Políticas RLS - integration_access_logs
-- ============================================

ALTER TABLE integration_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_access_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY "access_logs_select" ON integration_access_logs
FOR SELECT USING (can_manage_org_integrations(auth.uid(), organization_id));

CREATE POLICY "access_logs_insert" ON integration_access_logs
FOR INSERT WITH CHECK (can_manage_org_integrations(auth.uid(), organization_id));

-- ============================================
-- Trigger para updated_at
-- ============================================

CREATE TRIGGER update_organization_integrations_updated_at
BEFORE UPDATE ON organization_integrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();