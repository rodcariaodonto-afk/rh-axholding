
-- Table: justificativas_ponto
CREATE TABLE public.justificativas_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tipo_registro VARCHAR(50) NOT NULL,
  data_evento DATE NOT NULL,
  descricao_evento TEXT,
  horario_evento TIME,
  duracao_minutos INT,
  motivo VARCHAR(100),
  descricao_justificativa TEXT,
  arquivo_url TEXT,
  tipo_documento VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'pendente_justificativa',
  data_envio TIMESTAMPTZ,
  data_aprovacao TIMESTAMPTZ,
  data_rejeicao TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  aprovado_por UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.justificativas_ponto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org justificativas"
  ON public.justificativas_ponto FOR SELECT
  TO authenticated
  USING (is_same_org(organization_id));

CREATE POLICY "Members can insert own justificativas"
  ON public.justificativas_ponto FOR INSERT
  TO authenticated
  WITH CHECK (is_same_org(organization_id));

CREATE POLICY "Members can update org justificativas"
  ON public.justificativas_ponto FOR UPDATE
  TO authenticated
  USING (is_same_org(organization_id));

CREATE POLICY "Members can delete org justificativas"
  ON public.justificativas_ponto FOR DELETE
  TO authenticated
  USING (is_same_org(organization_id));

-- Updated_at trigger
CREATE TRIGGER update_justificativas_ponto_updated_at
  BEFORE UPDATE ON public.justificativas_ponto
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for justificativa attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('justificativa-anexos', 'justificativa-anexos', false)
ON CONFLICT DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload justificativa files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'justificativa-anexos');

CREATE POLICY "Authenticated users can view justificativa files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'justificativa-anexos');

CREATE POLICY "Authenticated users can delete justificativa files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'justificativa-anexos');
