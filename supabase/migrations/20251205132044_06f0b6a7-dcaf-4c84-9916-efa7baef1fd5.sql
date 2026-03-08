-- Allow anyone to read active jobs (for public application pages)
CREATE POLICY "jobs_select_public"
ON public.jobs
FOR SELECT
TO public
USING (status = 'active');