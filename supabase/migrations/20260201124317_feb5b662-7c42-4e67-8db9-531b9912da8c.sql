-- Atualizar função handle_new_user para detectar primeiro usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Verificar se é o primeiro usuário do sistema
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) INTO is_first_user;

  -- Criar employee para o novo usuário
  INSERT INTO public.employees (id, email, full_name, status, employment_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'active',
    'full_time'
  );

  -- Primeiro usuário = admin, demais = user
  IF is_first_user THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;

-- Permitir SELECT anônimo para verificar existência de usuários
CREATE POLICY "anon_check_exists" ON public.user_roles
  FOR SELECT TO anon
  USING (true);