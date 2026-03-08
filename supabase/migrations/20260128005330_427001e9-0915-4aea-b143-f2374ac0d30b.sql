-- Fase 1: Migração para criptografia AES-GCM nativa

-- 1. Adicionar novas colunas
ALTER TABLE organization_integrations
  ADD COLUMN IF NOT EXISTS encrypted_api_key TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_test_success BOOLEAN;

-- 2. Permitir vault_secret_id nulo (transição)
ALTER TABLE organization_integrations
  ALTER COLUMN vault_secret_id DROP NOT NULL;

-- 3. Índice para buscas otimizadas
CREATE INDEX IF NOT EXISTS idx_org_integrations_active 
  ON organization_integrations(organization_id, provider) 
  WHERE is_active = true;

-- 4. Habilitar e forçar RLS
ALTER TABLE organization_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_integrations FORCE ROW LEVEL SECURITY;

-- 5. Policy: Membros podem ver integrações da própria org
CREATE POLICY "org_integrations_select"
  ON organization_integrations FOR SELECT
  USING (organization_id IN (SELECT user_orgs_ids(auth.uid())));

-- 6. Policy: Apenas admins podem gerenciar (INSERT, UPDATE, DELETE)
CREATE POLICY "org_integrations_manage"
  ON organization_integrations FOR ALL
  USING (can_manage_org_integrations(auth.uid(), organization_id))
  WITH CHECK (can_manage_org_integrations(auth.uid(), organization_id));