-- Remove hire_date column from employees table
ALTER TABLE public.employees DROP COLUMN IF EXISTS hire_date;

-- Update handle_new_user trigger to not include hire_date
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Validar domínio @popcode.com.br
  IF NEW.email NOT LIKE '%@popcode.com.br' THEN
    RAISE EXCEPTION 'Apenas emails do domínio @popcode.com.br são permitidos';
  END IF;

  -- Criar employee (sem hire_date)
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
$function$;