-- Inserir contratos faltantes baseado no CSV

-- Gabriel Goncalves - contrato não encontrado no CSV atual, usar dados do CSV antigo
INSERT INTO employees_contracts (user_id, contract_type, hire_date, base_salary, is_active)
SELECT id, 'pj', '2024-06-03', 5000.00, true
FROM employees WHERE email = 'gabriel.goncalves@popcode.com.br'
ON CONFLICT DO NOTHING;

-- Marco Marques - pj, 2024-12-04, R$10.000
INSERT INTO employees_contracts (user_id, contract_type, hire_date, base_salary, is_active)
SELECT id, 'pj', '2024-12-04', 10000.00, true
FROM employees WHERE email = 'marco.marques@popcode.com.br'
ON CONFLICT DO NOTHING;

-- Rafael Silva - pj, 2025-07-10, R$2.500 (do CSV de contratos)
INSERT INTO employees_contracts (user_id, contract_type, hire_date, base_salary, is_active)
SELECT id, 'pj', '2025-07-10', 2500.00, true
FROM employees WHERE email = 'rafael.silva@popcode.com.br'
ON CONFLICT DO NOTHING;

-- Walex Santos - pj, 2025-11-03, R$6.000 (do CSV de contratos)
INSERT INTO employees_contracts (user_id, contract_type, hire_date, base_salary, is_active)
SELECT id, 'pj', '2025-11-03', 6000.00, true
FROM employees WHERE email = 'walex.santos@popcode.com.br'
ON CONFLICT DO NOTHING;