-- Inserir/atualizar contatos faltantes baseado no CSV
-- Bruno Noveli
INSERT INTO employees_contact (user_id, personal_email, mobile_phone, country, zip_code, state, city, neighborhood, street, number)
SELECT id, 'brunozuppnoveli@gmail.com', '17997-4326', 'BR', '15700-184', 'SP', 'Jales', 'Jardim Ana Cristina', 'Rua Canadá', '2809'
FROM employees WHERE email = 'bruno.noveli@popcode.com.br'
ON CONFLICT (user_id) DO UPDATE SET 
  personal_email = EXCLUDED.personal_email,
  mobile_phone = EXCLUDED.mobile_phone,
  zip_code = EXCLUDED.zip_code,
  state = EXCLUDED.state,
  city = EXCLUDED.city,
  neighborhood = EXCLUDED.neighborhood,
  street = EXCLUDED.street,
  number = EXCLUDED.number;

-- Gabriel Goncalves
INSERT INTO employees_contact (user_id, personal_email, mobile_phone, country, zip_code, state, city, street, number)
SELECT id, 'gabriel.goncalves9997@gmail.com', '34984172997', 'BR', '38414-562', 'MG', 'Uberlândia', 'Rua Colônia', '325'
FROM employees WHERE email = 'gabriel.goncalves@popcode.com.br'
ON CONFLICT (user_id) DO UPDATE SET 
  personal_email = EXCLUDED.personal_email,
  mobile_phone = EXCLUDED.mobile_phone,
  zip_code = EXCLUDED.zip_code,
  state = EXCLUDED.state,
  city = EXCLUDED.city,
  street = EXCLUDED.street,
  number = EXCLUDED.number;

-- Guilherme Araújo
INSERT INTO employees_contact (user_id, personal_email, mobile_phone, country, zip_code, state, city, street, number)
SELECT id, 'guidaraujo14@gmail.com', '11972395770', 'BR', '04.475-350', 'SP', 'São Paulo', 'Rua Paulino Alves Escudeiro', '217'
FROM employees WHERE email = 'guilherme.araujo@popcode.com.br'
ON CONFLICT (user_id) DO UPDATE SET 
  personal_email = EXCLUDED.personal_email,
  mobile_phone = EXCLUDED.mobile_phone,
  zip_code = EXCLUDED.zip_code,
  state = EXCLUDED.state,
  city = EXCLUDED.city,
  street = EXCLUDED.street,
  number = EXCLUDED.number;

-- Luis Honorato (já tem contato parcial, completar)
UPDATE employees_contact SET 
  personal_email = 'luismhonorato23@gmail.com'
WHERE user_id = (SELECT id FROM employees WHERE email = 'luis.honorato@popcode.com.br');

-- Marco Marques
INSERT INTO employees_contact (user_id, personal_email, mobile_phone, country, zip_code, state, city, neighborhood, street, number)
SELECT id, 'developer.mmarques@gmail.com', '21 99541-6490', 'BR', '22725-390', 'RJ', 'Rio de Janeiro', 'Taquara', 'Rua Lidio de Sousa', '44'
FROM employees WHERE email = 'marco.marques@popcode.com.br'
ON CONFLICT (user_id) DO UPDATE SET 
  personal_email = EXCLUDED.personal_email,
  mobile_phone = EXCLUDED.mobile_phone,
  zip_code = EXCLUDED.zip_code,
  state = EXCLUDED.state,
  city = EXCLUDED.city,
  neighborhood = EXCLUDED.neighborhood,
  street = EXCLUDED.street,
  number = EXCLUDED.number;

-- Walex Santos
INSERT INTO employees_contact (user_id, personal_email, mobile_phone, country, zip_code, state, city, street, number)
SELECT id, 'walex.souza.santos@gmail.com', '79 99819-5159', 'BR', '49790-000', 'SE', 'Aquidabã', 'Loteamento Jardim Piripiri nº 85 Complemento - Rua D', '85'
FROM employees WHERE email = 'walex.santos@popcode.com.br'
ON CONFLICT (user_id) DO UPDATE SET 
  personal_email = EXCLUDED.personal_email,
  mobile_phone = EXCLUDED.mobile_phone,
  zip_code = EXCLUDED.zip_code,
  state = EXCLUDED.state,
  city = EXCLUDED.city,
  street = EXCLUDED.street,
  number = EXCLUDED.number;

-- Felipe Gomes
INSERT INTO employees_contact (user_id, personal_email, mobile_phone, country, zip_code, state, city, neighborhood, street, number)
SELECT id, 'felipegomes.sm@gmail.com', '79 99136-9802', 'BR', '49032-500', 'SE', 'Aracaju', 'Farolândia', 'Avenida Paulo Silva', '2222'
FROM employees WHERE email = 'felipe.gomes@popcode.com.br'
ON CONFLICT (user_id) DO UPDATE SET 
  personal_email = EXCLUDED.personal_email,
  mobile_phone = EXCLUDED.mobile_phone,
  zip_code = EXCLUDED.zip_code,
  state = EXCLUDED.state,
  city = EXCLUDED.city,
  neighborhood = EXCLUDED.neighborhood,
  street = EXCLUDED.street,
  number = EXCLUDED.number;

-- Gabriel Amat
INSERT INTO employees_contact (user_id, personal_email, mobile_phone, country, zip_code, state, city, street, number)
SELECT id, 'amat.gabriel0@gmail.com', '18996976752', 'BR', '16013060', 'SP', 'Araçatuba', 'Rua Franklin Leal', '647'
FROM employees WHERE email = 'gabriel.amat@popcode.com.br'
ON CONFLICT (user_id) DO UPDATE SET 
  personal_email = EXCLUDED.personal_email,
  mobile_phone = EXCLUDED.mobile_phone,
  zip_code = EXCLUDED.zip_code,
  state = EXCLUDED.state,
  city = EXCLUDED.city,
  street = EXCLUDED.street,
  number = EXCLUDED.number;

-- André Lucas
INSERT INTO employees_contact (user_id, personal_email, mobile_phone, country, zip_code, state, city, street, number)
SELECT id, 'andrelucassvt99@gmail.com', '91998171965', 'BR', '68.860-000', 'PA', 'Salvaterra', '11 travesse entre 3 e 4 rua ao lado da escola salomão matos', '875'
FROM employees WHERE email = 'andre.lucas@popcode.com.br'
ON CONFLICT (user_id) DO UPDATE SET 
  personal_email = EXCLUDED.personal_email,
  mobile_phone = EXCLUDED.mobile_phone,
  zip_code = EXCLUDED.zip_code,
  state = EXCLUDED.state,
  city = EXCLUDED.city,
  street = EXCLUDED.street,
  number = EXCLUDED.number;

-- André Rajo
INSERT INTO employees_contact (user_id, personal_email, mobile_phone, country, zip_code, state, city, neighborhood, street, number)
SELECT id, 'dreurpia@gmail.com', '71 98104-6226', 'BR', '42822-188', 'BA', 'Camaçari', 'Malícia (Abrantes)', 'Rua das Águias', '10'
FROM employees WHERE email = 'andre.rajo@popcode.com.br'
ON CONFLICT (user_id) DO UPDATE SET 
  personal_email = EXCLUDED.personal_email,
  mobile_phone = EXCLUDED.mobile_phone,
  zip_code = EXCLUDED.zip_code,
  state = EXCLUDED.state,
  city = EXCLUDED.city,
  neighborhood = EXCLUDED.neighborhood,
  street = EXCLUDED.street,
  number = EXCLUDED.number;