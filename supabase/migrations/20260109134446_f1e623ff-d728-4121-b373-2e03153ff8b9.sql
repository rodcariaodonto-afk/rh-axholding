-- Inserir dados de contato para colaboradores que faltam
-- Mapeando emails para os novos IDs

-- Luis Honorato (luis.honorato@popcode.com.br)
INSERT INTO employees_contact (user_id, personal_email, mobile_phone, country, zip_code, state, city, street, number)
VALUES ('c2d662f6-aa06-4b7b-a09d-a5ce1f9e5384', 'luismhonorato23@gmail.com', '69992944417', 'BR', '76822138', 'RO', 'Porto Velho', 'Rua Castelo Branco', '4348')
ON CONFLICT (user_id) DO UPDATE SET
  personal_email = EXCLUDED.personal_email,
  mobile_phone = EXCLUDED.mobile_phone;

-- André Lucas (andre.lucas@popcode.com.br)
INSERT INTO employees_contact (user_id, personal_email, mobile_phone, country, zip_code, state, city, street, number)
VALUES ('5f9e9bee-963b-4c62-9e7c-4e1bfe8aca64', 'andrelucassvt99@gmail.com', '91998171965', 'BR', '68.860-000', 'PA', 'Salvaterra', '11 travesse entre 3 e 4 rua ao lado da escola salomão matos', '875')
ON CONFLICT (user_id) DO UPDATE SET
  personal_email = EXCLUDED.personal_email,
  mobile_phone = EXCLUDED.mobile_phone;

-- Bruno Noveli (bruno.noveli@popcode.com.br)
INSERT INTO employees_contact (user_id, personal_email, mobile_phone, country, zip_code, state, city, neighborhood, street, number)
VALUES ('01a636c8-4792-4530-9716-25a66efb16c8', 'brunozuppnoveli@gmail.com', '(55) 17997-4326', 'BR', '15700-184', 'SP', 'Jales', 'Jardim Ana Cristina', 'Rua Canadá', '2809')
ON CONFLICT (user_id) DO UPDATE SET
  personal_email = EXCLUDED.personal_email,
  mobile_phone = EXCLUDED.mobile_phone;

-- Guilherme Araújo (guilherme.araujo@popcode.com.br)
INSERT INTO employees_contact (user_id, personal_email, mobile_phone, country, zip_code, state, city, street, number)
VALUES ('2264f217-73d0-4a91-b925-113c380c07b8', 'guidaraujo14@gmail.com', '11972395770', 'BR', '04.475-350', 'SP', 'São Paulo', 'Rua Paulino Alves Escudeiro', '217')
ON CONFLICT (user_id) DO UPDATE SET
  personal_email = EXCLUDED.personal_email,
  mobile_phone = EXCLUDED.mobile_phone;

-- Gabriel Amat (gabriel.amat@popcode.com.br) - já existe, atualizando
INSERT INTO employees_contact (user_id, personal_email, mobile_phone, country, zip_code, state, city, street, number)
VALUES ('cbde1eb7-22b2-4e1a-add8-1f7a2412123e', 'amat.gabriel0@gmail.com', '18996976752', 'BR', '16013060', 'SP', 'Araçatuba', 'Rua Franklin Leal', '647')
ON CONFLICT (user_id) DO UPDATE SET
  personal_email = EXCLUDED.personal_email,
  mobile_phone = EXCLUDED.mobile_phone;

-- Inserir contratos para colaboradores que faltam

-- Luis Honorato - PJ desde 2025-05-05, salário 5000
INSERT INTO employees_contracts (user_id, contract_type, hire_date, base_salary, is_active)
VALUES ('c2d662f6-aa06-4b7b-a09d-a5ce1f9e5384', 'pj', '2025-05-05', 5000.00, true);

-- André Lucas - CLT desde 2022-02-04, salário 5808
INSERT INTO employees_contracts (user_id, contract_type, hire_date, base_salary, health_insurance, meal_voucher, dental_insurance, is_active)
VALUES ('5f9e9bee-963b-4c62-9e7c-4e1bfe8aca64', 'clt', '2022-02-04', 5808.00, 294.18, 32.00, 13.77, true);

-- Bruno Noveli - PJ desde 2024-12-16, salário 5000
INSERT INTO employees_contracts (user_id, contract_type, hire_date, base_salary, is_active)
VALUES ('01a636c8-4792-4530-9716-25a66efb16c8', 'pj', '2024-12-16', 5000.00, true);

-- Guilherme Araújo - CLT desde 2021-05-10, salário 8200
INSERT INTO employees_contracts (user_id, contract_type, hire_date, base_salary, meal_voucher, is_active)
VALUES ('2264f217-73d0-4a91-b925-113c380c07b8', 'clt', '2021-05-10', 8200.00, 32.00, true);

-- Gabriel Amat - PJ desde 2025-02-17, salário 5000
INSERT INTO employees_contracts (user_id, contract_type, hire_date, base_salary, is_active)
VALUES ('cbde1eb7-22b2-4e1a-add8-1f7a2412123e', 'pj', '2025-02-17', 5000.00, true)
ON CONFLICT DO NOTHING;