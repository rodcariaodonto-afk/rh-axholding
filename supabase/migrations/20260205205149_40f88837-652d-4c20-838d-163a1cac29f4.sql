-- Add INSERT policy for permission_audit_log
-- Allows admins or users with manage_roles permission to insert audit logs
CREATE POLICY "permission_audit_log_insert" ON public.permission_audit_log
FOR INSERT
TO authenticated
WITH CHECK (
  is_same_org(organization_id) 
  AND (
    has_org_permission(auth.uid(), organization_id, 'users.manage_roles') 
    OR has_org_role(auth.uid(), organization_id, 'admin')
    OR has_role(auth.uid(), 'admin')
  )
);