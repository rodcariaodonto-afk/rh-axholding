-- Adicionar colunas serial e warranty_date
ALTER TABLE public.devices
ADD COLUMN serial TEXT,
ADD COLUMN warranty_date DATE;

-- Criar índice para serial (útil para buscas)
CREATE INDEX idx_devices_serial ON public.devices(serial) WHERE serial IS NOT NULL;

-- Adicionar comentários
COMMENT ON COLUMN public.devices.serial IS 'Número de série do dispositivo';
COMMENT ON COLUMN public.devices.warranty_date IS 'Data de vencimento da garantia';

-- Atualizar policy de UPDATE para permitir que usuários editem seus próprios dispositivos
DROP POLICY IF EXISTS "Admin e People podem atualizar dispositivos" ON public.devices;

CREATE POLICY "Admin, People e donos podem atualizar dispositivos"
ON public.devices
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'people'::app_role) OR
  auth.uid() = user_id
);