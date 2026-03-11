
-- 1. New tables

-- Work Schedules
CREATE TABLE public.work_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'standard' CHECK (type IN ('standard', 'shift', 'flexible', '12x36')),
  hours_per_week NUMERIC(5,2) NOT NULL DEFAULT 44,
  work_days JSONB NOT NULL DEFAULT '["mon","tue","wed","thu","fri"]'::jsonb,
  hours_per_day NUMERIC(5,2) NOT NULL DEFAULT 8,
  late_tolerance_minutes INTEGER NOT NULL DEFAULT 10,
  overtime_rules JSONB DEFAULT NULL,
  hour_bank_rules JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Work Policies
CREATE TABLE public.work_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'presencial' CHECK (type IN ('presencial', 'hybrid', 'remote')),
  description TEXT,
  in_office_days_per_week INTEGER,
  in_office_days_per_month INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Candidates
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Candidate Interactions
CREATE TABLE public.candidate_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Import Logs
CREATE TABLE public.import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  success_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Alter employees table
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS work_schedule_id UUID REFERENCES public.work_schedules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS work_policy_id UUID REFERENCES public.work_policies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS weekly_hours NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS cbo_code TEXT;

-- 3. Alter employees_contact table
ALTER TABLE public.employees_contact
  ADD COLUMN IF NOT EXISTS personal_phone TEXT,
  ADD COLUMN IF NOT EXISTS corporate_phone TEXT,
  ADD COLUMN IF NOT EXISTS corporate_email TEXT;

-- 4. Enable RLS
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Members can view work_schedules" ON public.work_schedules
  FOR SELECT TO authenticated
  USING (is_same_org(organization_id));

CREATE POLICY "People can manage work_schedules" ON public.work_schedules
  FOR ALL TO authenticated
  USING (is_same_org(organization_id))
  WITH CHECK (is_same_org(organization_id));

CREATE POLICY "Members can view work_policies" ON public.work_policies
  FOR SELECT TO authenticated
  USING (is_same_org(organization_id));

CREATE POLICY "People can manage work_policies" ON public.work_policies
  FOR ALL TO authenticated
  USING (is_same_org(organization_id))
  WITH CHECK (is_same_org(organization_id));

CREATE POLICY "Members can view candidates" ON public.candidates
  FOR SELECT TO authenticated
  USING (is_same_org(organization_id));

CREATE POLICY "People can manage candidates" ON public.candidates
  FOR ALL TO authenticated
  USING (is_same_org(organization_id))
  WITH CHECK (is_same_org(organization_id));

CREATE POLICY "Members can view candidate_interactions" ON public.candidate_interactions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.candidates c
    WHERE c.id = candidate_id AND is_same_org(c.organization_id)
  ));

CREATE POLICY "People can manage candidate_interactions" ON public.candidate_interactions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.candidates c
    WHERE c.id = candidate_id AND is_same_org(c.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.candidates c
    WHERE c.id = candidate_id AND is_same_org(c.organization_id)
  ));

CREATE POLICY "Members can view import_logs" ON public.import_logs
  FOR SELECT TO authenticated
  USING (is_same_org(organization_id));

CREATE POLICY "People can manage import_logs" ON public.import_logs
  FOR ALL TO authenticated
  USING (is_same_org(organization_id))
  WITH CHECK (is_same_org(organization_id));

-- 6. Updated_at triggers
CREATE TRIGGER set_updated_at_work_schedules
  BEFORE UPDATE ON public.work_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_work_policies
  BEFORE UPDATE ON public.work_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_candidates
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Update seed_org_roles to include 6 new roles
CREATE OR REPLACE FUNCTION public.seed_org_roles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id uuid;
  v_people_id uuid;
  v_user_id uuid;
  v_manager_id uuid;
  v_coordinator_id uuid;
  v_director_id uuid;
BEGIN
  -- Create the 6 roles (keeping backward compat with admin, people, user)
  INSERT INTO roles (slug, organization_id, name, description, is_system)
  VALUES ('admin', NEW.id, 'Admin', 'Administrador com acesso total', false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_admin_id;

  INSERT INTO roles (slug, organization_id, name, description, is_system)
  VALUES ('people', NEW.id, 'RH', 'Recursos Humanos', false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_people_id;

  INSERT INTO roles (slug, organization_id, name, description, is_system)
  VALUES ('director', NEW.id, 'Gerente', 'Gerente com visão ampla da equipe', false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_director_id;

  INSERT INTO roles (slug, organization_id, name, description, is_system)
  VALUES ('coordinator', NEW.id, 'Coordenador', 'Coordenador de equipe', false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_coordinator_id;

  INSERT INTO roles (slug, organization_id, name, description, is_system)
  VALUES ('manager', NEW.id, 'Gestor', 'Gestor direto de colaboradores', false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_manager_id;

  INSERT INTO roles (slug, organization_id, name, description, is_system)
  VALUES ('user', NEW.id, 'Funcionário', 'Acesso básico de colaborador', false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_user_id;

  -- Admin: ALL permissions
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_admin_id, p.id FROM permissions p
    ON CONFLICT DO NOTHING;
  END IF;

  -- People/RH: all except admin.*
  IF v_people_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_people_id, p.id FROM permissions p
    WHERE p.id NOT IN ('admin.view_costs', 'admin.system_settings', 'users.manage_roles')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Director: broad read + team management
  IF v_director_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_director_id, p.id FROM permissions p
    WHERE p.id IN ('employees.view', 'employees.edit', 'departments.view', 'devices.view', 'time_off.view', 'time_off.manage', 'certificates.view', 'trainings.view', 'trainings.manage', 'jobs.view', 'positions.view', 'feedbacks.view', 'feedbacks.send', 'evaluations.view', 'evaluations.manage', 'pdis.view', 'pdis.manage')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Coordinator: team read + limited management
  IF v_coordinator_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_coordinator_id, p.id FROM permissions p
    WHERE p.id IN ('employees.view', 'departments.view', 'devices.view', 'time_off.view', 'certificates.view', 'trainings.view', 'jobs.view', 'positions.view', 'feedbacks.view', 'feedbacks.send', 'evaluations.view', 'pdis.view', 'pdis.manage')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Manager/Gestor: direct reports
  IF v_manager_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_manager_id, p.id FROM permissions p
    WHERE p.id IN ('employees.view', 'devices.view', 'time_off.view', 'certificates.view', 'trainings.view', 'jobs.view', 'positions.view', 'feedbacks.view', 'feedbacks.send', 'pdis.view', 'pdis.manage')
    ON CONFLICT DO NOTHING;
  END IF;

  -- User/Funcionário: read-only basics
  IF v_user_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_user_id, p.id FROM permissions p
    WHERE p.id IN ('employees.view', 'devices.view', 'time_off.view', 'certificates.view', 'trainings.view', 'jobs.view', 'positions.view')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
