-- Add birth_date field to job_applications
ALTER TABLE public.job_applications 
ADD COLUMN candidate_birth_date date;

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('resumes', 'resumes', false, 10485760, ARRAY['application/pdf']);

-- Storage policies for resumes bucket
CREATE POLICY "Anyone can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Admin and People can view resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'resumes' AND (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'people'::app_role)
));

CREATE POLICY "Admin can delete resumes"
ON storage.objects FOR DELETE
USING (bucket_id = 'resumes' AND has_role(auth.uid(), 'admin'::app_role));