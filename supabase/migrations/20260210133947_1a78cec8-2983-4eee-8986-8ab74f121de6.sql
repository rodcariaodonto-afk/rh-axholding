
-- Fix handle_new_user trigger to properly handle FK dependencies
-- when swapping employee IDs for invited users
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  pending RECORD;
  local_role_id UUID;
  existing_employee_id UUID;
BEGIN
  -- Buscar pending_employee pelo email (inclui 'draft' como fallback de segurança)
  SELECT * INTO pending
  FROM public.pending_employees
  WHERE email = NEW.email
    AND status IN ('draft', 'invited', 'accepted')
  ORDER BY created_at DESC
  LIMIT 1;

  IF pending IS NOT NULL THEN
    -- Verificar se já existe employee com status pending (criado no convite)
    SELECT id INTO existing_employee_id
    FROM public.employees
    WHERE email = NEW.email
      AND organization_id = pending.organization_id
      AND status = 'pending'
    LIMIT 1;

    IF existing_employee_id IS NOT NULL THEN
      -- Atualizar todas as tabelas que referenciam o employee ID antigo
      UPDATE public.employees_contracts SET user_id = NEW.id WHERE user_id = existing_employee_id;
      UPDATE public.employees_contact SET user_id = NEW.id WHERE user_id = existing_employee_id;
      UPDATE public.employees_demographics SET user_id = NEW.id WHERE user_id = existing_employee_id;
      UPDATE public.employees_legal_docs SET user_id = NEW.id WHERE user_id = existing_employee_id;
      
      -- Agora atualizar o employee: trocar ID para o auth.uid e ativar
      UPDATE public.employees
      SET id = NEW.id,
          status = 'active',
          updated_at = now()
      WHERE id = existing_employee_id;
    ELSE
      -- Criar employee com dados do pending (fluxo legado)
      INSERT INTO public.employees (
        id, email, full_name, organization_id,
        department_id, manager_id, base_position_id,
        position_level_detail, unit_id, employment_type, status
      ) VALUES (
        NEW.id, NEW.email, pending.full_name, pending.organization_id,
        pending.department_id, pending.manager_id, pending.base_position_id,
        pending.position_level_detail, pending.unit_id,
        COALESCE(pending.employment_type, 'full_time'), 'active'
      );
    END IF;

    -- Criar contrato se tiver dados e não existir
    IF pending.hire_date IS NOT NULL THEN
      INSERT INTO public.employees_contracts (
        user_id, contract_type, hire_date, base_salary
      ) 
      SELECT NEW.id, COALESCE(pending.contract_type, 'clt'),
             pending.hire_date, COALESCE(pending.base_salary, 0)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.employees_contracts WHERE user_id = NEW.id AND is_active = true
      );
    END IF;

    -- Buscar role 'user' LOCAL da organização
    SELECT id INTO local_role_id
    FROM public.roles 
    WHERE slug = 'user' 
      AND organization_id = pending.organization_id
    LIMIT 1;

    -- Criar organization_member se não existir
    INSERT INTO public.organization_members (
      user_id, organization_id, role_id, invited_by
    ) 
    SELECT NEW.id, pending.organization_id, local_role_id, pending.invited_by
    WHERE NOT EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE user_id = NEW.id AND organization_id = pending.organization_id
    );

    -- Marcar pending como aceito
    UPDATE public.pending_employees 
    SET status = 'accepted', updated_at = now()
    WHERE id = pending.id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix existing broken data for Dayse
-- Update contract to point to the auth user ID
UPDATE employees_contracts SET user_id = '14cdde9e-9e59-4df6-adbc-78d302690b71' WHERE user_id = 'b9664782-b42f-4479-b1b4-06e44bd9e7f3';

-- Update employee ID to match auth user ID and activate
UPDATE employees SET id = '14cdde9e-9e59-4df6-adbc-78d302690b71', status = 'active' WHERE id = 'b9664782-b42f-4479-b1b4-06e44bd9e7f3';

-- Create organization_members for Dayse
INSERT INTO organization_members (user_id, organization_id, role_id, invited_by)
SELECT '14cdde9e-9e59-4df6-adbc-78d302690b71', 'adc1ed42-fba5-4041-b862-b7bc27978ea0', r.id, NULL
FROM roles r
WHERE r.slug = 'user' AND r.organization_id = 'adc1ed42-fba5-4041-b862-b7bc27978ea0'
ON CONFLICT DO NOTHING;

-- Mark pending as accepted
UPDATE pending_employees SET status = 'accepted' WHERE email = 'dayse.quirino@popcode.com.br';
