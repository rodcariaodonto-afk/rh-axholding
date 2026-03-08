-- Add desired position and seniority fields for talent bank applications
ALTER TABLE public.job_applications 
ADD COLUMN desired_position text,
ADD COLUMN desired_seniority text;