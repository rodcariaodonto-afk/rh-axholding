
CREATE TABLE public.b2b_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  empresa TEXT NOT NULL,
  num_funcionarios TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  mensagem TEXT,
  origem TEXT DEFAULT 'landing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.b2b_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert leads"
  ON public.b2b_leads
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Org admins can read leads"
  ON public.b2b_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN roles r ON om.role_id = r.id
      WHERE om.user_id = auth.uid()
        AND r.slug = 'admin'
    )
  );
