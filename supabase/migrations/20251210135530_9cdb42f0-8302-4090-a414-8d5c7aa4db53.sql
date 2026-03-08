-- Fix pdis UPDATE policy to allow finalization
DROP POLICY IF EXISTS "pdis_update" ON public.pdis;

CREATE POLICY "pdis_update" ON public.pdis
FOR UPDATE TO authenticated
USING (
  (finalized_at IS NULL) AND (
    has_role(auth.uid(), 'people'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    (manager_id = auth.uid()) OR 
    ((employee_id = auth.uid()) AND (status = 'rascunho'::pdi_status))
  )
)
WITH CHECK (
  has_role(auth.uid(), 'people'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  (manager_id = auth.uid()) OR 
  (employee_id = auth.uid())
);