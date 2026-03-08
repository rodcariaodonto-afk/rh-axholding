-- ============================================
-- FASE 1: Reestruturação de Dados Sensíveis (LGPD)
-- ADR-0007: Separação de Dados PII
-- ============================================

-- 1. Criar tabela employees_demographics (dados LGPD sensíveis)
CREATE TABLE public.employees_demographics (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gender public.gender,
  ethnicity public.ethnicity,
  marital_status public.marital_status,
  birth_date DATE,
  birthplace TEXT,
  nationality TEXT DEFAULT 'BR',
  number_of_children INTEGER DEFAULT 0,
  education_level public.education_level,
  education_course TEXT,
  modified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Criar tabela employees_legal_docs (documentos + bancário)
CREATE TABLE public.employees_legal_docs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cpf TEXT,
  rg TEXT,
  rg_issuer TEXT,
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  bank_account_type TEXT,
  pix_key TEXT,
  modified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS nas novas tabelas
ALTER TABLE public.employees_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees_demographics FORCE ROW LEVEL SECURITY;

ALTER TABLE public.employees_legal_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees_legal_docs FORCE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: employees_demographics
-- ============================================

-- Admin/People: CRUD completo
CREATE POLICY "demographics_select_admin_people" ON public.employees_demographics
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people')
  );

CREATE POLICY "demographics_modify_admin_people" ON public.employees_demographics
  FOR ALL USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people')
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people')
  );

-- Próprio funcionário: SELECT + UPDATE completo
CREATE POLICY "demographics_select_own" ON public.employees_demographics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "demographics_update_own" ON public.employees_demographics
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- RLS POLICIES: employees_legal_docs
-- ============================================

-- Admin/People: CRUD completo
CREATE POLICY "legal_docs_select_admin_people" ON public.employees_legal_docs
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people')
  );

CREATE POLICY "legal_docs_modify_admin_people" ON public.employees_legal_docs
  FOR ALL USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people')
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people')
  );

-- Próprio funcionário: SELECT completo (LGPD Art. 18, II)
CREATE POLICY "legal_docs_select_own" ON public.employees_legal_docs
  FOR SELECT USING (user_id = auth.uid());

-- Próprio funcionário: UPDATE (pode trocar dados bancários/PIX)
CREATE POLICY "legal_docs_update_own" ON public.employees_legal_docs
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- VIEW MASCARADA: Para gestores (LGPD Art. 6, III)
-- ============================================

CREATE OR REPLACE VIEW public.employees_legal_docs_masked
  WITH (security_invoker = true)
AS
SELECT
  ld.user_id,
  CASE WHEN ld.cpf IS NOT NULL
    THEN '***.***.***-' || RIGHT(ld.cpf, 2)
    ELSE NULL
  END AS cpf,
  CASE WHEN ld.rg IS NOT NULL
    THEN '***' || RIGHT(ld.rg, 3)
    ELSE NULL
  END AS rg,
  ld.rg_issuer,
  ld.bank_name,
  CASE WHEN ld.bank_agency IS NOT NULL THEN '****' ELSE NULL END AS bank_agency,
  CASE WHEN ld.bank_account IS NOT NULL
    THEN '****-' || RIGHT(ld.bank_account, 1)
    ELSE NULL
  END AS bank_account,
  ld.bank_account_type,
  CASE WHEN ld.pix_key IS NOT NULL THEN '****' ELSE NULL END AS pix_key,
  ld.created_at,
  ld.updated_at
FROM public.employees_legal_docs ld
WHERE EXISTS (
  SELECT 1 FROM employees e
  WHERE e.id = ld.user_id
    AND e.manager_id = auth.uid()
    AND is_same_org(e.organization_id)
);

-- ============================================
-- TRIGGERS: Atualização automática de timestamps e modified_by
-- ============================================

CREATE TRIGGER update_employees_demographics_updated_at
  BEFORE UPDATE ON public.employees_demographics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_employees_demographics_modified_by
  BEFORE INSERT OR UPDATE ON public.employees_demographics
  FOR EACH ROW
  EXECUTE FUNCTION public.set_modified_by();

CREATE TRIGGER update_employees_legal_docs_updated_at
  BEFORE UPDATE ON public.employees_legal_docs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_employees_legal_docs_modified_by
  BEFORE INSERT OR UPDATE ON public.employees_legal_docs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_modified_by();

-- ============================================
-- MIGRAÇÃO DE DADOS: Copiar dados existentes
-- ============================================

-- Migrar dados demográficos de employees para employees_demographics
INSERT INTO public.employees_demographics (
  user_id, gender, ethnicity, marital_status, birth_date, birthplace,
  nationality, number_of_children, education_level, education_course
)
SELECT 
  id, gender, ethnicity, marital_status, birth_date, birthplace,
  nationality, number_of_children, education_level, education_course
FROM public.employees
WHERE id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Migrar dados de documentos/bancário de employees_contact para employees_legal_docs
INSERT INTO public.employees_legal_docs (
  user_id, cpf, rg, rg_issuer, bank_name, bank_agency,
  bank_account, bank_account_type, pix_key
)
SELECT 
  user_id, cpf, rg, rg_issuer, bank_name, bank_agency,
  bank_account, bank_account_type, pix_key
FROM public.employees_contact
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;