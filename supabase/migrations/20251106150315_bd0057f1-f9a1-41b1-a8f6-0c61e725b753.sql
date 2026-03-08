-- Remove home_office column from employees_contracts
ALTER TABLE employees_contracts DROP COLUMN IF EXISTS home_office;