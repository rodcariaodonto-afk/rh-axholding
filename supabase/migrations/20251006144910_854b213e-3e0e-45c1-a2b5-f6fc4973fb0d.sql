-- Atualizar policy de SELECT na tabela profiles
-- Agora apenas admin, people ou o próprio usuário podem ver o perfil
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;

CREATE POLICY "Usuários podem ver próprio perfil, admin e people veem todos"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'people'::app_role)
);