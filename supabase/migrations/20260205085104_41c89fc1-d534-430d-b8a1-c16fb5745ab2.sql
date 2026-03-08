-- Criar enum para status da análise de IA
CREATE TYPE ai_analysis_status AS ENUM (
  'not_requested',
  'pending',
  'processing',
  'completed',
  'error'
);

-- Adicionar coluna na tabela job_applications
ALTER TABLE job_applications 
ADD COLUMN ai_analysis_status ai_analysis_status DEFAULT 'not_requested';

-- Migrar dados existentes (candidatos que já têm análise concluída)
UPDATE job_applications 
SET ai_analysis_status = 'completed' 
WHERE ai_score IS NOT NULL OR ai_report IS NOT NULL;