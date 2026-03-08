-- Drop existing policies
DROP POLICY IF EXISTS "company_culture_select" ON public.company_culture;
DROP POLICY IF EXISTS "company_culture_modify" ON public.company_culture;

-- Create new policies allowing both admin and people roles
CREATE POLICY "company_culture_select" ON public.company_culture
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "company_culture_modify" ON public.company_culture
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));