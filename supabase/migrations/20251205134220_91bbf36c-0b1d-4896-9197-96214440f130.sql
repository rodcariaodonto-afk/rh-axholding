-- Drop the incorrectly created policy
DROP POLICY IF EXISTS "jobs_select_public" ON public.jobs;

-- Create policy for anonymous users to read active jobs
CREATE POLICY "jobs_select_anon"
ON public.jobs
FOR SELECT
TO anon
USING (status = 'active');
