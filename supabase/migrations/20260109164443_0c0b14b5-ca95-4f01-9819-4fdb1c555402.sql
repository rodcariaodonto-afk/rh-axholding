-- Remover a view (não funciona bem com RLS para acesso anônimo)
DROP VIEW IF EXISTS public.organizations_public;

-- Criar função SECURITY DEFINER para retornar dados públicos de organizações
CREATE OR REPLACE FUNCTION public.get_organization_public(org_slug text)
RETURNS TABLE (
  id uuid,
  slug text,
  name text,
  description text,
  logo_url text,
  industry text,
  employee_count text,
  website text,
  headquarters_city text,
  work_policy text,
  team_structure text,
  work_environment text,
  tech_stack text,
  interview_format text,
  hiring_time text,
  hiring_process_description text,
  benefits jsonb,
  linkedin_url text,
  instagram_handle text,
  twitter_handle text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.slug,
    o.name,
    o.description,
    o.logo_url,
    o.industry,
    o.employee_count,
    o.website,
    o.headquarters_city,
    o.work_policy,
    o.team_structure,
    o.work_environment,
    o.tech_stack,
    o.interview_format,
    o.hiring_time,
    o.hiring_process_description,
    o.benefits,
    o.linkedin_url,
    o.instagram_handle,
    o.twitter_handle
  FROM public.organizations o
  WHERE o.slug = org_slug
    AND o.is_active = true
$$;