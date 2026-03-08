-- Add dental_insurance column to employees_contracts table
ALTER TABLE public.employees_contracts
ADD COLUMN dental_insurance numeric DEFAULT 0;