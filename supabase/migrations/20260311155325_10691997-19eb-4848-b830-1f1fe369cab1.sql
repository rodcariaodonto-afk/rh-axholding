
-- 1. Add expires_at to employee_documents
ALTER TABLE public.employee_documents ADD COLUMN IF NOT EXISTS expires_at date;

-- 2. Add document_url and signed_at to employees_contracts
ALTER TABLE public.employees_contracts ADD COLUMN IF NOT EXISTS document_url text;
ALTER TABLE public.employees_contracts ADD COLUMN IF NOT EXISTS signed_at timestamptz;

-- 3. Create goals table
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_value numeric(10,2) DEFAULT 100,
  current_value numeric(10,2) DEFAULT 0,
  period text NOT NULL DEFAULT 'Q1-2026',
  status text NOT NULL DEFAULT 'active',
  due_date date,
  created_by uuid REFERENCES public.employees(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org goals" ON public.goals
  FOR SELECT TO authenticated
  USING (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "People can manage org goals" ON public.goals
  FOR ALL TO authenticated
  USING (user_belongs_to_org(auth.uid(), organization_id))
  WITH CHECK (user_belongs_to_org(auth.uid(), organization_id));

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Add missing columns to training_catalog (format, url)
ALTER TABLE public.training_catalog ADD COLUMN IF NOT EXISTS format text DEFAULT 'online';
ALTER TABLE public.training_catalog ADD COLUMN IF NOT EXISTS url text;

-- 5. Add catalog_item_id and request_status to employee_trainings
ALTER TABLE public.employee_trainings ADD COLUMN IF NOT EXISTS catalog_item_id uuid REFERENCES public.training_catalog(id);
ALTER TABLE public.employee_trainings ADD COLUMN IF NOT EXISTS request_status text DEFAULT 'completed';
