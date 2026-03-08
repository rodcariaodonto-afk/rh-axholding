
-- =============================================
-- 1. Policies for organization_locations (new table)
-- =============================================
ALTER TABLE IF EXISTS public.organization_locations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'org_locations_select' AND tablename = 'organization_locations') THEN
    EXECUTE 'CREATE POLICY "org_locations_select" ON public.organization_locations FOR SELECT USING (is_same_org(organization_id))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'org_locations_insert' AND tablename = 'organization_locations') THEN
    EXECUTE 'CREATE POLICY "org_locations_insert" ON public.organization_locations FOR INSERT WITH CHECK (
      has_org_role(auth.uid(), organization_id, ''admin'') OR has_org_role(auth.uid(), organization_id, ''people'')
    )';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'org_locations_update' AND tablename = 'organization_locations') THEN
    EXECUTE 'CREATE POLICY "org_locations_update" ON public.organization_locations FOR UPDATE USING (
      has_org_role(auth.uid(), organization_id, ''admin'') OR has_org_role(auth.uid(), organization_id, ''people'')
    )';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'org_locations_delete' AND tablename = 'organization_locations') THEN
    EXECUTE 'CREATE POLICY "org_locations_delete" ON public.organization_locations FOR DELETE USING (
      has_org_role(auth.uid(), organization_id, ''admin'') OR has_org_role(auth.uid(), organization_id, ''people'')
    )';
  END IF;
END $$;

-- =============================================
-- 2. Restrict jobs public SELECT (use 'active' not 'published')
-- =============================================
DROP POLICY IF EXISTS "jobs_select_active_public" ON public.jobs;

CREATE POLICY "jobs_select_active_public" ON public.jobs 
FOR SELECT 
USING (
  status = 'active'
  OR is_same_org(organization_id)
);

-- =============================================
-- 3. Validate job_applications INSERT (anti-spam)
-- =============================================
CREATE OR REPLACE FUNCTION public.validate_job_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.candidate_name IS NULL OR trim(NEW.candidate_name) = '' THEN
    RAISE EXCEPTION 'Nome do candidato é obrigatório';
  END IF;
  IF NEW.candidate_email IS NULL OR trim(NEW.candidate_email) = '' THEN
    RAISE EXCEPTION 'Email do candidato é obrigatório';
  END IF;
  IF NEW.candidate_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Formato de email inválido';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_job_application_trigger ON public.job_applications;
CREATE TRIGGER validate_job_application_trigger
BEFORE INSERT ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.validate_job_application();

-- =============================================
-- 4. Deny direct access to rate_limit tables
-- =============================================
ALTER TABLE IF EXISTS public.rate_limit_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_rate_limit_entries" ON public.rate_limit_entries;
CREATE POLICY "deny_all_rate_limit_entries" ON public.rate_limit_entries FOR ALL USING (false);

ALTER TABLE IF EXISTS public.rate_limit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_rate_limit_log" ON public.rate_limit_log;
CREATE POLICY "deny_all_rate_limit_log" ON public.rate_limit_log FOR ALL USING (false);
