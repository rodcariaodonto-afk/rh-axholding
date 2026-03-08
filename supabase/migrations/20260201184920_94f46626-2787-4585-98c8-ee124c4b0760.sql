-- ============================================
-- FASE 1: MULTI-TENANCY SCHEMA + TRIGGERS
-- ============================================

-- 1. employees
ALTER TABLE public.employees 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_employees_organization ON public.employees(organization_id);

-- 2. departments
ALTER TABLE public.departments 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_departments_organization ON public.departments(organization_id);

-- 3. positions
ALTER TABLE public.positions 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_positions_organization ON public.positions(organization_id);

-- 4. jobs
ALTER TABLE public.jobs 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_jobs_organization ON public.jobs(organization_id);

-- 5. units
ALTER TABLE public.units 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_units_organization ON public.units(organization_id);

-- 6. devices
ALTER TABLE public.devices 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_devices_organization ON public.devices(organization_id);

-- 7. time_off_policies
ALTER TABLE public.time_off_policies 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_time_off_policies_organization ON public.time_off_policies(organization_id);

-- 8. company_culture
ALTER TABLE public.company_culture 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_company_culture_organization ON public.company_culture(organization_id);

-- 9. company_cost_settings
ALTER TABLE public.company_cost_settings 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_company_cost_settings_organization ON public.company_cost_settings(organization_id);

-- 10. job_descriptions
ALTER TABLE public.job_descriptions 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_job_descriptions_organization ON public.job_descriptions(organization_id);

-- ============================================
-- FUNÇÕES HELPER
-- ============================================

-- is_same_org: Verifica se org é a mesma do usuário logado
CREATE OR REPLACE FUNCTION public.is_same_org(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _org_id = get_user_organization(auth.uid())
$$;

-- create_employee_for_org: Cria employee vinculado a uma org
CREATE OR REPLACE FUNCTION public.create_employee_for_org(
  _user_id UUID,
  _org_id UUID,
  _email TEXT,
  _full_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _employee_id UUID;
BEGIN
  -- Verificar se employee já existe para este user/org
  SELECT id INTO _employee_id 
  FROM public.employees 
  WHERE id = _user_id AND organization_id = _org_id;
  
  IF _employee_id IS NOT NULL THEN
    RETURN _employee_id;
  END IF;

  -- Criar employee
  INSERT INTO public.employees (
    id, 
    email, 
    full_name, 
    organization_id,
    status, 
    employment_type
  ) VALUES (
    _user_id,
    _email,
    COALESCE(_full_name, split_part(_email, '@', 1)),
    _org_id,
    'active',
    'full_time'
  )
  RETURNING id INTO _employee_id;

  RETURN _employee_id;
END;
$$;

-- ============================================
-- ATUALIZAR handle_new_user
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Verificar se é o primeiro usuário do sistema
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) INTO is_first_user;

  -- NÃO criar employee aqui - será criado no onboarding/convite
  -- Apenas atribuir role global
  IF is_first_user THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;