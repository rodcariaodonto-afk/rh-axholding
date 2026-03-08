-- Add security improvements to organization_integrations table

-- 1. Add sensitivity level for role-based access control
ALTER TABLE organization_integrations 
ADD COLUMN IF NOT EXISTS sensitivity TEXT DEFAULT 'standard' 
  CHECK (sensitivity IN ('standard', 'high', 'critical'));

-- 2. Add last_rotated_at for key rotation tracking
ALTER TABLE organization_integrations 
ADD COLUMN IF NOT EXISTS last_rotated_at TIMESTAMPTZ;

-- 3. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_org_integrations_provider_env 
ON organization_integrations(organization_id, provider, environment);

-- 4. Create enhanced RLS policy for critical integrations (only admins)
DROP POLICY IF EXISTS "integrations_manage" ON organization_integrations;

-- Standard policy: admin/people can manage standard and high sensitivity
CREATE POLICY "integrations_manage_standard" ON organization_integrations
  FOR ALL USING (
    can_manage_org_integrations(auth.uid(), organization_id)
    AND sensitivity IN ('standard', 'high')
  )
  WITH CHECK (
    can_manage_org_integrations(auth.uid(), organization_id)
    AND sensitivity IN ('standard', 'high')
  );

-- Critical policy: only global admins or org owners
CREATE POLICY "integrations_manage_critical" ON organization_integrations
  FOR ALL USING (
    sensitivity = 'critical'
    AND (
      has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = organization_integrations.organization_id
        AND user_id = auth.uid()
        AND is_owner = true
      )
    )
  )
  WITH CHECK (
    sensitivity = 'critical'
    AND (
      has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = organization_integrations.organization_id
        AND user_id = auth.uid()
        AND is_owner = true
      )
    )
  );

-- 5. Add action type for decryption events in logs
ALTER TABLE integration_access_logs 
ALTER COLUMN action TYPE TEXT;

COMMENT ON COLUMN integration_access_logs.action IS 'Actions: created, rotated, tested, deleted, key_decrypted, key_accessed';

-- 6. Create function to check if user can manage critical integrations
CREATE OR REPLACE FUNCTION public.can_manage_critical_integrations(p_user_id uuid, p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(p_user_id, 'admin')
  OR EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = p_user_id
      AND organization_id = p_org_id
      AND is_owner = true
  )
$$;