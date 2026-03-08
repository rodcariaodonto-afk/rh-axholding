-- Corrigir: Remover policy que expõe user_roles para anônimos
-- A função has_role() já é SECURITY DEFINER, então o acesso direto não é necessário

DROP POLICY IF EXISTS "anon_check_exists" ON public.user_roles;