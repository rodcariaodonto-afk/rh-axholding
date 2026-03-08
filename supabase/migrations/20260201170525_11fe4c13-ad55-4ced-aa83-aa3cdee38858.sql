-- Allow authenticated users to insert themselves as organization owners
-- This is needed for the self-service onboarding flow
CREATE POLICY "org_members_insert_owner" ON organization_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_owner = true);

-- Also need to allow authenticated users to create organizations (not just admin/people)
DROP POLICY IF EXISTS "organizations_manage" ON organizations;

CREATE POLICY "organizations_insert_authenticated" ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "organizations_update_members" ON organizations
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'people'::app_role)
    OR EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid() 
      AND (role = 'admin' OR is_owner = true)
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'people'::app_role)
    OR EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid() 
      AND (role = 'admin' OR is_owner = true)
    )
  );

CREATE POLICY "organizations_delete_owner" ON organizations
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid() 
      AND is_owner = true
    )
  );