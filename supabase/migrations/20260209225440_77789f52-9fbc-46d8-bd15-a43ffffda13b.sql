
-- Remove the overly permissive public SELECT policy on organizations
-- Public access is handled safely via get_organization_public() RPC (SECURITY DEFINER)
-- Internal member access is covered by organizations_select policy (is_same_org)
DROP POLICY IF EXISTS "organizations_select_public_basic" ON public.organizations;
