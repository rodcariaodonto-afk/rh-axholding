-- Create policy to allow managers to view their direct reports
CREATE POLICY "managers_select_direct_reports"
ON public.employees
FOR SELECT
USING (manager_id = auth.uid());