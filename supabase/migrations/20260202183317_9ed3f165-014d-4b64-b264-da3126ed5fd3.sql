-- Add number_of_children column to employees table
ALTER TABLE public.employees 
ADD COLUMN number_of_children INTEGER DEFAULT NULL;