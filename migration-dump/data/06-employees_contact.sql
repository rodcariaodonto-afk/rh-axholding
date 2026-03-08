-- ============================================
-- PoPeople Database Migration
-- DATA: employees_contact
-- ============================================
-- Execute após 04-employees.sql
-- ============================================

INSERT INTO employees_contact (user_id, personal_email, mobile_phone, home_phone, emergency_contact_name, emergency_contact_phone, country, zip_code, state, city, neighborhood, street, number, complement, created_at, updated_at) VALUES
  -- Maria Tupich
  ('e40fb30c-33f4-49f3-a290-7f6ff81e680f', 'mariatupich@gmail.com', '(51) 98134-9601', '', '', '', 'BR', '93210-230', 'RS', 'Sapucaia do Sul', 'Dihel', 'Travessa São Carlos', '69', '', '2025-10-07 11:03:56.127475+00', '2025-10-08 18:58:05.371622+00'),
  
  -- Dayse Quirino
  ('9131c6b1-fabf-44e6-959f-5f8e7dd0761b', 'daysequirino.rh@gmail.com', '79999822388', '', '', '', 'BR', '49045460', 'SE', 'Aracaju', '', 'Rua Manoel Donizete Vieira', '99', '', '2025-10-07 11:03:56.127475+00', '2025-10-08 13:19:41.142714+00'),
  
  -- Pedro Mota
  ('78d448f5-b9b4-441b-8203-5c8ad9bc2f62', 'ana_dantas_mota@hotmail.com', '(92) 98150-0372', '', '', '', 'BR', '49.037-330', 'Sergipe', 'Aracaju', '', 'Rua Jordão De Oliveira', '246', '', '2025-10-07 11:03:56.127475+00', '2025-10-07 18:40:08.474974+00'),
  
  -- Luis Honorato
  ('f8cec1a2-6d17-49eb-8899-419037de4f15', 'luismhonorato23@gmail.com', '69992944417', '', '', '', 'BR', '76822138', 'RO', 'Porto Velho', '', 'Rua Castelo Branco', '4348', '', '2025-10-07 11:03:56.127475+00', '2025-10-08 14:51:05.637093+00'),
  
  -- Michael Correia
  ('011c8b45-5aa3-42f2-9bf3-79bc4a2d97c8', 'lucasscorreia1@gmail.com', '(79) 99806-0667', '', '', '', 'BR', '49045-706', 'SE', 'Aracaju', 'Luzia', 'Rua Palmira Ramos Teles', '1600', '', '2025-10-07 11:03:56.127475+00', '2025-10-08 19:05:22.002673+00'),
  
  -- Matheus Carvalho
  ('394bd218-9e55-4d7f-82b2-6fdb0e1afdc9', 'matheus.jsc@outlook.com', '(75) 99192-0859', '', '', '', 'BR', '41720-040', 'BA', 'Salvador', 'Imbuí', 'Avenida Jorge Amado', '214', '', '2025-10-07 11:03:56.127475+00', '2025-10-08 19:02:35.150936+00'),
  
  -- Renan Lins
  ('1defaf3d-4852-437d-b7e2-fb261601eea1', 'rflins05@gmail.com', '(81) 99649-2489', '', '', '', 'BR', '54310-275', 'PE', 'Jaboatão dos Guararapes', 'Prazeres', 'Rua Professor Severino Tolentino', '329', '', '2025-10-07 11:03:56.127475+00', '2025-11-07 00:30:15.411172+00'),
  
  -- Arthur Gonzaga
  ('84170044-a578-40ed-8123-f936556bbba6', 'arthurgonzagaxyz@gmail.com', '8393833323', '', '', '', 'BR', '58.475-000', 'PB', 'Queimadas', '', 'Rua Antonio Alves Monteiro', '118', '', '2025-10-07 11:03:56.127475+00', '2025-10-07 19:40:09.713278+00'),
  
  -- Gabriel Amat
  ('fec381fe-0fd7-4bbc-871f-02cf0e8b0695', 'amat.gabriel0@gmail.com', '18996976752', '', '', '', 'BR', '16013060', 'SP', 'Araçatuba', '', 'Rua Franklin Leal', '647', '', '2025-10-07 11:03:56.127475+00', '2025-10-07 19:47:45.216473+00'),
  
  -- Gabriel Aragão
  ('459a1027-a0e6-40be-b22e-8dfadee4891c', 'eng.gabrielaragao@gmail.com', '79996018210', '', '', '', 'BR', '49045280', 'SE', 'Aracaju', '', 'Avenida Gonçalo Rolemberg Leite', '2143', '', '2025-10-07 11:03:56.127475+00', '2025-10-07 19:50:20.518714+00'),
  
  -- Gabriel Gonçalves
  ('1196530f-992a-4c38-bdff-da522a4b34a3', 'gabriel.goncalves9997@gmail.com', '34984172997', '', '', '', 'BR', '38414-562', 'MG', 'Uberlândia', '', 'Rua Colônia', '325', '', '2025-10-07 11:03:56.127475+00', '2025-10-07 19:52:50.294473+00'),
  
  -- Guilherme Araújo
  ('5cb2c5ce-48be-481a-9e5d-86e2c6f71860', 'guidaraujo14@gmail.com', '11972395770', '', '', '', 'BR', '04.475-350', 'SP', 'São Paulo', '', 'Rua Paulino Alves Escudeiro', '217', '', '2025-10-07 11:03:56.127475+00', '2025-10-07 19:54:34.774397+00'),
  
  -- Jean Nascimento
  ('a6c5bbf6-3cf9-42d0-ba28-3550448c7e43', '', '799998121151', '', '', '', 'BR', '49506-145', 'SE', 'Lagarto', '', 'Rua Coronel Souza Freire', '171', '', '2025-10-07 11:03:56.127475+00', '2025-10-07 20:01:07.549082+00'),
  
  -- Hugo (Admin)
  ('30cd17fc-e20c-4945-98c0-a29cd1573244', 'hugomacielsouza@gmail.com', '79999461998', '', '', '', 'BR', '01310-100', 'SP', 'São Paulo', 'Bela Vista', 'Avenida Paulista', '1578', '', '2025-10-07 11:03:56.127475+00', '2025-10-08 14:26:05.831508+00'),
  
  -- Brenda Mendes
  ('4275f744-c442-4805-a7a9-05c7df646869', 'brendamendess22@gmail.com', '(79) 98104-6096', '', '', '', 'BR', '49025-240', 'SE', 'Aracaju', 'Atalaia', 'Rua Projetada', '206', '', '2025-10-07 11:03:56.127475+00', '2025-10-08 20:40:44.69401+00'),
  
  -- William Bonfim
  ('9f60f041-e911-4af8-aed9-741b6a820104', 'williamromaobonfim@gmail.com', '(81) 99737-9474', '', '', '', 'BR', '55028-060', 'PE', 'Caruaru', 'Universitário', 'Rua Projetada', '38', '', '2025-10-07 11:03:56.127475+00', '2025-10-08 19:08:43.057131+00'),
  
  -- Adriel Borges
  ('d1564462-3881-4826-8145-ae055ab75467', 'adrielsborges@gmail.com', '(79) 99994-9614', '', '', '', 'BR', '49030-210', 'SE', 'Aracaju', 'Luzia', 'Rua José de Faro Rollemberg', '650', '', '2025-10-08 13:06:38.614916+00', '2025-10-08 13:06:46.009399+00'),
  
  -- Nathan Salustiano
  ('1d464459-7f03-4565-9b69-335286001c6e', 'nathansalustiano00@gmail.com', '79999195779', '', '', '', 'BR', '49100-000', 'SE', 'São Cristóvão', '', 'Rua José Azevedo Guimarães', '51', '', '2025-10-08 13:16:12.379665+00', '2025-10-08 13:16:12.379665+00'),
  
  -- Henrique Boeri
  ('53bcf3b6-a530-4f12-9112-d6850ea09dd2', 'henriquedasilvaboeri@gmail.com', '35988279689', '', '', '', 'BR', '37560-000', 'MG', 'Silvianópolis', '', 'Rua Expedicionário, Joaquim Siqueira', '29', '', '2025-10-08 13:20:50.844538+00', '2025-10-08 13:20:50.844538+00'),
  
  -- Ruan Xavier
  ('d12e0e7e-c7c9-49ee-928f-6be8e9c7e831', 'ruancoelhox@gmail.com', '84991316046', '', '', '', 'BR', '59090-010', 'RN', 'Natal', '', 'Avenida das Alagoas', '1986', '', '2025-10-08 13:27:47.648254+00', '2025-10-08 13:27:47.648254+00'),
  
  -- Thiago Barbosa
  ('ec1ae9a8-b399-4d9e-be94-f39f22a4dd2b', 'thiago.xwx@hotmail.com', '79996313091', '', '', '', 'BR', '49090-500', 'SE', 'Aracaju', '', 'Rua Estância', '1191', '', '2025-10-08 13:29:39.700377+00', '2025-10-08 13:29:39.700377+00'),
  
  -- Jefferson Nascimento
  ('a04ebb0d-05ed-48ed-a1df-1c91f2a4c86b', 'jeffersonnascimentof@gmail.com', '79988052040', '', '', '', 'BR', '49100-000', 'SE', 'São Cristóvão', '', 'Rua Sete de Setembro', '81', '', '2025-10-08 13:32:02.117765+00', '2025-10-08 13:32:02.117765+00'),
  
  -- Higor Schimidt
  ('ad1daba6-2d22-4cd2-926a-e89c97b4b02e', 'higorschimidt@gmail.com', '(47) 99650-3847', '', '', '', 'BR', '89032-180', 'SC', 'Blumenau', '', 'Rua Dois de Setembro', '2147', '', '2025-10-08 13:37:19.099958+00', '2025-10-08 13:37:23.587193+00'),
  
  -- Ryan Martins
  ('f0f13aef-1d84-483a-bdae-bba1f63dfea2', 'ryanbmartins@icloud.com', '31993992406', '', '', '', 'BR', '35051-360', 'MG', 'Governador Valadares', '', 'Rua General Osório', '53', '', '2025-10-08 13:41:00.355766+00', '2025-10-08 13:41:00.355766+00'),
  
  -- Evandro Medeiros
  ('8a3f1a4a-e6ad-4eea-bb65-1e4bb72f0c13', 'evandromedeiros47@gmail.com', '7996141131', '', '', '', 'BR', '49030-340', 'SE', 'Aracaju', '', 'Rua Silveira Martins', '200', '', '2025-10-08 13:45:55.911499+00', '2025-10-08 13:47:36.619779+00'),
  
  -- Eduardo Silveira
  ('0690be72-3dc0-4337-9758-7b75a57d5595', 'edu.silveira90@hotmail.com', '(21) 98319-5710', '', '', '', 'BR', '26041-080', 'RJ', 'Nova Iguaçu', '', 'Rua General Marquês Porto', '1140', '', '2025-10-08 13:54:42.858206+00', '2025-10-08 13:57:22.089682+00'),
  
  -- Davi Leandro
  ('60177558-bb01-4948-afee-822ec553690a', 'davi.leandrofernandes@outlook.com', '34992379016', '', '', '', 'BR', '38401-018', 'MG', 'Uberlândia', '', 'Rua Carmésia', '27', '', '2025-10-08 14:04:42.139497+00', '2025-10-08 14:04:42.139497+00'),
  
  -- Thiago Martins
  ('d12d56a7-438f-498c-88df-8ed1e884360e', 'thiago01silvamartins@gmail.com', '62991085610', '', '', '', 'BR', '74705-040', 'GO', 'Goiânia', '', 'Rua S 3', '50', '', '2025-10-08 20:08:28.866376+00', '2025-10-08 20:08:28.866376+00'),
  
  -- Hugo Oliveira
  ('d9f739ea-2f7f-44c2-9446-4ae92c83a221', 'hugo.gomeso90@gmail.com', '11989001413', '', '', '', 'BR', '08250-500', 'SP', 'São Paulo', '', 'Rua Padre Cícero', '40', '', '2025-10-08 13:48:31.923694+00', '2025-10-08 13:48:31.923694+00'),
  
  -- Kleber Silva
  ('9b1c0ab5-8c8d-47cd-a1f3-d19ed05f89c1', 'kleberr25@gmail.com', '(79) 99907-0800', '', '', '', 'BR', '49035-035', 'SE', 'Aracaju', '', 'Travessa Presidente José Linhares', '179', '', '2025-10-08 20:36:47.403015+00', '2025-10-08 20:41:21.306802+00'),
  
  -- Richard Souza
  ('dc3e4c7e-21e7-483b-aa94-b6eaa1c7de53', 'richardbs18@gmail.com', '75982181044', '', '', '', 'BR', '44062-056', 'BA', 'Feira de Santana', '', 'Rua Dione Ferreira', '44', '', '2025-10-08 20:45:45.618847+00', '2025-10-08 20:45:45.618847+00');

-- ============================================
-- FIM DOS DADOS DE EMPLOYEES_CONTACT
-- ============================================
