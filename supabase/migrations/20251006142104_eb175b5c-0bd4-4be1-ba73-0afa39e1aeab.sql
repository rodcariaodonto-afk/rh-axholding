-- Criar enum de papéis
CREATE TYPE public.app_role AS ENUM ('admin', 'people', 'user');

-- Criar tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS para profiles: todos podem ver, apenas próprio usuário pode atualizar
CREATE POLICY "Usuários podem ver todos os perfis"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Criar tabela de papéis (SEPARADA por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS para user_roles: apenas visualização
CREATE POLICY "Usuários podem ver seus próprios papéis"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Função para verificar papel (SECURITY DEFINER evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar domínio @popcode.com.br
  IF NEW.email NOT LIKE '%@popcode.com.br' THEN
    RAISE EXCEPTION 'Apenas emails do domínio @popcode.com.br são permitidos';
  END IF;

  -- Criar perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Atualizar RLS policies da tabela devices
DROP POLICY IF EXISTS "Permitir leitura pública de dispositivos" ON public.devices;
DROP POLICY IF EXISTS "Permitir inserção pública de dispositivos" ON public.devices;
DROP POLICY IF EXISTS "Permitir atualização pública de dispositivos" ON public.devices;
DROP POLICY IF EXISTS "Permitir exclusão pública de dispositivos" ON public.devices;

-- Novos policies baseados em papéis
CREATE POLICY "Usuários autenticados podem visualizar dispositivos"
  ON public.devices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin e People podem adicionar dispositivos"
  ON public.devices FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'people')
  );

CREATE POLICY "Admin e People podem atualizar dispositivos"
  ON public.devices FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'people')
  );

CREATE POLICY "Apenas Admin pode excluir dispositivos"
  ON public.devices FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));