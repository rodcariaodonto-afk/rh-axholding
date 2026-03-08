-- Add explicit anon SELECT policy for positions
CREATE POLICY "positions_select_anon"
ON public.positions
FOR SELECT
TO anon
USING (true);

-- Add explicit anon SELECT policy for departments
CREATE POLICY "departments_select_anon"
ON public.departments
FOR SELECT
TO anon
USING (true);
