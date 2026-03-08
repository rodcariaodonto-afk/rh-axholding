-- Add manager_id column to departments table
ALTER TABLE public.departments 
ADD COLUMN manager_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_departments_manager_id ON public.departments(manager_id);