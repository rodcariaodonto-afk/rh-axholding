-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "job_applications_insert" ON public.job_applications;

-- Create a permissive insert policy that allows anyone to insert
CREATE POLICY "job_applications_insert_public"
ON public.job_applications
FOR INSERT
TO public
WITH CHECK (true);