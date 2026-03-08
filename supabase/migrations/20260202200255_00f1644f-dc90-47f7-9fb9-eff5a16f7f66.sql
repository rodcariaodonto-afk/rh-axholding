-- =====================================================
-- FASE 1: Criar tabelas de competências (Multi-Tenant)
-- =====================================================

-- 1.1 Tabela skill_areas (áreas de competência)
CREATE TABLE skill_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- RLS para skill_areas
ALTER TABLE skill_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_areas FORCE ROW LEVEL SECURITY;

CREATE POLICY "skill_areas_select" ON skill_areas
  FOR SELECT USING (is_same_org(organization_id));

CREATE POLICY "skill_areas_manage" ON skill_areas
  FOR ALL USING (
    is_same_org(organization_id) 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  )
  WITH CHECK (
    is_same_org(organization_id) 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );

CREATE TRIGGER update_skill_areas_updated_at
  BEFORE UPDATE ON skill_areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 1.2 Tabela hard_skills (competências técnicas)
CREATE TABLE hard_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  area_id UUID REFERENCES skill_areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  level_junior INTEGER DEFAULT 2 CHECK (level_junior BETWEEN 1 AND 5),
  level_pleno INTEGER DEFAULT 4 CHECK (level_pleno BETWEEN 1 AND 5),
  level_senior INTEGER DEFAULT 5 CHECK (level_senior BETWEEN 1 AND 5),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para hard_skills
ALTER TABLE hard_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE hard_skills FORCE ROW LEVEL SECURITY;

CREATE POLICY "hard_skills_select" ON hard_skills
  FOR SELECT USING (is_same_org(organization_id));

CREATE POLICY "hard_skills_manage" ON hard_skills
  FOR ALL USING (
    is_same_org(organization_id) 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  )
  WITH CHECK (
    is_same_org(organization_id) 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );

CREATE TRIGGER update_hard_skills_updated_at
  BEFORE UPDATE ON hard_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 1.3 Tabela soft_skills (competências comportamentais)
CREATE TABLE soft_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  level_junior INTEGER DEFAULT 2 CHECK (level_junior BETWEEN 1 AND 5),
  level_pleno INTEGER DEFAULT 3 CHECK (level_pleno BETWEEN 1 AND 5),
  level_senior INTEGER DEFAULT 5 CHECK (level_senior BETWEEN 1 AND 5),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para soft_skills
ALTER TABLE soft_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE soft_skills FORCE ROW LEVEL SECURITY;

CREATE POLICY "soft_skills_select" ON soft_skills
  FOR SELECT USING (is_same_org(organization_id));

CREATE POLICY "soft_skills_manage" ON soft_skills
  FOR ALL USING (
    is_same_org(organization_id) 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  )
  WITH CHECK (
    is_same_org(organization_id) 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
  );

CREATE TRIGGER update_soft_skills_updated_at
  BEFORE UPDATE ON soft_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();