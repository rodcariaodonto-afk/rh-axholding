-- Create enum for candidate selection stages
CREATE TYPE public.candidate_stage AS ENUM ('selecao', 'fit_cultural', 'pre_admissao', 'banco_talentos', 'rejeitado', 'contratado');

-- Add stage column to job_applications
ALTER TABLE public.job_applications 
ADD COLUMN stage public.candidate_stage NOT NULL DEFAULT 'selecao';

-- Create index for better performance when filtering by stage
CREATE INDEX idx_job_applications_stage ON public.job_applications(stage);
