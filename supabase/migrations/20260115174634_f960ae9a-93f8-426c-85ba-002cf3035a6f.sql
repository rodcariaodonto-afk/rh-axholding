-- Permitir que colaboradores vejam seu próprio contrato
DROP POLICY IF EXISTS "employees_contracts_select" ON public.employees_contracts;

CREATE POLICY "employees_contracts_select"
ON public.employees_contracts FOR SELECT
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'people')
);

-- Permitir que colaboradores atualizem alguns campos do próprio contrato (exceto salário - isso fica restrito a admin/people)
-- Na prática, a atualização de salário já está protegida pois só admin/people podem UPDATE
-- Mas vamos manter a política existente que só permite admin/people atualizarem contratos