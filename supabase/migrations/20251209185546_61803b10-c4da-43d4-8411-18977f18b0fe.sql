-- Add demographic fields to job_applications table
ALTER TABLE public.job_applications
ADD COLUMN candidate_state text,
ADD COLUMN candidate_city text,
ADD COLUMN candidate_phone text,
ADD COLUMN candidate_race text,
ADD COLUMN candidate_gender text,
ADD COLUMN candidate_sexual_orientation text,
ADD COLUMN candidate_pcd boolean DEFAULT false,
ADD COLUMN candidate_pcd_type text;

-- Add comments for documentation
COMMENT ON COLUMN public.job_applications.candidate_state IS 'Brazilian state (UF)';
COMMENT ON COLUMN public.job_applications.candidate_city IS 'City name';
COMMENT ON COLUMN public.job_applications.candidate_phone IS 'Phone in format (xx) xxxxx-xxxx';
COMMENT ON COLUMN public.job_applications.candidate_race IS 'Race: branco, preto, pardo, amarelo, indigena';
COMMENT ON COLUMN public.job_applications.candidate_gender IS 'Gender identity';
COMMENT ON COLUMN public.job_applications.candidate_sexual_orientation IS 'Sexual orientation';
COMMENT ON COLUMN public.job_applications.candidate_pcd IS 'Person with disability flag';
COMMENT ON COLUMN public.job_applications.candidate_pcd_type IS 'Type of disability if PCD is true';