-- ============================================
-- PoPeople Database Migration
-- 04 - TRIGGERS
-- ============================================
-- Execute após 03-functions.sql
-- ============================================

-- ============================================
-- TRIGGER: Novo usuário (auth.users)
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGERS: updated_at automático
-- ============================================

-- organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- units
CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- positions
CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- employees
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- departments
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- employees_contact
CREATE TRIGGER update_employees_contact_updated_at
  BEFORE UPDATE ON public.employees_contact
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- employees_contracts
CREATE TRIGGER update_employees_contracts_updated_at
  BEFORE UPDATE ON public.employees_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- devices
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- jobs
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- job_applications
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- job_descriptions
CREATE TRIGGER update_job_descriptions_updated_at
  BEFORE UPDATE ON public.job_descriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- pdis
CREATE TRIGGER update_pdis_updated_at
  BEFORE UPDATE ON public.pdis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- pdi_goals
CREATE TRIGGER update_pdi_goals_updated_at
  BEFORE UPDATE ON public.pdi_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- pdi_comments
CREATE TRIGGER update_pdi_comments_updated_at
  BEFORE UPDATE ON public.pdi_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- time_off_policies
CREATE TRIGGER update_time_off_policies_updated_at
  BEFORE UPDATE ON public.time_off_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- time_off_balances
CREATE TRIGGER update_time_off_balances_updated_at
  BEFORE UPDATE ON public.time_off_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- time_off_requests
CREATE TRIGGER update_time_off_requests_updated_at
  BEFORE UPDATE ON public.time_off_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- feedbacks
CREATE TRIGGER update_feedbacks_updated_at
  BEFORE UPDATE ON public.feedbacks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- company_culture
CREATE TRIGGER update_company_culture_updated_at
  BEFORE UPDATE ON public.company_culture
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- company_cost_settings
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

-- Calcular completion ao atualizar checklist
CREATE TRIGGER calculate_goal_completion_trigger
  BEFORE INSERT OR UPDATE OF checklist_items ON public.pdi_goals
  FOR EACH ROW EXECUTE FUNCTION public.calculate_goal_completion();

-- Recalcular progresso do PDI
CREATE TRIGGER calculate_pdi_progress_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pdi_goals
  FOR EACH ROW EXECUTE FUNCTION public.calculate_pdi_progress();

-- Recalcular status do PDI
CREATE TRIGGER calculate_pdi_status_trigger
  AFTER INSERT OR UPDATE ON public.pdi_goals
  FOR EACH ROW EXECUTE FUNCTION public.calculate_pdi_status();

-- Calcular engajamento
CREATE TRIGGER calculate_pdi_engagement_trigger
  AFTER INSERT ON public.pdi_logs
  FOR EACH ROW EXECUTE FUNCTION public.calculate_pdi_engagement();

-- Log de comentário
CREATE TRIGGER log_pdi_comment_created_trigger
  AFTER INSERT ON public.pdi_comments
  FOR EACH ROW EXECUTE FUNCTION public.log_pdi_comment_created();

-- Validar um PDI ativo por colaborador
CREATE TRIGGER check_one_active_pdi_trigger
  BEFORE INSERT OR UPDATE OF status ON public.pdis
  FOR EACH ROW 
  WHEN (NEW.status IN ('em_andamento', 'entregue'))
  EXECUTE FUNCTION public.check_one_active_pdi_per_employee();

-- ============================================
-- FIM DOS TRIGGERS
-- ============================================
