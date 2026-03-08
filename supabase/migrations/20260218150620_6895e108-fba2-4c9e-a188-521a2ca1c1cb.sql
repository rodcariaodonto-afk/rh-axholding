
-- 1. Add weekly_hours to employees_contracts
ALTER TABLE public.employees_contracts
ADD COLUMN weekly_hours numeric NOT NULL DEFAULT 44;

-- 2. Create time_entries table
CREATE TABLE public.time_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  clock_in timestamptz NOT NULL DEFAULT now(),
  clock_out timestamptz,
  date date NOT NULL DEFAULT CURRENT_DATE,
  total_minutes integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_entries_select_own" ON public.time_entries
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "time_entries_select_admin_people" ON public.time_entries
  FOR SELECT USING (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  );

CREATE POLICY "time_entries_insert_own" ON public.time_entries
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "time_entries_update_own" ON public.time_entries
  FOR UPDATE USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "time_entries_manage_admin_people" ON public.time_entries
  FOR ALL USING (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  ) WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  );

-- 3. Create time_balance table
CREATE TABLE public.time_balance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  reference_month date NOT NULL,
  expected_minutes integer NOT NULL DEFAULT 0,
  worked_minutes integer NOT NULL DEFAULT 0,
  balance_minutes integer NOT NULL DEFAULT 0,
  overtime_minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, reference_month)
);

ALTER TABLE public.time_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_balance_select_own" ON public.time_balance
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "time_balance_select_admin_people" ON public.time_balance
  FOR SELECT USING (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  );

CREATE POLICY "time_balance_manage_admin_people" ON public.time_balance
  FOR ALL USING (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  ) WITH CHECK (
    has_org_role(auth.uid(), organization_id, 'admin') OR
    has_org_role(auth.uid(), organization_id, 'people')
  );

-- 4. Triggers for updated_at
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_balance_updated_at
  BEFORE UPDATE ON public.time_balance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Add permissions (using correct schema: id, module, action, description, display_order)
INSERT INTO public.permissions (id, module, action, description, display_order)
VALUES
  ('time_tracking.view', 'time_tracking', 'view', 'Visualizar registros de ponto', 1),
  ('time_tracking.manage', 'time_tracking', 'manage', 'Gerenciar registros de ponto', 2)
ON CONFLICT (id) DO NOTHING;
