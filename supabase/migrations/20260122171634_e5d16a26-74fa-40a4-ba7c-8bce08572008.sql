-- Atualizar política de DELETE na tabela devices para incluir role 'people'
DROP POLICY IF EXISTS "devices_delete_admin" ON public.devices;

CREATE POLICY "devices_delete_admin_people" ON public.devices
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'people')
  );