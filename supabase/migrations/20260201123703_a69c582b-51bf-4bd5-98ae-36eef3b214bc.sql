-- Atualizar trigger handle_new_user para aceitar qualquer domínio
-- e atribuir role 'user' para todos os novos usuários

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Criar employee para o novo usuário (sem restrição de domínio)
  INSERT INTO public.employees (id, email, full_name, status, employment_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'active',
    'full_time'
  );

  -- Todos os novos usuários começam como 'user'
  -- Promoção para admin/people é feita manualmente
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;