-- ADR-0006: DevAdmin Route - Atualizar trigger para aceitar whitelist de devadmins
-- TEMPORARY: Remover quando não for mais necessário (ver docs/adr/0006-devadmin-route.md)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  -- DEVADMIN: Lista de emails que podem fazer login sem ser @popcode.com.br
  -- Para remover esta funcionalidade, limpe este array e remova a rota /devadmin do App.tsx
  -- Documentação: docs/adr/0006-devadmin-route.md
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
    
    -- Devadmins recebem role admin automaticamente
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