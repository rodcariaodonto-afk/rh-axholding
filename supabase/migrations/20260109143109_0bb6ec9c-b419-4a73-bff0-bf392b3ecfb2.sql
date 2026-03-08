-- Corrigir a view para usar SECURITY INVOKER (padrão seguro)
DROP VIEW IF EXISTS public.organizations_public;

CREATE VIEW public.organizations_public 
WITH (security_invoker = true)
AS
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

-- Permitir acesso público à view
GRANT SELECT ON public.organizations_public TO anon, authenticated;