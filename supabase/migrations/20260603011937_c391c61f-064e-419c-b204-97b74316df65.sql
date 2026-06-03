
-- 1. Add restrictive RLS policy to time_clock_device_tokens (RLS enabled, no policy)
CREATE POLICY "service_role only - device tokens"
ON public.time_clock_device_tokens
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- 2. Remove broad LIST/SELECT policies on public buckets (files still accessible via public URL)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view company logos" ON storage.objects;

-- 3. Revoke EXECUTE from anon/authenticated on internal SECURITY DEFINER functions
-- Keep public: get_organization_public, ensure_invite_org_member, create_organization_with_owner, has_any_organization
REVOKE EXECUTE ON FUNCTION public.auto_promote_axis_super_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.block_modify_append_only() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_goal_completion() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_pdi_engagement() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_pdi_progress() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_pdi_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_one_active_pdi_per_employee() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limit_log() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_employee_for_org(uuid, uuid, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_first_member_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.insert_audit_log(uuid, text, uuid, text, jsonb, inet, text, boolean) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_pdi_comment_created() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_platform_action(text, uuid, uuid, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.payroll_events_block_if_closed() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_org_defaults() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_org_payroll_rubrics() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_org_roles() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_org_skills() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_modified_by() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tcraw_mark_processed(uuid, time_clock_processing_status, uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_job_application() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(inet, text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_onboarding_by_token(text) FROM authenticated;

-- Revoke from anon for helpers used only in RLS / server context (authenticated may still need some via RLS evaluation - but RLS runs as definer's privileges, so revoking client EXECUTE is safe)
REVOKE EXECUTE ON FUNCTION public.can_manage_critical_integrations(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_manage_org_integrations(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.count_org_admins(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_org_user_permissions(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_organization(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_org_permission(uuid, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_org_role(uuid, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_same_org(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_belongs_to_org(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_has_org_role_slug(uuid, text) FROM anon;
