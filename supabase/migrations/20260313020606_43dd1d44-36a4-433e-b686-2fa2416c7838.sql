
-- SWOT Analysis table
CREATE TABLE public.swot_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  quadrant TEXT NOT NULL CHECK (quadrant IN ('strength', 'weakness', 'opportunity', 'threat')),
  description TEXT NOT NULL,
  impact TEXT CHECK (impact IN ('low', 'medium', 'high')),
  related_action TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.swot_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "swot_select" ON public.swot_analysis
  FOR SELECT TO authenticated
  USING (is_same_org(organization_id));

CREATE POLICY "swot_insert" ON public.swot_analysis
  FOR INSERT TO authenticated
  WITH CHECK (is_same_org(organization_id));

CREATE POLICY "swot_update" ON public.swot_analysis
  FOR UPDATE TO authenticated
  USING (is_same_org(organization_id));

CREATE POLICY "swot_delete" ON public.swot_analysis
  FOR DELETE TO authenticated
  USING (is_same_org(organization_id));

-- Payment Schedule table
CREATE TABLE public.payment_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'pix' CHECK (payment_method IN ('pix', 'transfer', 'deposit', 'cash')),
  payment_date DATE NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_select" ON public.payment_schedule
  FOR SELECT TO authenticated
  USING (is_same_org(organization_id));

CREATE POLICY "payment_insert" ON public.payment_schedule
  FOR INSERT TO authenticated
  WITH CHECK (is_same_org(organization_id));

CREATE POLICY "payment_update" ON public.payment_schedule
  FOR UPDATE TO authenticated
  USING (is_same_org(organization_id));

CREATE POLICY "payment_delete" ON public.payment_schedule
  FOR DELETE TO authenticated
  USING (is_same_org(organization_id));

-- Trigger for updated_at
CREATE TRIGGER swot_updated_at BEFORE UPDATE ON public.swot_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER payment_updated_at BEFORE UPDATE ON public.payment_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
