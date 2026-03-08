-- Tabela para armazenar histórico de alterações de colaboradores
CREATE TABLE employee_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL,
  field_name text NOT NULL,
  field_label text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para queries por employee
CREATE INDEX idx_employee_changes_employee ON employee_changes(employee_id, created_at DESC);

-- RLS
ALTER TABLE employee_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_changes FORCE ROW LEVEL SECURITY;

-- Apenas admin/people podem ver
CREATE POLICY "employee_changes_select" ON employee_changes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = employee_changes.employee_id
    AND is_same_org(e.organization_id)
  )
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
);

-- Apenas admin/people podem inserir
CREATE POLICY "employee_changes_insert" ON employee_changes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = employee_changes.employee_id
    AND is_same_org(e.organization_id)
  )
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
);

-- Apenas admin pode deletar
CREATE POLICY "employee_changes_delete" ON employee_changes
FOR DELETE USING (
  has_role(auth.uid(), 'admin')
);