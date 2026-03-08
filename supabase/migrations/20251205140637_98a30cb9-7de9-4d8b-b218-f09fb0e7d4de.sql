-- Create policy to allow anonymous users to insert job applications
CREATE POLICY "Anon can insert job applications"
ON public.job_applications
FOR INSERT
TO anon
WITH CHECK (true);