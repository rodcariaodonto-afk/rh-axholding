
-- salary_ranges table
CREATE TABLE public.salary_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  seniority TEXT NOT NULL DEFAULT 'mid',
  base_salary_min NUMERIC(12,2) NOT NULL DEFAULT 0,
  base_salary_max NUMERIC(12,2) NOT NULL DEFAULT 0,
  night_shift_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  hazard_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  unhealthy_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  benefits_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.salary_ranges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view salary_ranges" ON public.salary_ranges
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "People+ can manage salary_ranges" ON public.salary_ranges
  FOR ALL TO authenticated
  USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

-- company_documents table
CREATE TABLE public.company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'policy',
  version TEXT NOT NULL DEFAULT '1.0',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view company_documents" ON public.company_documents
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "People+ can manage company_documents" ON public.company_documents
  FOR ALL TO authenticated
  USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );
