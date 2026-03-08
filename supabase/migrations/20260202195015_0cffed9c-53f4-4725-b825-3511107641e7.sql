-- Migration: Expandir tabela positions e criar position_seniority_levels

-- 1. Adicionar novos campos na tabela positions
ALTER TABLE public.positions
  ADD COLUMN IF NOT EXISTS parent_position_id UUID REFERENCES public.positions(id),
  ADD COLUMN IF NOT EXISTS activities TEXT,
  ADD COLUMN IF NOT EXISTS expected_profile_code TEXT;

-- Criar índice para hierarquia de cargos
CREATE INDEX IF NOT EXISTS idx_positions_parent ON public.positions(parent_position_id);

-- Comentários para documentação
COMMENT ON COLUMN public.positions.parent_position_id IS 'Cargo superior na hierarquia';
COMMENT ON COLUMN public.positions.activities IS 'Atividades e responsabilidades do cargo';
COMMENT ON COLUMN public.positions.expected_profile_code IS 'Perfil comportamental DISC esperado';

-- 2. Criar enum para níveis de senioridade
CREATE TYPE seniority_level AS ENUM (
  'estagiario', 'junior', 'pleno', 'senior', 'especialista', 'lider'
);

-- 3. Criar tabela de níveis de senioridade por cargo
CREATE TABLE public.position_seniority_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  seniority seniority_level NOT NULL,
  description TEXT,
  salary_min NUMERIC(10,2),
  salary_max NUMERIC(10,2),
  required_skills JSONB DEFAULT '[]'::jsonb,
  required_soft_skills JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(position_id, seniority)
);

-- 4. Habilitar e forçar RLS
ALTER TABLE public.position_seniority_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.position_seniority_levels FORCE ROW LEVEL SECURITY;

-- 5. Políticas RLS
CREATE POLICY "seniority_levels_select" ON public.position_seniority_levels
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM positions p WHERE p.id = position_id AND is_same_org(p.organization_id))
  );

CREATE POLICY "seniority_levels_manage" ON public.position_seniority_levels
  FOR ALL USING (
    EXISTS (SELECT 1 FROM positions p WHERE p.id = position_id AND is_same_org(p.organization_id))
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM positions p WHERE p.id = position_id AND is_same_org(p.organization_id))
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );

-- 6. Trigger para atualizar updated_at
CREATE TRIGGER update_seniority_levels_updated_at
  BEFORE UPDATE ON public.position_seniority_levels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();