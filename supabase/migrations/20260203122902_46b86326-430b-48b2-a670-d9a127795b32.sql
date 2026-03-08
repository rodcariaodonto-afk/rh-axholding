-- =========================================================
-- PARTE 1: Tabela pending_employees
-- Armazena colaboradores pré-cadastrados aguardando aceite
-- =========================================================

CREATE TABLE public.pending_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Identificador único (usado para reconciliação)
  email TEXT NOT NULL,
  
  -- Dados básicos
  full_name TEXT NOT NULL,
  
  -- Dados organizacionais (pré-preenchidos pelo RH)
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  base_position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  position_level_detail position_level_detail,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  employment_type employment_type DEFAULT 'full_time',
  
  -- Dados contratuais (opcionais no convite)
  contract_type contract_type,
  hire_date DATE,
  base_salary NUMERIC(12,2),
  
  -- Metadados
  invited_by UUID NOT NULL,
  invite_sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'invited', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique por organização+email para evitar duplicatas
  UNIQUE(organization_id, email)
);

-- Comentário na tabela
COMMENT ON TABLE public.pending_employees IS 'Colaboradores pré-cadastrados pelo RH aguardando aceite do convite';

-- Índices para reconciliação e busca
CREATE INDEX idx_pending_employees_email ON pending_employees(email);
CREATE INDEX idx_pending_employees_status ON pending_employees(status);
CREATE INDEX idx_pending_employees_org_status ON pending_employees(organization_id, status);

-- =========================================================
-- PARTE 2: RLS para pending_employees
-- =========================================================

ALTER TABLE pending_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_employees FORCE ROW LEVEL SECURITY;

-- Política para admin/people gerenciarem convites da sua org
CREATE POLICY "pending_emp_manage" ON pending_employees
  FOR ALL 
  TO authenticated
  USING (
    is_same_org(organization_id) 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'people'::app_role))
  )
  WITH CHECK (
    is_same_org(organization_id) 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'people'::app_role))
  );

-- Trigger para updated_at
CREATE TRIGGER update_pending_employees_updated_at
  BEFORE UPDATE ON pending_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- PARTE 3: Atualizar handle_new_user com reconciliação
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first_user BOOLEAN;
  pending RECORD;
BEGIN
  -- Verificar se é o primeiro usuário do sistema
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) INTO is_first_user;

  -- Atribuir role global
  IF is_first_user THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  -- RECONCILIAÇÃO: Buscar pending_employee pelo email
  SELECT * INTO pending
  FROM public.pending_employees
  WHERE email = NEW.email
    AND status = 'invited'
  ORDER BY created_at DESC
  LIMIT 1;

  IF pending IS NOT NULL THEN
    -- Criar employee com dados do pending usando auth.users.id
    INSERT INTO public.employees (
      id, 
      email, 
      full_name, 
      organization_id,
      department_id, 
      manager_id, 
      base_position_id,
      position_level_detail, 
      unit_id, 
      employment_type,
      status
    ) VALUES (
      NEW.id, -- auth.users.id como ID do employee
      NEW.email,
      pending.full_name,
      pending.organization_id,
      pending.department_id,
      pending.manager_id,
      pending.base_position_id,
      pending.position_level_detail,
      pending.unit_id,
      COALESCE(pending.employment_type, 'full_time'),
      'active'
    );

    -- Criar contrato se tiver dados mínimos
    IF pending.hire_date IS NOT NULL THEN
      INSERT INTO public.employees_contracts (
        user_id, 
        contract_type, 
        hire_date, 
        base_salary
      ) VALUES (
        NEW.id,
        COALESCE(pending.contract_type, 'clt'),
        pending.hire_date,
        COALESCE(pending.base_salary, 0)
      );
    END IF;

    -- Criar organization_member
    INSERT INTO public.organization_members (
      user_id, 
      organization_id, 
      role, 
      invited_by
    ) VALUES (
      NEW.id,
      pending.organization_id,
      'user',
      pending.invited_by
    );

    -- Marcar pending como aceito (não deletar para auditoria)
    UPDATE public.pending_employees 
    SET status = 'accepted', updated_at = now()
    WHERE id = pending.id;
  END IF;

  RETURN NEW;
END;
$$;