-- 1. Adicionar novos valores ao enum termination_reason
ALTER TYPE termination_reason ADD VALUE IF NOT EXISTS 'rescisao_indireta';
ALTER TYPE termination_reason ADD VALUE IF NOT EXISTS 'antecipada_termo_empregado';
ALTER TYPE termination_reason ADD VALUE IF NOT EXISTS 'aposentadoria_idade';
ALTER TYPE termination_reason ADD VALUE IF NOT EXISTS 'aposentadoria_invalidez';
ALTER TYPE termination_reason ADD VALUE IF NOT EXISTS 'aposentadoria_compulsoria';
ALTER TYPE termination_reason ADD VALUE IF NOT EXISTS 'falecimento';
ALTER TYPE termination_reason ADD VALUE IF NOT EXISTS 'forca_maior';

-- 2. Adicionar campo de observações
ALTER TABLE employees ADD COLUMN IF NOT EXISTS termination_notes TEXT;