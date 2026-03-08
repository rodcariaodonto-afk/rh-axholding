-- Add profiler result columns to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS profiler_result_code text,
ADD COLUMN IF NOT EXISTS profiler_result_detail jsonb,
ADD COLUMN IF NOT EXISTS profiler_completed_at timestamp with time zone;