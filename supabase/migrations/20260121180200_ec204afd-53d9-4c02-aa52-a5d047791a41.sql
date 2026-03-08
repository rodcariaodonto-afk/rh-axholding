-- Remover policies antigas que limitam apenas a admin
DROP POLICY IF EXISTS "Admin can manage settings" ON public.company_cost_settings;
DROP POLICY IF EXISTS "Admin can view settings" ON public.company_cost_settings;

-- Criar novas policies que incluem people
CREATE POLICY "Admin and People can view settings"
ON public.company_cost_settings
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'people')
);

CREATE POLICY "Admin and People can manage settings"
ON public.company_cost_settings
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'people')
)
WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'people')
);