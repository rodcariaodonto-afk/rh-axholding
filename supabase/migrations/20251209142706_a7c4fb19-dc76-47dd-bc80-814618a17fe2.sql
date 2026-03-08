-- Tabela para histórico de profiler dos funcionários
CREATE TABLE public.profiler_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  profiler_result_code text NOT NULL,
  profiler_result_detail jsonb NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profiler_history ENABLE ROW LEVEL SECURITY;

-- Admin e People podem ver todo histórico
CREATE POLICY "profiler_history_select_admin_people" ON public.profiler_history
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'people'::app_role));

-- Usuário pode ver seu próprio histórico
CREATE POLICY "profiler_history_select_own" ON public.profiler_history
  FOR SELECT USING (employee_id = auth.uid());

-- Inserção permitida para o próprio usuário ou admin/people
CREATE POLICY "profiler_history_insert" ON public.profiler_history
  FOR INSERT WITH CHECK (
    employee_id = auth.uid() OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'people'::app_role)
  );

-- Índices para consultas rápidas
CREATE INDEX idx_profiler_history_employee_id ON public.profiler_history(employee_id);
CREATE INDEX idx_profiler_history_completed_at ON public.profiler_history(employee_id, completed_at DESC);