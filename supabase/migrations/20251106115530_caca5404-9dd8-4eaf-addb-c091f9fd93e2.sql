-- Adicionar campos de benefícios à tabela employees_contracts
ALTER TABLE public.employees_contracts
ADD COLUMN health_insurance numeric(10,2) DEFAULT 0,
ADD COLUMN transportation_voucher numeric(10,2) DEFAULT 0,
ADD COLUMN meal_voucher numeric(10,2) DEFAULT 0,
ADD COLUMN other_benefits numeric(10,2) DEFAULT 0;

COMMENT ON COLUMN public.employees_contracts.health_insurance IS 'Valor mensal do plano de saúde';
COMMENT ON COLUMN public.employees_contracts.transportation_voucher IS 'Valor mensal do vale transporte';
COMMENT ON COLUMN public.employees_contracts.meal_voucher IS 'Valor mensal do vale refeição';
COMMENT ON COLUMN public.employees_contracts.other_benefits IS 'Valor mensal de outros benefícios';