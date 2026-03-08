-- ============================================
-- PHASE 3 & 4: Learning & Compensation Module
-- ============================================

-- ============================================
-- 1. EMPLOYEE_SKILLS - Vincula skills aos funcionários
-- ============================================
CREATE TABLE public.employee_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  skill_type TEXT NOT NULL CHECK (skill_type IN ('hard', 'soft')),
  skill_id UUID NOT NULL, -- Referencia hard_skills ou soft_skills dependendo do tipo
  current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 5),
  expected_level INTEGER CHECK (expected_level >= 1 AND expected_level <= 5),
  assessed_at DATE,
  assessed_by UUID REFERENCES public.employees(id),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, skill_type, skill_id)
);

-- Indexes
CREATE INDEX idx_employee_skills_org ON public.employee_skills(organization_id);
CREATE INDEX idx_employee_skills_employee ON public.employee_skills(employee_id);
CREATE INDEX idx_employee_skills_type ON public.employee_skills(skill_type, skill_id);

-- RLS
ALTER TABLE public.employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_skills FORCE ROW LEVEL SECURITY;

-- Select: próprio usuário, admin, people da mesma org
CREATE POLICY "employee_skills_select" ON public.employee_skills
  FOR SELECT USING (
    is_same_org(organization_id) AND (
      employee_id = auth.uid() OR
      has_org_role(auth.uid(), organization_id, 'admin') OR
      has_org_role(auth.uid(), organization_id, 'people')
    )
  );

-- Manage: admin ou people
CREATE POLICY "employee_skills_manage" ON public.employee_skills
  FOR ALL USING (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  ) WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  );

-- Trigger updated_at
CREATE TRIGGER update_employee_skills_updated_at
  BEFORE UPDATE ON public.employee_skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. TRAINING_CATALOG - Catálogo de treinamentos
-- ============================================
CREATE TABLE public.training_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- ex: técnico, comportamental, liderança
  provider TEXT, -- ex: interno, externo, coursera, udemy
  duration_hours NUMERIC(6,2),
  cost NUMERIC(12,2) DEFAULT 0,
  skill_ids UUID[], -- Skills que este treinamento desenvolve
  career_points INTEGER DEFAULT 0,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_training_catalog_org ON public.training_catalog(organization_id);
CREATE INDEX idx_training_catalog_category ON public.training_catalog(category);
CREATE INDEX idx_training_catalog_active ON public.training_catalog(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE public.training_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_catalog FORCE ROW LEVEL SECURITY;

-- Select: todos da mesma org
CREATE POLICY "training_catalog_select" ON public.training_catalog
  FOR SELECT USING (is_same_org(organization_id));

-- Manage: admin ou people
CREATE POLICY "training_catalog_manage" ON public.training_catalog
  FOR ALL USING (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  ) WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  );

-- Trigger updated_at
CREATE TRIGGER update_training_catalog_updated_at
  BEFORE UPDATE ON public.training_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3. TRAINING_REQUESTS - Solicitações de treinamento
-- ============================================
CREATE TYPE public.training_request_status AS ENUM (
  'draft',
  'pending_manager',
  'pending_people',
  'approved',
  'rejected',
  'completed',
  'cancelled'
);

CREATE TABLE public.training_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  training_id UUID REFERENCES public.training_catalog(id), -- NULL se for treinamento externo
  
  -- Detalhes do treinamento (se não for do catálogo)
  training_name TEXT,
  training_provider TEXT,
  training_description TEXT,
  training_url TEXT,
  
  -- Custos e duração
  estimated_cost NUMERIC(12,2) DEFAULT 0,
  estimated_hours NUMERIC(6,2),
  start_date DATE,
  end_date DATE,
  
  -- Justificativa
  justification TEXT NOT NULL,
  pdi_goal_id UUID REFERENCES public.pdi_goals(id), -- Se vinculado a um PDI
  
  -- Status e workflow
  status public.training_request_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  
  -- Aprovação do gestor
  manager_id UUID REFERENCES public.employees(id),
  manager_approved_at TIMESTAMPTZ,
  manager_notes TEXT,
  
  -- Aprovação do RH
  people_approved_by UUID REFERENCES public.employees(id),
  people_approved_at TIMESTAMPTZ,
  people_notes TEXT,
  
  -- Rejeição
  rejected_by UUID REFERENCES public.employees(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Conclusão
  completed_at TIMESTAMPTZ,
  actual_cost NUMERIC(12,2),
  certificate_url TEXT,
  feedback TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_training_requests_org ON public.training_requests(organization_id);
CREATE INDEX idx_training_requests_employee ON public.training_requests(employee_id);
CREATE INDEX idx_training_requests_status ON public.training_requests(status);
CREATE INDEX idx_training_requests_manager ON public.training_requests(manager_id) WHERE status = 'pending_manager';

-- RLS
ALTER TABLE public.training_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_requests FORCE ROW LEVEL SECURITY;

-- Select: próprio, gestor, admin, people
CREATE POLICY "training_requests_select" ON public.training_requests
  FOR SELECT USING (
    is_same_org(organization_id) AND (
      employee_id = auth.uid() OR
      manager_id = auth.uid() OR
      has_org_role(auth.uid(), organization_id, 'admin') OR
      has_org_role(auth.uid(), organization_id, 'people')
    )
  );

-- Insert: próprio funcionário
CREATE POLICY "training_requests_insert" ON public.training_requests
  FOR INSERT WITH CHECK (
    is_same_org(organization_id) AND employee_id = auth.uid()
  );

-- Update: depende do status
CREATE POLICY "training_requests_update" ON public.training_requests
  FOR UPDATE USING (
    is_same_org(organization_id) AND (
      -- Próprio pode editar em draft
      (status = 'draft' AND employee_id = auth.uid()) OR
      -- Gestor pode aprovar/rejeitar
      (status = 'pending_manager' AND manager_id = auth.uid()) OR
      -- RH pode aprovar/rejeitar em qualquer momento
      has_org_role(auth.uid(), organization_id, 'admin') OR
      has_org_role(auth.uid(), organization_id, 'people')
    )
  );

-- Delete: apenas admin
CREATE POLICY "training_requests_delete" ON public.training_requests
  FOR DELETE USING (
    has_org_role(auth.uid(), organization_id, 'admin')
  );

-- Trigger updated_at
CREATE TRIGGER update_training_requests_updated_at
  BEFORE UPDATE ON public.training_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 4. COMPENSATION_HISTORY - Histórico salarial
-- ============================================
CREATE TABLE public.compensation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  
  -- Valores (sensíveis)
  base_salary NUMERIC(12,2) NOT NULL,
  previous_salary NUMERIC(12,2),
  change_percentage NUMERIC(5,2),
  
  -- Contexto
  effective_date DATE NOT NULL,
  reason TEXT, -- promoção, mérito, ajuste, mercado
  notes TEXT,
  
  -- Auditoria
  approved_by UUID REFERENCES public.employees(id),
  approved_at TIMESTAMPTZ,
  modified_by UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_compensation_history_org ON public.compensation_history(organization_id);
CREATE INDEX idx_compensation_history_employee ON public.compensation_history(employee_id);
CREATE INDEX idx_compensation_history_date ON public.compensation_history(effective_date DESC);

-- RLS (muito restritivo - dados sensíveis)
ALTER TABLE public.compensation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compensation_history FORCE ROW LEVEL SECURITY;

-- Select: apenas admin e people (colaborador NÃO pode ver seu histórico diretamente)
CREATE POLICY "compensation_history_select" ON public.compensation_history
  FOR SELECT USING (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  );

-- Manage: apenas admin e people
CREATE POLICY "compensation_history_manage" ON public.compensation_history
  FOR ALL USING (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  ) WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  );

-- Triggers
CREATE TRIGGER update_compensation_history_updated_at
  BEFORE UPDATE ON public.compensation_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_compensation_history_modified_by
  BEFORE INSERT OR UPDATE ON public.compensation_history
  FOR EACH ROW EXECUTE FUNCTION public.set_modified_by();

-- ============================================
-- 5. BONUSES - Bônus e gratificações
-- ============================================
CREATE TYPE public.bonus_type AS ENUM (
  'performance',     -- Bônus por performance
  'signing',         -- Bônus de contratação
  'retention',       -- Bônus de retenção
  'referral',        -- Indicação
  'project',         -- Bônus por projeto
  'holiday',         -- 13º, férias
  'profit_sharing',  -- PLR
  'other'
);

CREATE TYPE public.bonus_status AS ENUM (
  'pending',
  'approved',
  'paid',
  'cancelled'
);

CREATE TABLE public.bonuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  
  -- Detalhes do bônus
  bonus_type public.bonus_type NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  
  -- Período/Contexto
  reference_period TEXT, -- ex: "Q1 2025", "2024"
  effective_date DATE NOT NULL,
  payment_date DATE,
  
  -- Status e aprovação
  status public.bonus_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES public.employees(id),
  approved_at TIMESTAMPTZ,
  
  -- Auditoria
  modified_by UUID,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bonuses_org ON public.bonuses(organization_id);
CREATE INDEX idx_bonuses_employee ON public.bonuses(employee_id);
CREATE INDEX idx_bonuses_status ON public.bonuses(status);
CREATE INDEX idx_bonuses_date ON public.bonuses(effective_date DESC);

-- RLS (muito restritivo - dados sensíveis)
ALTER TABLE public.bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonuses FORCE ROW LEVEL SECURITY;

-- Select: admin, people (funcionário não pode ver diretamente)
CREATE POLICY "bonuses_select" ON public.bonuses
  FOR SELECT USING (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  );

-- Manage: apenas admin e people
CREATE POLICY "bonuses_manage" ON public.bonuses
  FOR ALL USING (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  ) WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  );

-- Triggers
CREATE TRIGGER update_bonuses_updated_at
  BEFORE UPDATE ON public.bonuses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_bonuses_modified_by
  BEFORE INSERT OR UPDATE ON public.bonuses
  FOR EACH ROW EXECUTE FUNCTION public.set_modified_by();

-- ============================================
-- 6. EQUITY - Participação acionária
-- ============================================
CREATE TYPE public.equity_type AS ENUM (
  'stock_option',    -- Opções de compra
  'rsu',             -- Restricted Stock Units
  'phantom',         -- Phantom Shares
  'partnership',     -- Participação societária
  'other'
);

CREATE TYPE public.equity_status AS ENUM (
  'granted',         -- Concedido
  'vesting',         -- Em período de vesting
  'vested',          -- Adquirido (pode exercer)
  'exercised',       -- Exercido
  'expired',         -- Expirado
  'cancelled'        -- Cancelado
);

CREATE TABLE public.equity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  
  -- Detalhes da participação
  equity_type public.equity_type NOT NULL,
  description TEXT,
  units NUMERIC(12,4) NOT NULL, -- Quantidade de ações/opções
  strike_price NUMERIC(12,4), -- Preço de exercício (para options)
  current_value NUMERIC(12,2), -- Valor atual estimado
  currency TEXT NOT NULL DEFAULT 'BRL',
  
  -- Vesting
  grant_date DATE NOT NULL,
  vesting_start_date DATE,
  vesting_end_date DATE,
  vesting_schedule JSONB, -- Ex: {"cliff_months": 12, "vesting_months": 48}
  vested_units NUMERIC(12,4) DEFAULT 0,
  
  -- Status
  status public.equity_status NOT NULL DEFAULT 'granted',
  exercised_at DATE,
  expired_at DATE,
  
  -- Auditoria
  approved_by UUID REFERENCES public.employees(id),
  approved_at TIMESTAMPTZ,
  modified_by UUID,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_equity_org ON public.equity(organization_id);
CREATE INDEX idx_equity_employee ON public.equity(employee_id);
CREATE INDEX idx_equity_status ON public.equity(status);
CREATE INDEX idx_equity_type ON public.equity(equity_type);

-- RLS (muito restritivo - dados sensíveis)
ALTER TABLE public.equity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equity FORCE ROW LEVEL SECURITY;

-- Select: admin e people apenas (dados muito sensíveis)
CREATE POLICY "equity_select" ON public.equity
  FOR SELECT USING (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  );

-- Manage: apenas admin
CREATE POLICY "equity_manage" ON public.equity
  FOR ALL USING (
    has_org_role(auth.uid(), organization_id, 'admin')
  ) WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
  );

-- Triggers
CREATE TRIGGER update_equity_updated_at
  BEFORE UPDATE ON public.equity
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_equity_modified_by
  BEFORE INSERT OR UPDATE ON public.equity
  FOR EACH ROW EXECUTE FUNCTION public.set_modified_by();