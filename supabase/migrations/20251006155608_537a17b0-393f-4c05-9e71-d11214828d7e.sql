-- FASE 1: Migração para suporte a múltiplos tipos de equipamento

-- Criar ENUM para tipos de equipamento
CREATE TYPE device_type AS ENUM (
  'computer',
  'monitor',
  'mouse',
  'keyboard',
  'headset',
  'webcam',
  'phone',
  'tablet',
  'apple_tv',
  'chromecast',
  'cable',
  'charger',
  'other'
);

-- Criar ENUM para status do equipamento
CREATE TYPE device_status AS ENUM (
  'borrowed',           -- Emprestado
  'available',          -- Disponível
  'office',             -- Escritório
  'defective',          -- Defeito
  'returned',           -- Devolvido
  'not_found',          -- Não encontrado
  'maintenance',        -- Em manutenção
  'pending_format',     -- Pendente de formatação
  'pending_return',     -- Pendente de devolução
  'sold',               -- Vendido
  'donated'             -- Doado
);

-- Adicionar novas colunas à tabela devices
ALTER TABLE public.devices 
  ADD COLUMN device_type device_type NOT NULL DEFAULT 'computer',
  ADD COLUMN status device_status NOT NULL DEFAULT 'borrowed',
  ADD COLUMN screen_size NUMERIC(4,1),
  ADD COLUMN hexnode_registered BOOLEAN DEFAULT false;

-- Tornar campos específicos de computador NULLABLE
ALTER TABLE public.devices
  ALTER COLUMN processor DROP NOT NULL,
  ALTER COLUMN ram DROP NOT NULL,
  ALTER COLUMN disk DROP NOT NULL;

-- Atualizar dispositivos existentes para type computer
UPDATE public.devices 
SET device_type = 'computer' 
WHERE device_type IS NULL OR device_type = 'computer';

-- Criar índices para performance
CREATE INDEX idx_devices_type ON public.devices(device_type);
CREATE INDEX idx_devices_status ON public.devices(status);