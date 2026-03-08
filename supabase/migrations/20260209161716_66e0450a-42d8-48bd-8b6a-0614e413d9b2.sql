
-- Fix can_manage_critical_integrations: replace has_role() with org-scoped check
CREATE OR REPLACE FUNCTION public.can_manage_critical_integrations(p_user_id uuid, p_org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT has_org_role(p_user_id, p_org_id, 'admin')
  OR EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = p_user_id
      AND organization_id = p_org_id
      AND is_owner = true
  )
$function$;

-- Fix can_manage_org_integrations: replace has_role() with org-scoped check
CREATE OR REPLACE FUNCTION public.can_manage_org_integrations(p_user_id uuid, p_org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT has_org_role(p_user_id, p_org_id, 'admin')
  OR EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = p_user_id
      AND organization_id = p_org_id
      AND is_owner = true
  )
$function$;
