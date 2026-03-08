-- ============================================
-- PoPeople Migration: TRIGGERS + Missing Functions
-- ============================================

-- Função get_organization_public (usada pelo código)
CREATE OR REPLACE FUNCTION public.get_organization_public(_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  logo_url text,
  website text,
  industry text,
  employee_count text,
  headquarters_city text,
  work_policy text,
  work_environment text,
  team_structure text,
  tech_stack text,
  benefits jsonb,
  hiring_process_description text,
  hiring_time text,
  interview_format text,
  linkedin_url text,
  instagram_handle text,
  twitter_handle text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id, name, slug, description, logo_url, website, industry,
    employee_count, headquarters_city, work_policy, work_environment,
    team_structure, tech_stack, benefits, hiring_process_description,
    hiring_time, interview_format, linkedin_url, instagram_handle, twitter_handle
  FROM public.organizations
  WHERE organizations.slug = _slug AND is_active = true
  LIMIT 1
$$;

-- ============================================
-- TRIGGERS: updated_at automático
-- ============================================

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_contact_updated_at
  BEFORE UPDATE ON public.employees_contact
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_contracts_updated_at
  BEFORE UPDATE ON public.employees_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_descriptions_updated_at
  BEFORE UPDATE ON public.job_descriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pdis_updated_at
  BEFORE UPDATE ON public.pdis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pdi_goals_updated_at
  BEFORE UPDATE ON public.pdi_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pdi_comments_updated_at
  BEFORE UPDATE ON public.pdi_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_off_policies_updated_at
  BEFORE UPDATE ON public.time_off_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_off_balances_updated_at
  BEFORE UPDATE ON public.time_off_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_off_requests_updated_at
  BEFORE UPDATE ON public.time_off_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feedbacks_updated_at
  BEFORE UPDATE ON public.feedbacks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_culture_updated_at
  BEFORE UPDATE ON public.company_culture
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_cost_settings_updated_at
  BEFORE UPDATE ON public.company_cost_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TRIGGERS: modified_by automático
-- ============================================

CREATE TRIGGER set_employees_contracts_modified_by
  BEFORE UPDATE ON public.employees_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_modified_by();

CREATE TRIGGER set_company_culture_modified_by
  BEFORE UPDATE ON public.company_culture
  FOR EACH ROW EXECUTE FUNCTION public.set_modified_by();

CREATE TRIGGER set_company_cost_settings_modified_by
  BEFORE UPDATE ON public.company_cost_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_modified_by();

-- ============================================
-- TRIGGERS: PDI automações
-- ============================================

CREATE TRIGGER calculate_goal_completion_trigger
  BEFORE INSERT OR UPDATE OF checklist_items ON public.pdi_goals
  FOR EACH ROW EXECUTE FUNCTION public.calculate_goal_completion();

CREATE TRIGGER calculate_pdi_progress_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pdi_goals
  FOR EACH ROW EXECUTE FUNCTION public.calculate_pdi_progress();

CREATE TRIGGER calculate_pdi_status_trigger
  AFTER INSERT OR UPDATE ON public.pdi_goals
  FOR EACH ROW EXECUTE FUNCTION public.calculate_pdi_status();

CREATE TRIGGER calculate_pdi_engagement_trigger
  AFTER INSERT ON public.pdi_logs
  FOR EACH ROW EXECUTE FUNCTION public.calculate_pdi_engagement();

CREATE TRIGGER log_pdi_comment_created_trigger
  AFTER INSERT ON public.pdi_comments
  FOR EACH ROW EXECUTE FUNCTION public.log_pdi_comment_created();

CREATE TRIGGER check_one_active_pdi_trigger
  BEFORE INSERT OR UPDATE OF status ON public.pdis
  FOR EACH ROW 
  WHEN (NEW.status IN ('em_andamento', 'entregue'))
  EXECUTE FUNCTION public.check_one_active_pdi_per_employee();