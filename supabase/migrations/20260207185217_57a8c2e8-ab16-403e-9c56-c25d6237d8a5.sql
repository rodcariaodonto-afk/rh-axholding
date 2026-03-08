-- =============================================
-- EVALUATION CYCLES TABLE
-- =============================================
CREATE TABLE evaluation_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  scale_levels INTEGER NOT NULL DEFAULT 5 CHECK (scale_levels IN (4, 5)),
  scale_label_type TEXT NOT NULL DEFAULT 'concordancia',
  custom_labels JSONB DEFAULT '[]',
  evaluation_type TEXT NOT NULL DEFAULT '90' CHECK (evaluation_type IN ('90', '180', '360', 'custom')),
  allow_self_evaluation BOOLEAN DEFAULT false,
  include_self_in_average BOOLEAN DEFAULT false,
  require_competency_comments BOOLEAN DEFAULT false,
  competency_comments_required BOOLEAN DEFAULT false,
  require_general_comments BOOLEAN DEFAULT false,
  admission_cutoff_date DATE,
  contract_types TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- EVALUATION PARTICIPANTS TABLE
-- =============================================
CREATE TABLE evaluation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  evaluated_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL CHECK (relationship IN ('manager', 'peer', 'self', 'direct_report')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cycle_id, evaluator_id, evaluated_id)
);

-- =============================================
-- EVALUATION RESPONSES TABLE
-- =============================================
CREATE TABLE evaluation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES evaluation_participants(id) ON DELETE CASCADE,
  competency_type TEXT NOT NULL CHECK (competency_type IN ('hard_skill', 'soft_skill')),
  competency_id UUID NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_id, competency_type, competency_id)
);

-- =============================================
-- EVALUATION GENERAL COMMENTS TABLE
-- =============================================
CREATE TABLE evaluation_general_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES evaluation_participants(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_id)
);

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE evaluation_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_cycles FORCE ROW LEVEL SECURITY;

ALTER TABLE evaluation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_participants FORCE ROW LEVEL SECURITY;

ALTER TABLE evaluation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_responses FORCE ROW LEVEL SECURITY;

ALTER TABLE evaluation_general_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_general_comments FORCE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR evaluation_cycles
-- =============================================

-- Anyone in the org can view cycles
CREATE POLICY "cycles_select" ON evaluation_cycles
  FOR SELECT USING (is_same_org(organization_id));

-- Only admin/people can manage cycles
CREATE POLICY "cycles_manage" ON evaluation_cycles
  FOR ALL USING (
    is_same_org(organization_id) AND 
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  )
  WITH CHECK (
    is_same_org(organization_id) AND 
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );

-- =============================================
-- RLS POLICIES FOR evaluation_participants
-- =============================================

-- Users can see participants where they are evaluator or evaluated (via cycle org check)
CREATE POLICY "participants_select" ON evaluation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM evaluation_cycles c
      WHERE c.id = evaluation_participants.cycle_id
      AND is_same_org(c.organization_id)
    )
    AND (
      evaluator_id = auth.uid() 
      OR evaluated_id = auth.uid()
      OR has_role(auth.uid(), 'admin') 
      OR has_role(auth.uid(), 'people')
    )
  );

-- Admin/people can manage participants
CREATE POLICY "participants_manage" ON evaluation_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM evaluation_cycles c
      WHERE c.id = evaluation_participants.cycle_id
      AND is_same_org(c.organization_id)
    )
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM evaluation_cycles c
      WHERE c.id = evaluation_participants.cycle_id
      AND is_same_org(c.organization_id)
    )
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );

-- =============================================
-- RLS POLICIES FOR evaluation_responses
-- =============================================

-- Users can see responses they submitted or that evaluate them (admin/people see all)
CREATE POLICY "responses_select" ON evaluation_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM evaluation_participants p
      JOIN evaluation_cycles c ON c.id = p.cycle_id
      WHERE p.id = evaluation_responses.participant_id
      AND is_same_org(c.organization_id)
      AND (
        p.evaluator_id = auth.uid()
        OR p.evaluated_id = auth.uid()
        OR has_role(auth.uid(), 'admin')
        OR has_role(auth.uid(), 'people')
      )
    )
  );

-- Users can insert/update their own responses
CREATE POLICY "responses_insert" ON evaluation_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM evaluation_participants p
      JOIN evaluation_cycles c ON c.id = p.cycle_id
      WHERE p.id = evaluation_responses.participant_id
      AND is_same_org(c.organization_id)
      AND p.evaluator_id = auth.uid()
    )
  );

CREATE POLICY "responses_update" ON evaluation_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM evaluation_participants p
      JOIN evaluation_cycles c ON c.id = p.cycle_id
      WHERE p.id = evaluation_responses.participant_id
      AND is_same_org(c.organization_id)
      AND p.evaluator_id = auth.uid()
    )
  );

-- =============================================
-- RLS POLICIES FOR evaluation_general_comments
-- =============================================

CREATE POLICY "general_comments_select" ON evaluation_general_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM evaluation_participants p
      JOIN evaluation_cycles c ON c.id = p.cycle_id
      WHERE p.id = evaluation_general_comments.participant_id
      AND is_same_org(c.organization_id)
      AND (
        p.evaluator_id = auth.uid()
        OR p.evaluated_id = auth.uid()
        OR has_role(auth.uid(), 'admin')
        OR has_role(auth.uid(), 'people')
      )
    )
  );

CREATE POLICY "general_comments_insert" ON evaluation_general_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM evaluation_participants p
      JOIN evaluation_cycles c ON c.id = p.cycle_id
      WHERE p.id = evaluation_general_comments.participant_id
      AND is_same_org(c.organization_id)
      AND p.evaluator_id = auth.uid()
    )
  );

CREATE POLICY "general_comments_update" ON evaluation_general_comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM evaluation_participants p
      JOIN evaluation_cycles c ON c.id = p.cycle_id
      WHERE p.id = evaluation_general_comments.participant_id
      AND is_same_org(c.organization_id)
      AND p.evaluator_id = auth.uid()
    )
  );

-- =============================================
-- TRIGGER FOR updated_at
-- =============================================
CREATE TRIGGER update_evaluation_cycles_updated_at
  BEFORE UPDATE ON evaluation_cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluation_responses_updated_at
  BEFORE UPDATE ON evaluation_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();