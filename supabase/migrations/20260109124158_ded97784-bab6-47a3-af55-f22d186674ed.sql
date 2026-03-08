-- Adicionar Foreign Keys faltantes na tabela employees
ALTER TABLE public.employees 
  ADD CONSTRAINT employees_department_id_fkey 
  FOREIGN KEY (department_id) REFERENCES public.departments(id);

ALTER TABLE public.employees 
  ADD CONSTRAINT employees_base_position_id_fkey 
  FOREIGN KEY (base_position_id) REFERENCES public.positions(id);

ALTER TABLE public.employees 
  ADD CONSTRAINT employees_unit_id_fkey 
  FOREIGN KEY (unit_id) REFERENCES public.units(id);

ALTER TABLE public.employees 
  ADD CONSTRAINT employees_manager_id_fkey 
  FOREIGN KEY (manager_id) REFERENCES public.employees(id);