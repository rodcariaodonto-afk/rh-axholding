
-- absenteeism table
CREATE TABLE public.absenteeism (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('absence', 'late', 'medical_certificate', 'inss_leave')),
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  minutes_lost INTEGER DEFAULT 0,
  reason TEXT,
  document_url TEXT,
  document_name TEXT,
  cid_code TEXT,
  doctor_name TEXT,
  inss_start_date DATE,
  inss_end_date DATE,
  inss_protocol TEXT,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'justified', 'unjustified', 'under_review')),
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.absenteeism ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view absenteeism" ON public.absenteeism
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "People+ can manage absenteeism" ON public.absenteeism
  FOR ALL TO authenticated
  USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );

-- termination_details table (complements existing employee termination fields)
CREATE TABLE public.termination_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  notice_type TEXT DEFAULT 'worked' CHECK (notice_type IN ('worked', 'indemnified', 'waived')),
  notice_days INTEGER DEFAULT 30,
  pending_vacation_days INTEGER DEFAULT 0,
  proportional_vacation_days INTEGER DEFAULT 0,
  proportional_13th_months INTEGER DEFAULT 0,
  fgts_balance NUMERIC(12,2) DEFAULT 0,
  fgts_penalty_pct NUMERIC(5,2) DEFAULT 40,
  fgts_penalty_amount NUMERIC(12,2) DEFAULT 0,
  vacation_amount NUMERIC(12,2) DEFAULT 0,
  thirteenth_amount NUMERIC(12,2) DEFAULT 0,
  notice_amount NUMERIC(12,2) DEFAULT 0,
  other_credits NUMERIC(12,2) DEFAULT 0,
  other_debits NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  term_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id)
);

ALTER TABLE public.termination_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view termination_details" ON public.termination_details
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "People+ can manage termination_details" ON public.termination_details
  FOR ALL TO authenticated
  USING (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  )
  WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin')
    OR has_org_role(auth.uid(), organization_id, 'people')
  );
