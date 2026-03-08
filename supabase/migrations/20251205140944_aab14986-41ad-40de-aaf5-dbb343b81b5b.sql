-- Drop the restrictive INSERT policies
DROP POLICY IF EXISTS "Anon can insert job applications" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_insert_public" ON public.job_applications;

-- Create a PERMISSIVE INSERT policy for anonymous users
CREATE POLICY "job_applications_anon_insert"
ON public.job_applications
FOR INSERT
TO anon
WITH CHECK (true);

-- Create a PERMISSIVE INSERT policy for authenticated users
CREATE POLICY "job_applications_auth_insert"
ON public.job_applications
FOR INSERT
TO authenticated
WITH CHECK (true);