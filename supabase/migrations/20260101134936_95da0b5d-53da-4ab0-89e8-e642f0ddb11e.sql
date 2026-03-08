-- Permitir admin/people criar solicitações para qualquer colaborador
CREATE POLICY "Admin and People can create requests for employees"
ON public.time_off_requests
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'people'::app_role)
);