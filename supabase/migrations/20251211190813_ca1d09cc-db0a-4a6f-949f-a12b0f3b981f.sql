-- Create job descriptions table
CREATE TABLE public.job_descriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_type text NOT NULL,
  seniority text NOT NULL,
  description text,
  requirements text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view job descriptions" 
ON public.job_descriptions 
FOR SELECT 
USING (true);

CREATE POLICY "Admin and People can manage job descriptions" 
ON public.job_descriptions 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'people'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'people'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_job_descriptions_updated_at
BEFORE UPDATE ON public.job_descriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();