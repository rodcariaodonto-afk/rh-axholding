-- Inserir dados de contato dos colaboradores (mapeados por email)
INSERT INTO employees_contact (user_id, personal_email, mobile_phone, home_phone, emergency_contact_name, emergency_contact_phone, country, zip_code, state, city, neighborhood, street, number, complement) VALUES
-- alex.alves@popcode.com.br
('91f24ee4-0ee1-4966-9694-bfb4189abeb1', 'alexandrinho.alves24@hotmail.com', '(11) 98273-7878', NULL, 'Rose', '(11) 95698-8989', 'BR', '03647-000', 'SP', 'São Paulo', 'Jardim Cotinha', 'Rua Chico Mendes', '53', 'Bloco 3 Apto 61'),
-- arthur.gonzaga@popcode.com.br
('299d2cb5-e2fe-4688-9b84-3a892d3c3505', 'arthuracmg@gmail.com', '(11) 94738-2674', NULL, 'Fabiana Machado', '(11) 98738-2674', 'BR', '04911-170', 'SP', 'São Paulo', 'Interlagos', 'Rua Rubens de Freitas Guimarães', '86', 'Casa 2'),
-- dayse.quirino@popcode.com.br
('5a2ba5b4-c96f-4bea-bad6-cf93643958ca', 'daysequirino@icloud.com', '(11) 98181-3435', NULL, 'Marcos Quirino', '(11) 99866-8655', 'BR', '02434-080', 'SP', 'São Paulo', 'Vila Dionísia', 'Rua Pujal', '270', 'Apto 61'),
-- fabiana.dias@popcode.com.br
('e271ad38-e3f8-4b18-93c8-cc7acf53cc08', 'fabi9820@gmail.com', '(11) 91312-4412', NULL, 'Daniel Oliveira', '(11) 97779-7768', 'BR', '05265-060', 'SP', 'São Paulo', 'Rio Pequeno', 'Rua Comendador Elias Zarzur', '162', 'B23'),
-- felipe.gomes@popcode.com.br
('3d9048af-12d6-4d9f-bdfe-b79183c222db', 'felipe.gomes000@outlook.com', '(11) 98477-7999', NULL, 'Elizabete', '(11) 93287-4909', 'BR', '02867-000', 'SP', 'São Paulo', 'Jardim Joamar', 'Rua São João do Caru', '57', 'casa 2'),
-- hugo.oliveira@popcode.com.br
('b4d03f4c-3638-4726-9085-73b350cac9f4', 'hugosomlia@gmail.com', '(11) 94577-9609', NULL, 'Thais', '(11) 99468-9800', 'BR', '08062-000', 'SP', 'São Paulo', 'Cidade A. E. Carvalho', 'Avenida Professor Pinto de Aguiar', '155', NULL),
-- hugo@popcode.com.br
('4062e1a4-95be-4012-8c2d-e7340603cc9e', 'hugo@popcode.com.br', '(11) 94752-0609', NULL, 'Fabiana', '(11) 97769-8188', 'BR', '05265-060', 'SP', 'São Paulo', 'Rio Pequeno', 'Rua Comendador Elias Zarzur', '162', 'B23'),
-- isaac.oliveira@popcode.com.br
('af149867-edd5-4066-9964-68d072d0484f', 'isaac.oliveira@yahoo.com.br', '(11) 96428-4178', NULL, 'Elizangela', '(11) 97658-2222', 'BR', '02978-330', 'SP', 'São Paulo', 'Vila Souza', 'Rua Marcolino Marquesini', '28', NULL),
-- matheus.costa@popcode.com.br
('bc902ae3-e41d-4044-8edf-5528be4c4867', 'mcmarinho124@gmail.com', '(11) 96428-4178', NULL, 'Marcia', '(11) 97658-2222', 'BR', '03919-020', 'SP', 'São Paulo', 'Vila Carmosina', 'Rua Tobias Monteiro', '67', NULL),
-- michael.correia@popcode.com.br
('d113a45a-2fb0-4399-b18a-e6287bad4290', 'michael.moreira.c@gmail.com', '(11) 99292-9555', NULL, 'Vera', '(11) 98188-6631', 'BR', '08260-001', 'SP', 'São Paulo', 'Cidade Tiradentes', 'Rua Jardim das Camélias', '80', 'Bl 12 ap 32A'),
-- samuel.coutinho@popcode.com.br
('7c4847d3-ad4e-46f4-b592-91944c93e624', 'samuelcouto77@gmail.com', '(19) 99959-7073', NULL, 'Debora Bonfim', '(19) 98803-3299', 'BR', '13050-210', 'SP', 'Campinas', 'Jardim Baronesa', 'Avenida Anchieta', '205', NULL),
-- thiago.martins@popcode.com.br
('4729197a-c836-4c1c-8fe1-35a298213b8d', 'thiagoo.alves22@gmail.com', '(11) 93415-9614', NULL, 'Cláudia', '(11) 93204-0694', 'BR', '08473-750', 'SP', 'São Paulo', 'Guaianases', 'Rua Dores do Rio Preto', '132', NULL),
-- tiago.santos@popcode.com.br
('2a433602-10e7-4c66-a7b3-f9b3caa74d5f', 'tiagosantos3991@gmail.com', '(11) 99539-4949', NULL, 'Renata', '(11) 97653-7008', 'BR', '03573-120', 'SP', 'São Paulo', 'Vila Invernada', 'Rua Dr. Paschoal Imperatriz', '345', NULL);

-- Inserir dados de contrato dos colaboradores (mapeados por email)
INSERT INTO employees_contracts (user_id, contract_type, hire_date, probation_days, contract_start_date, contract_duration_days, contract_end_date, base_salary, health_insurance, dental_insurance, transportation_voucher, meal_voucher, other_benefits, is_active) VALUES
-- alex.alves@popcode.com.br
('91f24ee4-0ee1-4966-9694-bfb4189abeb1', 'clt', '2022-03-07', 90, NULL, NULL, NULL, 1800, 0, 0, 0, 0, 0, true),
-- arthur.gonzaga@popcode.com.br
('299d2cb5-e2fe-4688-9b84-3a892d3c3505', 'clt', '2023-04-10', 90, NULL, NULL, NULL, 5500, 0, 0, 0, 0, 0, true),
-- dayse.quirino@popcode.com.br
('5a2ba5b4-c96f-4bea-bad6-cf93643958ca', 'clt', '2023-08-21', 90, NULL, NULL, NULL, 5200, 0, 0, 0, 0, 0, true),
-- fabiana.dias@popcode.com.br
('e271ad38-e3f8-4b18-93c8-cc7acf53cc08', 'clt', '2014-06-02', 90, NULL, NULL, NULL, 8500, 0, 0, 0, 0, 0, true),
-- felipe.gomes@popcode.com.br
('3d9048af-12d6-4d9f-bdfe-b79183c222db', 'clt', '2022-07-18', 90, NULL, NULL, NULL, 1600, 0, 0, 0, 0, 0, true),
-- hugo.oliveira@popcode.com.br
('b4d03f4c-3638-4726-9085-73b350cac9f4', 'clt', '2022-07-18', 90, NULL, NULL, NULL, 2800, 0, 0, 0, 0, 0, true),
-- hugo@popcode.com.br
('4062e1a4-95be-4012-8c2d-e7340603cc9e', 'pj', '2012-03-01', NULL, NULL, NULL, NULL, 32000, 0, 0, 0, 0, 0, true),
-- isaac.oliveira@popcode.com.br
('af149867-edd5-4066-9964-68d072d0484f', 'clt', '2021-10-18', 90, NULL, NULL, NULL, 4500, 0, 0, 0, 0, 0, true),
-- matheus.costa@popcode.com.br
('bc902ae3-e41d-4044-8edf-5528be4c4867', 'clt', '2023-03-27', 90, NULL, NULL, NULL, 4050, 0, 0, 0, 0, 0, true),
-- michael.correia@popcode.com.br
('d113a45a-2fb0-4399-b18a-e6287bad4290', 'clt', '2024-02-05', 90, NULL, NULL, NULL, 4000, 0, 0, 0, 0, 0, true),
-- samuel.coutinho@popcode.com.br
('7c4847d3-ad4e-46f4-b592-91944c93e624', 'clt', '2024-07-22', 90, NULL, NULL, NULL, 3800, 0, 0, 0, 0, 0, true),
-- thiago.martins@popcode.com.br
('4729197a-c836-4c1c-8fe1-35a298213b8d', 'clt', '2022-07-18', 90, NULL, NULL, NULL, 2100, 0, 0, 0, 0, 0, true),
-- tiago.santos@popcode.com.br
('2a433602-10e7-4c66-a7b3-f9b3caa74d5f', 'clt', '2021-01-11', 90, NULL, NULL, NULL, 4500, 0, 0, 0, 0, 0, true);