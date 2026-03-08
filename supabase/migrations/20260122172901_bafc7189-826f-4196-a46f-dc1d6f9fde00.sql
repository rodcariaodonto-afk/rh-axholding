-- Remover política atual de DELETE que só permite Admin
DROP POLICY IF EXISTS "trainings_delete_admin" ON employee_trainings;

-- Criar nova política que permite Admin e People excluir treinamentos
CREATE POLICY "trainings_delete_admin_people" ON employee_trainings
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'people')
  );