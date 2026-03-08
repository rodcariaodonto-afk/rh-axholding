-- Create job status enum
CREATE TYPE public.job_status AS ENUM ('active', 'closed', 'draft', 'on_hold');

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  status job_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "jobs_select" ON public.jobs
FOR SELECT USING (true);

CREATE POLICY "jobs_insert" ON public.jobs
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people')
);

CREATE POLICY "jobs_update" ON public.jobs
FOR UPDATE USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people')
);

CREATE POLICY "jobs_delete" ON public.jobs
FOR DELETE USING (
  has_role(auth.uid(), 'admin')
);

-- Create job applications table (placeholder for future candidate tracking)
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  resume_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_applications
CREATE POLICY "job_applications_select" ON public.job_applications
FOR SELECT USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people')
);

CREATE POLICY "job_applications_insert" ON public.job_applications
FOR INSERT WITH CHECK (true);

CREATE POLICY "job_applications_update" ON public.job_applications
FOR UPDATE USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people')
);

CREATE POLICY "job_applications_delete" ON public.job_applications
FOR DELETE USING (
  has_role(auth.uid(), 'admin')
);

-- Trigger for updated_at
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();