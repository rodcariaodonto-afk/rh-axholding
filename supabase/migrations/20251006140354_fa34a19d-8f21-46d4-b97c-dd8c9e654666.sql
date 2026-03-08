-- Criar tabela de dispositivos
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  processor TEXT NOT NULL,
  ram INTEGER NOT NULL,
  disk INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública
CREATE POLICY "Permitir leitura pública de dispositivos"
  ON public.devices
  FOR SELECT
  USING (true);

-- Política para permitir inserção pública
CREATE POLICY "Permitir inserção pública de dispositivos"
  ON public.devices
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir atualização pública
CREATE POLICY "Permitir atualização pública de dispositivos"
  ON public.devices
  FOR UPDATE
  USING (true);

-- Política para permitir exclusão pública
CREATE POLICY "Permitir exclusão pública de dispositivos"
  ON public.devices
  FOR DELETE
  USING (true);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp automaticamente
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais
INSERT INTO public.devices (user_name, model, year, processor, ram, disk, notes) VALUES
  ('Hian Kalled', 'Mac Mini', 2020, 'M1', 16, 256, NULL),
  ('Gabriel', 'Macbook Pro 16"', 2023, 'M2', 16, 512, 'Máquina pessoal'),
  ('Gabriel Amat', 'Macbook Air 13"', 2020, 'M1', 8, 265, 'Máquina pessoal'),
  ('Bruno Novels', 'Macbook Pro', 2023, 'M3', 8, 512, 'Máquina pessoal'),
  ('Maria Tupich', 'Macbook Air 13"', 2024, 'M3', 8, 256, NULL),
  ('Arthur Ribeiro', 'Mac Mini', 2024, 'M4', 16, 256, NULL),
  ('Hugo Gomes', 'Macbook Air 13"', 2025, 'M4', 16, 256, NULL),
  ('Matheus Costa', 'Macbook Pro 16"', 2021, 'M1', 32, 1024, NULL),
  ('Brenda Mandes', 'Macbook Pro 13"', 2017, 'i5', 8, 256, NULL),
  ('Michael Correia', 'Macbook Air 13"', 2025, 'M4', 16, 256, NULL),
  ('Marco Henrique', 'Macbook Air 13"', 2025, 'M4', 16, 256, NULL),
  ('Luis Honorato', 'Macbook Pro 15"', 2018, 'I9', 16, 512, NULL),
  ('Samuel Coutinho', 'Macbook Air 13"', 2024, 'M3', 8, 256, NULL),
  ('Guilherme Araújo', 'Macbook Air 13"', 2025, 'M4', 24, 512, NULL);