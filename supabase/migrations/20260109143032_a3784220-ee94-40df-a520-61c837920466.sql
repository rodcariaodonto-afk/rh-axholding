-- 1. Criar view pública com apenas campos necessários para página de vagas
CREATE OR REPLACE VIEW public.organizations_public AS
SELECT 
  id,
  slug,
  name,
  description,
  logo_url,
  industry,
  employee_count,
  website,
  headquarters_city,
  work_policy,
  team_structure,
  work_environment,
  tech_stack,
  interview_format,
  hiring_time,
  hiring_process_description,
  benefits,
  linkedin_url,
  instagram_handle,
  twitter_handle
FROM public.organizations
WHERE is_active = true;

-- 2. Permitir acesso público à view
GRANT SELECT ON public.organizations_public TO anon, authenticated;

-- 3. Remover a política de SELECT público da tabela principal
DROP POLICY IF EXISTS "organizations_select_public" ON public.organizations;

-- 4. Criar nova política para membros da org verem sua organização
CREATE POLICY "organization_members_can_select"
ON public.organizations
FOR SELECT
TO authenticated
USING (id IN (SELECT public.user_orgs_ids(auth.uid())));