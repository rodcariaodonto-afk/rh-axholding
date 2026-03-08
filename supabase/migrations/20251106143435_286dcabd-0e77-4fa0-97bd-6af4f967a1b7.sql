-- =====================================================
-- MÓDULO PDI (Plano de Desenvolvimento Individual)
-- =====================================================

-- 1. CRIAR ENUMS
-- =====================================================

-- Status do PDI (auto-calculado)
CREATE TYPE pdi_status AS ENUM (
  'rascunho',       -- Inicial, ainda sendo criado
  'em_andamento',   -- Existe meta pendente/em_andamento e hoje <= due_date
  'entregue',       -- Todas metas concluídas e hoje <= due_date
  'concluido',      -- Entregue e finalizado manualmente
  'cancelado'       -- Finalizado sem concluir metas
);

-- Status de meta (auto-calculado baseado em completion_ratio)
CREATE TYPE pdi_goal_status AS ENUM (
  'pendente',       -- completion_ratio = 0
  'em_andamento',   -- 0 < completion_ratio < 100
  'concluida'       -- completion_ratio = 100
);

-- Tipo de objetivo
CREATE TYPE pdi_goal_type AS ENUM (
  'tecnico',        -- Técnico/Hard skill
  'comportamental', -- Comportamental/Soft skill
  'lideranca',      -- Liderança
  'carreira'        -- Carreira
);

-- 2. CRIAR TABELAS
-- =====================================================

-- Tabela principal de PDIs
CREATE TABLE public.pdis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  
  -- Informações básicas (obrigatórias)
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Informações opcionais
  current_state TEXT, -- "Onde está"
  desired_state TEXT, -- "Onde quer chegar"
  objective TEXT,     -- Objetivo geral
  
  -- Status e progresso (auto-calculados)
  status pdi_status NOT NULL DEFAULT 'rascunho',
  progress NUMERIC(5,2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  engagement_score NUMERIC(3,2) DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 1),
  
  -- Gestão
  created_by UUID NOT NULL REFERENCES public.employees(id),
  manager_id UUID REFERENCES public.employees(id),
  
  -- Finalização
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES public.employees(id),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_date_range CHECK (due_date >= start_date)
);

CREATE INDEX idx_pdis_employee ON pdis(employee_id);
CREATE INDEX idx_pdis_status ON pdis(status);
CREATE INDEX idx_pdis_dates ON pdis(start_date, due_date);
CREATE INDEX idx_pdis_manager ON pdis(manager_id);

COMMENT ON TABLE pdis IS 'Planos de Desenvolvimento Individual dos colaboradores';

-- Tabela de metas
CREATE TABLE public.pdi_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdi_id UUID NOT NULL REFERENCES public.pdis(id) ON DELETE CASCADE,
  
  -- Detalhes da meta (obrigatórios)
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  
  -- Detalhes opcionais
  description TEXT,
  action_plan TEXT,
  goal_type pdi_goal_type NOT NULL DEFAULT 'tecnico',
  weight NUMERIC(5,2) DEFAULT 1 CHECK (weight > 0),
  
  -- Progresso (auto-calculado baseado em checklist)
  status pdi_goal_status NOT NULL DEFAULT 'pendente',
  completion_ratio NUMERIC(5,2) DEFAULT 0 CHECK (completion_ratio >= 0 AND completion_ratio <= 100),
  
  -- Checklist (JSONB array)
  checklist_items JSONB DEFAULT '[]'::jsonb,
  
  -- Integrações futuras
  criterion_id UUID,
  training_id UUID,
  
  -- Ordem de exibição
  display_order INT DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pdi_goals_pdi ON pdi_goals(pdi_id);
CREATE INDEX idx_pdi_goals_type ON pdi_goals(goal_type);
CREATE INDEX idx_pdi_goals_order ON pdi_goals(pdi_id, display_order);
CREATE INDEX idx_pdi_goals_due_date ON pdi_goals(due_date);

COMMENT ON TABLE pdi_goals IS 'Metas dos PDIs com checklist embutido';
COMMENT ON COLUMN pdi_goals.checklist_items IS 'Array JSONB de checklist items: [{"id":"uuid","text":"...","completed":true}]';

-- Tabela de logs
CREATE TABLE public.pdi_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdi_id UUID NOT NULL REFERENCES public.pdis(id) ON DELETE CASCADE,
  
  -- Tipo de evento
  event_type TEXT NOT NULL,
  
  -- Contexto do evento
  goal_id UUID REFERENCES public.pdi_goals(id) ON DELETE SET NULL,
  
  -- Detalhes
  description TEXT NOT NULL,
  metadata JSONB,
  
  -- Quem registrou
  logged_by UUID NOT NULL REFERENCES public.employees(id),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pdi_logs_pdi ON pdi_logs(pdi_id);
CREATE INDEX idx_pdi_logs_created ON pdi_logs(created_at DESC);
CREATE INDEX idx_pdi_logs_event ON pdi_logs(event_type);

COMMENT ON TABLE pdi_logs IS 'Histórico de eventos e mudanças nos PDIs';

-- Tabela de anexos
CREATE TABLE public.pdi_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdi_id UUID NOT NULL REFERENCES public.pdis(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.pdi_goals(id) ON DELETE CASCADE,
  
  -- Arquivo (Lovable Cloud Storage)
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  
  -- Metadata
  uploaded_by UUID NOT NULL REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pdi_attachments_pdi ON pdi_attachments(pdi_id);
CREATE INDEX idx_pdi_attachments_goal ON pdi_attachments(goal_id);

COMMENT ON TABLE pdi_attachments IS 'Anexos e evidências dos PDIs';

-- 3. CRIAR TRIGGERS
-- =====================================================

-- Trigger para updated_at em pdis
CREATE TRIGGER update_pdis_updated_at
  BEFORE UPDATE ON pdis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at em pdi_goals
CREATE TRIGGER update_pdi_goals_updated_at
  BEFORE UPDATE ON pdi_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular completion_ratio e status da meta baseado em checklist
CREATE OR REPLACE FUNCTION calculate_goal_completion()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_items INT;
  completed_items INT;
  new_ratio NUMERIC(5,2);
  new_status pdi_goal_status;
BEGIN
  -- Contar itens do checklist
  total_items := jsonb_array_length(NEW.checklist_items);
  
  IF total_items > 0 THEN
    SELECT COUNT(*)
    INTO completed_items
    FROM jsonb_array_elements(NEW.checklist_items) AS item
    WHERE (item->>'completed')::boolean = true;
    
    new_ratio := (completed_items::numeric / total_items::numeric) * 100;
  ELSE
    new_ratio := 0;
  END IF;
  
  -- Determinar status baseado no ratio
  IF new_ratio = 0 THEN
    new_status := 'pendente';
  ELSIF new_ratio = 100 THEN
    new_status := 'concluida';
  ELSE
    new_status := 'em_andamento';
  END IF;
  
  NEW.completion_ratio := new_ratio;
  NEW.status := new_status;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_goal_completion_on_checklist_change
  BEFORE INSERT OR UPDATE OF checklist_items ON pdi_goals
  FOR EACH ROW
  EXECUTE FUNCTION calculate_goal_completion();

-- Função para calcular progress do PDI (média ponderada)
CREATE OR REPLACE FUNCTION calculate_pdi_progress()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  weighted_progress NUMERIC(5,2);
BEGIN
  -- Calcular média ponderada dos completion_ratio das metas
  SELECT 
    CASE 
      WHEN SUM(weight) > 0 THEN 
        SUM(completion_ratio * weight) / SUM(weight)
      ELSE 0
    END
  INTO weighted_progress
  FROM pdi_goals
  WHERE pdi_id = COALESCE(NEW.pdi_id, OLD.pdi_id);
  
  -- Atualizar progresso do PDI
  UPDATE pdis
  SET progress = COALESCE(weighted_progress, 0)
  WHERE id = COALESCE(NEW.pdi_id, OLD.pdi_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pdi_progress_on_goal_change
  AFTER INSERT OR UPDATE OR DELETE ON pdi_goals
  FOR EACH ROW
  EXECUTE FUNCTION calculate_pdi_progress();

-- Função para calcular status do PDI automaticamente
CREATE OR REPLACE FUNCTION calculate_pdi_status()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pdi_record pdis%ROWTYPE;
  total_goals INT;
  completed_goals INT;
  today DATE := CURRENT_DATE;
  new_status pdi_status;
BEGIN
  -- Buscar PDI
  SELECT * INTO pdi_record
  FROM pdis
  WHERE id = COALESCE(NEW.pdi_id, OLD.pdi_id);
  
  -- Se já foi finalizado, não alterar status
  IF pdi_record.finalized_at IS NOT NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Contar metas
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'concluida')
  INTO total_goals, completed_goals
  FROM pdi_goals
  WHERE pdi_id = pdi_record.id;
  
  -- Regras de status
  IF total_goals = 0 THEN
    new_status := 'rascunho';
  ELSIF completed_goals = total_goals AND today <= pdi_record.due_date THEN
    new_status := 'entregue';
  ELSIF completed_goals < total_goals AND today <= pdi_record.due_date THEN
    new_status := 'em_andamento';
  ELSE
    new_status := 'em_andamento';
  END IF;
  
  -- Atualizar status do PDI
  UPDATE pdis
  SET status = new_status
  WHERE id = pdi_record.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pdi_status_on_goal_change
  AFTER INSERT OR UPDATE OR DELETE ON pdi_goals
  FOR EACH ROW
  EXECUTE FUNCTION calculate_pdi_status();

-- Função para calcular engagement_score baseado em logs
CREATE OR REPLACE FUNCTION calculate_pdi_engagement()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pdi_record pdis%ROWTYPE;
  days_active INT;
  log_count INT;
  engagement NUMERIC(3,2);
BEGIN
  -- Buscar PDI
  SELECT * INTO pdi_record
  FROM pdis
  WHERE id = NEW.pdi_id;
  
  -- Calcular dias desde criação
  days_active := EXTRACT(DAY FROM (now() - pdi_record.created_at));
  IF days_active < 1 THEN
    days_active := 1;
  END IF;
  
  -- Contar logs de eventos relevantes
  SELECT COUNT(*)
  INTO log_count
  FROM pdi_logs
  WHERE pdi_id = NEW.pdi_id
  AND event_type NOT IN ('exported', 'emailed');
  
  -- Calcular engajamento
  engagement := LEAST(1.0, log_count::numeric / (days_active * 2.0));
  
  -- Atualizar engagement do PDI
  UPDATE pdis
  SET engagement_score = engagement
  WHERE id = NEW.pdi_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pdi_engagement_on_log
  AFTER INSERT ON pdi_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_pdi_engagement();

-- Função para garantir apenas 1 PDI ativo por colaborador
CREATE OR REPLACE FUNCTION check_one_active_pdi_per_employee()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_count INT;
BEGIN
  -- Contar PDIs ativos do colaborador
  SELECT COUNT(*)
  INTO active_count
  FROM pdis
  WHERE employee_id = NEW.employee_id
  AND status IN ('em_andamento', 'entregue')
  AND finalized_at IS NULL
  AND id != NEW.id;
  
  -- Se já existe outro PDI ativo, bloquear
  IF active_count > 0 THEN
    RAISE EXCEPTION 'Colaborador já possui um PDI ativo. Finalize ou cancele o PDI anterior antes de criar um novo.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_one_active_pdi
  BEFORE INSERT OR UPDATE ON pdis
  FOR EACH ROW
  WHEN (NEW.finalized_at IS NULL AND NEW.status IN ('em_andamento', 'entregue'))
  EXECUTE FUNCTION check_one_active_pdi_per_employee();

-- 4. RLS POLICIES
-- =====================================================

-- Políticas para pdis
ALTER TABLE pdis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pdis_select"
ON pdis FOR SELECT
USING (
  employee_id = auth.uid() OR
  manager_id = auth.uid() OR
  has_role(auth.uid(), 'people') OR
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "pdis_insert"
ON pdis FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'people') OR
  has_role(auth.uid(), 'admin') OR
  manager_id = auth.uid()
);

CREATE POLICY "pdis_update"
ON pdis FOR UPDATE
USING (
  finalized_at IS NULL AND (
    has_role(auth.uid(), 'people') OR
    has_role(auth.uid(), 'admin') OR
    manager_id = auth.uid() OR
    (employee_id = auth.uid() AND status = 'rascunho')
  )
);

CREATE POLICY "pdis_delete"
ON pdis FOR DELETE
USING (
  has_role(auth.uid(), 'admin') AND
  NOT EXISTS (
    SELECT 1 FROM pdi_goals
    WHERE pdi_id = pdis.id
    AND status = 'concluida'
  )
);

-- Políticas para pdi_goals
ALTER TABLE pdi_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pdi_goals_select"
ON pdi_goals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pdis
    WHERE pdis.id = pdi_goals.pdi_id
    AND (
      pdis.employee_id = auth.uid() OR
      pdis.manager_id = auth.uid() OR
      has_role(auth.uid(), 'people') OR
      has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "pdi_goals_modify"
ON pdi_goals FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM pdis
    WHERE pdis.id = pdi_goals.pdi_id
    AND pdis.finalized_at IS NULL
    AND (
      has_role(auth.uid(), 'people') OR
      has_role(auth.uid(), 'admin') OR
      pdis.manager_id = auth.uid() OR
      (pdis.employee_id = auth.uid() AND pdis.status = 'rascunho')
    )
  )
);

-- Políticas para pdi_logs
ALTER TABLE pdi_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pdi_logs_select"
ON pdi_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pdis
    WHERE pdis.id = pdi_logs.pdi_id
    AND (
      pdis.employee_id = auth.uid() OR
      pdis.manager_id = auth.uid() OR
      has_role(auth.uid(), 'people') OR
      has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "pdi_logs_insert"
ON pdi_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pdis
    WHERE pdis.id = pdi_logs.pdi_id
    AND (
      pdis.employee_id = auth.uid() OR
      pdis.manager_id = auth.uid() OR
      has_role(auth.uid(), 'people') OR
      has_role(auth.uid(), 'admin')
    )
  )
);

-- Políticas para pdi_attachments
ALTER TABLE pdi_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pdi_attachments_select"
ON pdi_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pdis
    WHERE pdis.id = pdi_attachments.pdi_id
    AND (
      pdis.employee_id = auth.uid() OR
      pdis.manager_id = auth.uid() OR
      has_role(auth.uid(), 'people') OR
      has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "pdi_attachments_insert"
ON pdi_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pdis
    WHERE pdis.id = pdi_attachments.pdi_id
    AND pdis.finalized_at IS NULL
    AND (
      pdis.employee_id = auth.uid() OR
      pdis.manager_id = auth.uid() OR
      has_role(auth.uid(), 'people') OR
      has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "pdi_attachments_delete"
ON pdi_attachments FOR DELETE
USING (
  uploaded_by = auth.uid() OR
  has_role(auth.uid(), 'admin')
);