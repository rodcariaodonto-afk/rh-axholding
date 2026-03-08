-- Add AI analysis columns to job_applications table
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS ai_score numeric(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_report text DEFAULT NULL;