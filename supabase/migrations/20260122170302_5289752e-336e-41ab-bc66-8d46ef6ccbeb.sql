-- =============================================
-- GESTÃO DE TREINAMENTOS E CERTIFICAÇÕES
-- =============================================

-- 1. ENUMs
CREATE TYPE training_type AS ENUM ('treinamento', 'certificacao');
CREATE TYPE training_sponsor AS ENUM ('empresa', 'colaborador');

-- 2. Tabela principal de treinamentos
CREATE TABLE public.employee_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Dados do treinamento
  name TEXT NOT NULL,
  training_type training_type NOT NULL DEFAULT 'treinamento',
  description TEXT,
  hours INTEGER NOT NULL CHECK (hours > 0),
  completion_date DATE NOT NULL,
  
  -- Custos
  cost DECIMAL(10,2),
  sponsor training_sponsor DEFAULT 'empresa',
  
  -- Integração PDI
  from_pdi BOOLEAN DEFAULT FALSE,
  pdi_id UUID REFERENCES pdis(id) ON DELETE SET NULL,
  pdi_goal_id UUID REFERENCES pdi_goals(id) ON DELETE SET NULL,
  
  -- Pontuação
  generates_points BOOLEAN DEFAULT FALSE,
  career_points INTEGER CHECK (career_points >= 0),
  
  -- Comprovante
  certificate_url TEXT,
  
  -- Auditoria
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de pontos acumulados
CREATE TABLE public.employee_career_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_training_hours INTEGER NOT NULL DEFAULT 0,
  total_certifications INTEGER NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Índices
CREATE INDEX idx_trainings_employee ON employee_trainings(employee_id);
CREATE INDEX idx_trainings_pdi ON employee_trainings(pdi_id);
CREATE INDEX idx_trainings_date ON employee_trainings(completion_date DESC);
CREATE INDEX idx_trainings_type ON employee_trainings(training_type);
CREATE INDEX idx_trainings_generates_points ON employee_trainings(employee_id, generates_points);

-- 5. Trigger para updated_at
CREATE TRIGGER update_employee_trainings_updated_at
  BEFORE UPDATE ON employee_trainings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS para employee_trainings
ALTER TABLE employee_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_trainings FORCE ROW LEVEL SECURITY;

-- SELECT: Admin/People veem todos
CREATE POLICY "trainings_select_admin_people" ON employee_trainings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

-- SELECT: Colaborador vê os próprios
CREATE POLICY "trainings_select_own" ON employee_trainings
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid());

-- INSERT: Admin/People podem criar para qualquer um
CREATE POLICY "trainings_insert_admin_people" ON employee_trainings
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

-- INSERT: Colaborador só para si
CREATE POLICY "trainings_insert_own" ON employee_trainings
  FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid() AND created_by = auth.uid());

-- UPDATE: Admin/People podem editar qualquer um
CREATE POLICY "trainings_update_admin_people" ON employee_trainings
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

-- UPDATE: Colaborador só os próprios
CREATE POLICY "trainings_update_own" ON employee_trainings
  FOR UPDATE TO authenticated
  USING (employee_id = auth.uid());

-- DELETE: Apenas Admin pode excluir
CREATE POLICY "trainings_delete_admin" ON employee_trainings
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 7. RLS para employee_career_points
ALTER TABLE employee_career_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_career_points FORCE ROW LEVEL SECURITY;

-- SELECT: Todos podem ver (transparência)
CREATE POLICY "career_points_select" ON employee_career_points
  FOR SELECT TO authenticated
  USING (true);

-- 8. Função de recálculo de pontos
CREATE OR REPLACE FUNCTION recalculate_employee_career_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  emp_id UUID;
  total_pts INTEGER;
  total_hrs INTEGER;
  total_certs INTEGER;
BEGIN
  emp_id := COALESCE(NEW.employee_id, OLD.employee_id);
  
  -- Calcular totais
  SELECT 
    COALESCE(SUM(CASE WHEN generates_points THEN career_points ELSE 0 END), 0),
    COALESCE(SUM(hours), 0),
    COALESCE(COUNT(*) FILTER (WHERE training_type = 'certificacao'), 0)
  INTO total_pts, total_hrs, total_certs
  FROM employee_trainings
  WHERE employee_id = emp_id;
  
  -- Upsert nos pontos de carreira
  INSERT INTO employee_career_points (employee_id, total_points, total_training_hours, total_certifications)
  VALUES (emp_id, total_pts, total_hrs, total_certs)
  ON CONFLICT (employee_id) 
  DO UPDATE SET 
    total_points = total_pts,
    total_training_hours = total_hrs,
    total_certifications = total_certs,
    last_calculated_at = NOW();
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para recálculo automático
CREATE TRIGGER recalculate_career_points_trigger
  AFTER INSERT OR UPDATE OR DELETE ON employee_trainings
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_employee_career_points();

-- 9. Função para criar treinamento automaticamente quando meta do PDI é concluída
CREATE OR REPLACE FUNCTION create_training_from_pdi_goal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pdi_record RECORD;
BEGIN
  -- Só executa quando meta muda para 'concluida'
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status <> 'concluida') THEN
    -- Buscar dados do PDI
    SELECT employee_id, manager_id INTO pdi_record
    FROM pdis WHERE id = NEW.pdi_id;
    
    -- Verificar se já existe treinamento para esta meta (evitar duplicação)
    IF NOT EXISTS (
      SELECT 1 FROM employee_trainings WHERE pdi_goal_id = NEW.id
    ) THEN
      INSERT INTO employee_trainings (
        employee_id,
        name,
        training_type,
        description,
        hours,
        completion_date,
        from_pdi,
        pdi_id,
        pdi_goal_id,
        generates_points,
        career_points,
        created_by
      ) VALUES (
        pdi_record.employee_id,
        NEW.title,
        'treinamento',
        NEW.description,
        8, -- Horas padrão
        CURRENT_DATE,
        TRUE,
        NEW.pdi_id,
        NEW.id,
        FALSE,
        0,
        COALESCE(pdi_record.manager_id, pdi_record.employee_id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para criar treinamento via PDI
CREATE TRIGGER create_training_from_goal_trigger
  AFTER UPDATE OF status ON pdi_goals
  FOR EACH ROW
  EXECUTE FUNCTION create_training_from_pdi_goal();