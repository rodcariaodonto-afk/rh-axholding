-- Adicionar coluna closed_at na tabela jobs
ALTER TABLE public.jobs 
ADD COLUMN closed_at TIMESTAMPTZ;

-- Comentário explicativo
COMMENT ON COLUMN public.jobs.closed_at IS 'Data em que a vaga foi encerrada/preenchida';