
-- PDI Action Plans table
CREATE TABLE public.pdi_action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdi_id UUID NOT NULL REFERENCES public.pdis(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.pdi_goals(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  responsible TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pdi_action_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view action plans" ON public.pdi_action_plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert action plans" ON public.pdi_action_plans
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update action plans" ON public.pdi_action_plans
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete action plans" ON public.pdi_action_plans
  FOR DELETE TO authenticated USING (true);

-- PDI Version History table
CREATE TABLE public.pdi_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdi_id UUID NOT NULL REFERENCES public.pdis(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL,
  changed_by UUID NOT NULL,
  change_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pdi_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pdi versions" ON public.pdi_versions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert pdi versions" ON public.pdi_versions
  FOR INSERT TO authenticated WITH CHECK (true);

-- Add approval workflow columns to pdis
ALTER TABLE public.pdis 
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS submitted_for_approval_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.employees(id);

-- Add return/completion fields to time_off_requests
ALTER TABLE public.time_off_requests 
  ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS return_confirmed_by UUID,
  ADD COLUMN IF NOT EXISTS return_notes TEXT;
