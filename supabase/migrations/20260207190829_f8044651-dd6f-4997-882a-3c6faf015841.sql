
-- ============================================
-- SEC-A1 & SEC-A2: Views Públicas Limitadas
-- ============================================

-- 1. View pública para Organizations (apenas campos de marketing)
CREATE OR REPLACE VIEW public.organizations_public
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  slug,
  description,
  logo_url,
  website,
  industry,
  employee_count,
  headquarters_city,
  work_policy,
  work_environment,
  hiring_process_description,
  hiring_time,
  interview_format,
  linkedin_url,
  instagram_handle,
  twitter_handle,
  benefits,
  is_active
FROM public.organizations
WHERE is_active = true;

-- 2. View pública para Jobs (apenas campos de marketing para candidatos)
CREATE OR REPLACE VIEW public.jobs_public
WITH (security_invoker = on) AS
SELECT 
  j.id,
  j.title,
  j.description,
  j.requirements,
  j.work_model,
  j.contract_type,
  j.seniority,
  j.openings_count,
  j.required_skills,
  j.desired_skills,
  j.experience_years,
  j.education_level,
  j.languages,
  j.benefits,
  j.application_deadline,
  j.expected_start_date,
  j.require_cover_letter,
  j.tags,
  j.created_at,
  j.organization_id,
  -- Salary visibility controlada
  CASE 
    WHEN j.salary_type = 'range' THEN j.salary_type
    WHEN j.salary_type = 'fixed' THEN j.salary_type
    ELSE 'not_disclosed'
  END AS salary_type,
  CASE WHEN j.salary_type != 'not_disclosed' THEN j.salary_min ELSE NULL END AS salary_min,
  CASE WHEN j.salary_type != 'not_disclosed' THEN j.salary_max ELSE NULL END AS salary_max,
  -- Joined data for display
  u.name AS unit_name,
  u.city AS unit_city,
  u.state AS unit_state
FROM public.jobs j
LEFT JOIN public.units u ON j.unit_id = u.id
WHERE j.status = 'active';

-- 3. Atualizar policy de organizations para restringir dados sensíveis
-- Primeiro, remover a policy pública atual
DROP POLICY IF EXISTS "organizations_select_public" ON public.organizations;

-- Criar nova policy: dados completos apenas para membros da org
CREATE POLICY "organizations_select_member" 
ON public.organizations 
FOR SELECT 
USING (
  -- Membros da org veem tudo
  is_same_org(id)
  OR
  -- Admins globais veem tudo
  has_role(auth.uid(), 'admin')
);

-- Policy para dados públicos via slug (para páginas de carreiras)
-- Isso permite que a view organizations_public funcione
CREATE POLICY "organizations_select_public_basic" 
ON public.organizations 
FOR SELECT 
USING (is_active = true);

-- 4. Atualizar policy de jobs para restringir dados internos
DROP POLICY IF EXISTS "jobs_select" ON public.jobs;

-- Membros da org veem tudo (incluindo drafts)
CREATE POLICY "jobs_select_member" 
ON public.jobs 
FOR SELECT 
USING (is_same_org(organization_id));

-- Público vê apenas vagas ativas (mas via view que filtra campos)
CREATE POLICY "jobs_select_active_public" 
ON public.jobs 
FOR SELECT 
USING (status = 'active');

-- 5. Adicionar grants para as views
GRANT SELECT ON public.organizations_public TO anon;
GRANT SELECT ON public.organizations_public TO authenticated;
GRANT SELECT ON public.jobs_public TO anon;
GRANT SELECT ON public.jobs_public TO authenticated;

-- 6. Comentários de documentação
COMMENT ON VIEW public.organizations_public IS 'View pública para páginas de carreiras. Exclui: team_structure, tech_stack, settings, max_employees, plan_type, allowed_domains';
COMMENT ON VIEW public.jobs_public IS 'View pública para candidatos. Exclui: department_id, position_id, urgency, description_tone, description_context, created_by, closed_at';
