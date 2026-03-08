-- =============================================================================
-- CREATE: employee_trainings table with org-scoped RLS (complete fix)
-- =============================================================================
-- This table tracks training records for employees
-- It inherits org context via employee_id → employees.organization_id

CREATE TABLE IF NOT EXISTS public.employee_trainings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  training_type TEXT NOT NULL DEFAULT 'treinamento' CHECK (training_type IN ('treinamento', 'certificacao')),
  description TEXT,
  hours NUMERIC NOT NULL DEFAULT 0,
  completion_date DATE NOT NULL,
  cost NUMERIC,
  sponsor TEXT NOT NULL DEFAULT 'empresa' CHECK (sponsor IN ('empresa', 'colaborador')),
  from_pdi BOOLEAN NOT NULL DEFAULT false,
  pdi_id UUID REFERENCES public.pdis(id) ON DELETE SET NULL,
  pdi_goal_id UUID REFERENCES public.pdi_goals(id) ON DELETE SET NULL,
  generates_points BOOLEAN NOT NULL DEFAULT false,
  career_points NUMERIC,
  certificate_url TEXT,
  created_by UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_trainings FORCE ROW LEVEL SECURITY;

-- CREATE INDEX for better query performance
CREATE INDEX IF NOT EXISTS idx_employee_trainings_employee_id ON public.employee_trainings(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_trainings_completion_date ON public.employee_trainings(completion_date DESC);

-- SELECT: Employee sees own trainings
CREATE POLICY "trainings_select_own" ON public.employee_trainings
  FOR SELECT TO authenticated USING (
    employee_id = auth.uid()
  );

-- SELECT: Admin/People see trainings only for employees in their org
CREATE POLICY "trainings_select_admin_people" ON public.employee_trainings
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid()
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employee_trainings.employee_id
      AND r.slug IN ('admin', 'people')
    )
  );

-- INSERT: Employee can add their own trainings
CREATE POLICY "trainings_insert_own" ON public.employee_trainings
  FOR INSERT TO authenticated WITH CHECK (
    employee_id = auth.uid()
  );

-- INSERT: Admin/People can create trainings only for employees in their org
CREATE POLICY "trainings_insert_admin_people" ON public.employee_trainings
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid()
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employee_trainings.employee_id
      AND r.slug IN ('admin', 'people')
    )
  );

-- UPDATE: Employee can update their own trainings
CREATE POLICY "trainings_update_own" ON public.employee_trainings
  FOR UPDATE TO authenticated USING (
    employee_id = auth.uid()
  );

-- UPDATE: Admin/People can update trainings only for employees in their org
CREATE POLICY "trainings_update_admin_people" ON public.employee_trainings
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid()
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employee_trainings.employee_id
      AND r.slug IN ('admin', 'people')
    )
  );

-- DELETE: Admin/People can delete trainings only for employees in their org
CREATE POLICY "trainings_delete_admin_people" ON public.employee_trainings
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.organization_members om ON om.user_id = auth.uid()
        AND om.organization_id = e.organization_id
      JOIN public.roles r ON r.id = om.role_id
      WHERE e.id = employee_trainings.employee_id
      AND r.slug IN ('admin', 'people')
    )
  );