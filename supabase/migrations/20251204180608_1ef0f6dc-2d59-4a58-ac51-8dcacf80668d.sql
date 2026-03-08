-- Add profiler fields to job_applications table
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS profiler_result_code text,
ADD COLUMN IF NOT EXISTS profiler_result_detail jsonb,
ADD COLUMN IF NOT EXISTS profiler_completed_at timestamp with time zone;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_job_applications_profiler_code 
ON public.job_applications(profiler_result_code);

-- Comment on columns
COMMENT ON COLUMN public.job_applications.profiler_result_code IS 'Profiler result code/sigla (e.g., EXE, COM, PLA, ANA)';
COMMENT ON COLUMN public.job_applications.profiler_result_detail IS 'Full profiler result object with all details';
COMMENT ON COLUMN public.job_applications.profiler_completed_at IS 'Timestamp when the profiler test was completed';