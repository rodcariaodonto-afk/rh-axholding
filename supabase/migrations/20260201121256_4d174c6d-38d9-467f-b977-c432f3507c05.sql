-- ============================================
-- PoPeople Migration: FUNCTIONS
-- ============================================

-- has_role - Verifica se usuário tem um papel
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- has_org_role - Verifica papel na organização
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id uuid, _org_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role = _role
  )
$$;

-- user_belongs_to_org - Verifica se pertence à org
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
  )
$$;

-- get_user_organization - Retorna org do usuário
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id
  ORDER BY is_owner DESC, joined_at ASC
  LIMIT 1
$$;

-- update_updated_at_column - Atualiza timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- set_modified_by - Registra quem modificou
CREATE OR REPLACE FUNCTION public.set_modified_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.modified_by := auth.uid();
  RETURN NEW;
END;
$$;

-- handle_new_user - Trigger para novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  devadmin_emails text[] := ARRAY['vitoranfrizio@proton.me'];
BEGIN
  -- Verificar se é um devadmin (bypass domain validation)
  IF NEW.email = ANY(devadmin_emails) THEN
    INSERT INTO public.employees (id, email, full_name, status, employment_type)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      'active',
      'full_time'
    );
    
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    RETURN NEW;
  END IF;

  -- Validar domínio @popcode.com.br (para usuários normais)
  IF NEW.email NOT LIKE '%@popcode.com.br' THEN
    RAISE EXCEPTION 'Apenas emails do domínio @popcode.com.br são permitidos';
  END IF;

  -- Criar employee
  INSERT INTO public.employees (id, email, full_name, status, employment_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'active',
    'full_time'
  );

  -- Atribuir papel baseado no email
  IF NEW.email = 'hugo@popcode.com.br' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSIF NEW.email IN ('brenda.mendes@popcode.com.br', 'dayse.quirino@popcode.com.br', 'people@popcode.com.br') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'people');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;

-- calculate_goal_completion - Calcula progresso da meta
CREATE OR REPLACE FUNCTION public.calculate_goal_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_items INT;
  completed_items INT;
  new_ratio NUMERIC(5,2);
  new_status public.pdi_goal_status;
BEGIN
  total_items := jsonb_array_length(NEW.checklist_items);
  
  IF total_items > 0 THEN
    SELECT COUNT(*)
    INTO completed_items
    FROM jsonb_array_elements(NEW.checklist_items) AS item
    WHERE (item->>'completed')::boolean = true;
    
    new_ratio := (completed_items::numeric / total_items::numeric) * 100;
  ELSE
    new_ratio := 0;
  END IF;
  
  IF new_ratio = 0 THEN
    new_status := 'pendente';
  ELSIF new_ratio = 100 THEN
    new_status := 'concluida';
  ELSE
    new_status := 'em_andamento';
  END IF;
  
  NEW.completion_ratio := new_ratio;
  NEW.status := new_status;
  
  RETURN NEW;
END;
$$;

-- calculate_pdi_progress - Calcula progresso do PDI
CREATE OR REPLACE FUNCTION public.calculate_pdi_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  weighted_progress NUMERIC(5,2);
BEGIN
  SELECT 
    CASE 
      WHEN SUM(weight) > 0 THEN 
        SUM(completion_ratio * weight) / SUM(weight)
      ELSE 0
    END
  INTO weighted_progress
  FROM pdi_goals
  WHERE pdi_id = COALESCE(NEW.pdi_id, OLD.pdi_id);
  
  UPDATE pdis
  SET progress = COALESCE(weighted_progress, 0)
  WHERE id = COALESCE(NEW.pdi_id, OLD.pdi_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- calculate_pdi_status - Calcula status do PDI
CREATE OR REPLACE FUNCTION public.calculate_pdi_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pdi_record pdis%ROWTYPE;
  total_goals INT;
  completed_goals INT;
  today DATE := CURRENT_DATE;
  new_status public.pdi_status;
BEGIN
  SELECT * INTO pdi_record
  FROM pdis
  WHERE id = COALESCE(NEW.pdi_id, OLD.pdi_id);
  
  IF pdi_record.finalized_at IS NOT NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'concluida')
  INTO total_goals, completed_goals
  FROM pdi_goals
  WHERE pdi_id = pdi_record.id;
  
  IF total_goals = 0 THEN
    new_status := 'rascunho';
  ELSIF completed_goals = total_goals AND today <= pdi_record.due_date THEN
    new_status := 'entregue';
  ELSIF completed_goals < total_goals AND today <= pdi_record.due_date THEN
    new_status := 'em_andamento';
  ELSE
    new_status := 'em_andamento';
  END IF;
  
  UPDATE pdis
  SET status = new_status
  WHERE id = pdi_record.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- calculate_pdi_engagement - Calcula engajamento
CREATE OR REPLACE FUNCTION public.calculate_pdi_engagement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pdi_record pdis%ROWTYPE;
  days_active INT;
  log_count INT;
  engagement NUMERIC(3,2);
BEGIN
  SELECT * INTO pdi_record
  FROM pdis
  WHERE id = NEW.pdi_id;
  
  days_active := EXTRACT(DAY FROM (now() - pdi_record.created_at));
  IF days_active < 1 THEN
    days_active := 1;
  END IF;
  
  SELECT COUNT(*)
  INTO log_count
  FROM pdi_logs
  WHERE pdi_id = NEW.pdi_id
  AND event_type NOT IN ('exported', 'emailed');
  
  engagement := LEAST(1.0, log_count::numeric / (days_active * 2.0));
  
  UPDATE pdis
  SET engagement_score = engagement
  WHERE id = NEW.pdi_id;
  
  RETURN NEW;
END;
$$;

-- check_one_active_pdi_per_employee - Validação
CREATE OR REPLACE FUNCTION public.check_one_active_pdi_per_employee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_count INT;
BEGIN
  SELECT COUNT(*)
  INTO active_count
  FROM pdis
  WHERE employee_id = NEW.employee_id
  AND status IN ('em_andamento', 'entregue')
  AND finalized_at IS NULL
  AND id != NEW.id;
  
  IF active_count > 0 THEN
    RAISE EXCEPTION 'Colaborador já possui um PDI ativo. Finalize ou cancele o PDI anterior antes de criar um novo.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- log_pdi_comment_created - Log de comentário
CREATE OR REPLACE FUNCTION public.log_pdi_comment_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO pdi_logs (pdi_id, logged_by, event_type, description)
  VALUES (
    NEW.pdi_id,
    NEW.user_id,
    'comment_added',
    'Comentário adicionado'
  );
  RETURN NEW;
END;
$$;

-- insert_audit_log - Função para inserir audit
CREATE OR REPLACE FUNCTION public.insert_audit_log(
  p_user_id uuid,
  p_resource_type text,
  p_resource_id uuid,
  p_action text,
  p_changes jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_is_sensitive boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.audit_log (
    user_id,
    resource_type,
    resource_id,
    action,
    changes,
    ip_address,
    user_agent,
    is_sensitive
  ) VALUES (
    p_user_id,
    p_resource_type,
    p_resource_id,
    p_action,
    p_changes,
    p_ip_address,
    p_user_agent,
    p_is_sensitive
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;