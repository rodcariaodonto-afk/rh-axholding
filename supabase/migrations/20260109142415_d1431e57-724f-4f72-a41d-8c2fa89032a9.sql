-- Corrigir recursão infinita nas políticas de organization_members

-- Remover as políticas problemáticas
DROP POLICY IF EXISTS "organization_members_select_same_org" ON public.organization_members;

-- Recriar a política usando uma função SECURITY DEFINER para evitar recursão
CREATE OR REPLACE FUNCTION public.user_orgs_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id
$$;

-- Criar nova política que usa a função ao invés de subconsulta direta
CREATE POLICY "organization_members_select_same_org"
ON public.organization_members
FOR SELECT
TO authenticated
USING (organization_id IN (SELECT public.user_orgs_ids(auth.uid())));