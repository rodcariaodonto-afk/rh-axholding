-- Adicionar coluna user_id na tabela devices
ALTER TABLE public.devices
ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX idx_devices_user_id ON public.devices(user_id);

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.devices.user_id IS 'ID do usuário @popcode.com.br responsável pelo dispositivo';