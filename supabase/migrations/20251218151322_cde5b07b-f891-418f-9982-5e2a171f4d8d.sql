-- Adicionar campos para configurações da empresa
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS headquarters_city TEXT,
ADD COLUMN IF NOT EXISTS work_policy TEXT,
ADD COLUMN IF NOT EXISTS team_structure TEXT,
ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS work_environment TEXT,
ADD COLUMN IF NOT EXISTS tech_stack TEXT,
ADD COLUMN IF NOT EXISTS interview_format TEXT,
ADD COLUMN IF NOT EXISTS hiring_time TEXT,
ADD COLUMN IF NOT EXISTS hiring_process_description TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS twitter_handle TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.organizations.headquarters_city IS 'Cidade sede da empresa';
COMMENT ON COLUMN public.organizations.work_policy IS 'Política de trabalho: remoto, hibrido, presencial';
COMMENT ON COLUMN public.organizations.team_structure IS 'Descrição da estrutura de times';
COMMENT ON COLUMN public.organizations.benefits IS 'Lista de benefícios oferecidos (JSONB array)';
COMMENT ON COLUMN public.organizations.work_environment IS 'Descrição do ambiente de trabalho';
COMMENT ON COLUMN public.organizations.tech_stack IS 'Stack de tecnologias usadas';
COMMENT ON COLUMN public.organizations.interview_format IS 'Formato das entrevistas';
COMMENT ON COLUMN public.organizations.hiring_time IS 'Tempo médio do processo seletivo';
COMMENT ON COLUMN public.organizations.hiring_process_description IS 'Descrição do processo seletivo';
COMMENT ON COLUMN public.organizations.linkedin_url IS 'URL do LinkedIn da empresa';
COMMENT ON COLUMN public.organizations.instagram_handle IS 'Handle do Instagram';
COMMENT ON COLUMN public.organizations.twitter_handle IS 'Handle do Twitter/X';