-- ============================================
-- PoPeople Database Migration
-- DATA: employees
-- ============================================
-- Execute após 03-positions.sql
-- IMPORTANTE: Os IDs aqui são os mesmos de auth.users
-- Se os usuários forem recriados via OAuth, os IDs mudarão!
-- ============================================

-- Desabilitar triggers temporariamente
ALTER TABLE employees DISABLE TRIGGER ALL;

INSERT INTO employees (id, email, full_name, employment_type, status, birth_date, gender, ethnicity, marital_status, education_level, education_course, nationality, birthplace, photo_url, department_id, manager_id, unit_id, base_position_id, position_level_detail, termination_date, termination_reason, termination_decision, termination_cause, termination_cost, created_at, updated_at) VALUES
  -- Thiago Martins (Totem)
  ('d12d56a7-438f-498c-88df-8ed1e884360e', 'thiago.martins@popcode.com.br', 'Thiago Silva Martins', 'full_time', 'active', '2024-04-22', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '32d000e2-355d-49c3-80d9-2f8ed1a6c678', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', '9e60dcc2-8e35-4784-be01-d0ddf88deac1', 'pleno_i', NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-10-08 20:08:30.536942+00'),
  
  -- Michael Correia (Likeappro)
  ('011c8b45-5aa3-42f2-9bf3-79bc4a2d97c8', 'michael.correia@popcode.com.br', 'Michael Lucas Silva Correia', 'full_time', 'active', '1997-04-22', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, 'c1a5c7d4-42eb-40bb-bd7c-4ceddd448ae1', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'c1ab8793-329a-4769-a425-cb863eae2a5b', 'pleno_i', NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-12-09 14:36:00.385645+00'),
  
  -- Hugo Oliveira (Banese Card)
  ('d9f739ea-2f7f-44c2-9446-4ae92c83a221', 'hugo.oliveira@popcode.com.br', 'Hugo Gomes de Oliveira', 'full_time', 'active', '2005-07-07', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '115184d4-4ae9-482d-980a-6eaf8edf66ac', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'junior_ii', NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-10-08 13:48:33.594644+00'),
  
  -- Arthur Gonzaga (Banese)
  ('84170044-a578-40ed-8123-f936556bbba6', 'arthur.gonzaga@popcode.com.br', 'Arthur Gonzaga Ribeiro', 'full_time', 'active', '2002-02-10', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '55dd219e-c732-4a73-ac0c-4fd35eb69529', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', '2074d984-78f2-46e0-9c1c-73821b44b25e', 'senior_iii', NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-10-08 13:15:55.825052+00'),
  
  -- Dayse Quirino (People)
  ('9131c6b1-fabf-44e6-959f-5f8e7dd0761b', 'dayse.quirino@popcode.com.br', 'Dayse Ane Quirino', 'full_time', 'active', '1986-05-05', 'female', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '5a92c351-391b-4369-a1ed-7307b28d2a61', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e5aa0b09-3e2d-40a4-89ea-b8c93319bc8f', 'pleno_i', NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-10-08 13:19:38.80349+00'),
  
  -- Maria Tupich (Banese)
  ('e40fb30c-33f4-49f3-a290-7f6ff81e680f', 'maria.tupich@popcode.com.br', 'Maria Eduarda Tupich', 'full_time', 'active', '1997-11-10', 'female', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '55dd219e-c732-4a73-ac0c-4fd35eb69529', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_i', NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-10-08 20:30:52.589461+00'),
  
  -- Renan Lins (Banese - terminated)
  ('1defaf3d-4852-437d-b7e2-fb261601eea1', 'renan.lins@popcode.com.br', 'Renan de Freitas Lins', 'full_time', 'terminated', '1995-11-22', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '55dd219e-c732-4a73-ac0c-4fd35eb69529', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_i', '2025-10-31', 'pedido_demissao', 'pediu_pra_sair', 'outros', 0, '2025-10-06 20:49:06.744893+00', '2025-11-07 00:30:15.411172+00'),
  
  -- Brenda Mendes (People)
  ('4275f744-c442-4805-a7a9-05c7df646869', 'brenda.mendes@popcode.com.br', 'Brenda Mendes', 'full_time', 'active', '1997-05-22', 'female', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '5a92c351-391b-4369-a1ed-7307b28d2a61', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e5aa0b09-3e2d-40a4-89ea-b8c93319bc8f', 'pleno_i', NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-10-08 20:40:44.69401+00'),
  
  -- Hugo (Diretoria - Admin)
  ('30cd17fc-e20c-4945-98c0-a29cd1573244', 'hugo@popcode.com.br', 'Hugo Maciel Mendes de Souza', 'full_time', 'active', '1998-03-17', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '932576a4-0f8f-4475-a122-6046594053f7', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', '6b397e3a-d1ec-4f8b-b4fa-e27dcb940fa9', NULL, NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-12-22 13:27:09.251054+00'),
  
  -- Gabriel Amat
  ('fec381fe-0fd7-4bbc-871f-02cf0e8b0695', 'gabriel.amat@popcode.com.br', 'Gabriel Amat Ferreira', 'full_time', 'active', '1998-03-29', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '55dd219e-c732-4a73-ac0c-4fd35eb69529', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_i', NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-10-08 19:13:33.188916+00'),
  
  -- Gabriel Aragão
  ('459a1027-a0e6-40be-b22e-8dfadee4891c', 'gabriel.aragao@popcode.com.br', 'Gabriel Aragão de Souza', 'full_time', 'active', '1991-02-05', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '55dd219e-c732-4a73-ac0c-4fd35eb69529', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_ii', NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-11-06 19:32:49.093085+00'),
  
  -- Gabriel Gonçalves
  ('1196530f-992a-4c38-bdff-da522a4b34a3', 'gabriel.goncalves@popcode.com.br', 'Gabriel Brandão Gonçalves', 'full_time', 'active', '1997-01-24', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '115184d4-4ae9-482d-980a-6eaf8edf66ac', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_i', NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-11-06 19:35:10.496286+00'),
  
  -- Guilherme Araújo
  ('5cb2c5ce-48be-481a-9e5d-86e2c6f71860', 'guilherme.araujo@popcode.com.br', 'Guilherme de Araújo', 'full_time', 'active', '1997-10-12', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '55dd219e-c732-4a73-ac0c-4fd35eb69529', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_ii', NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-10-08 19:22:27.814315+00'),
  
  -- Jean Nascimento
  ('a6c5bbf6-3cf9-42d0-ba28-3550448c7e43', 'jean.nascimento@popcode.com.br', 'Jean Carlos Chagas Nascimento', 'full_time', 'active', '1994-11-10', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '115184d4-4ae9-482d-980a-6eaf8edf66ac', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'senior_i', NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-11-06 19:40:01.310419+00'),
  
  -- Luis Honorato
  ('f8cec1a2-6d17-49eb-8899-419037de4f15', 'luis.honorato@popcode.com.br', 'Luís Gustavo Moreira Honorato', 'full_time', 'active', '1995-02-10', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '55dd219e-c732-4a73-ac0c-4fd35eb69529', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_i', NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-10-08 18:55:41.167839+00'),
  
  -- Matheus Carvalho
  ('394bd218-9e55-4d7f-82b2-6fdb0e1afdc9', 'matheus.carvalho@popcode.com.br', 'Matheus de Jesus Souza Carvalho', 'full_time', 'active', '1996-03-28', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '2f0c3bda-1281-415a-bea1-e6a6ed5f39fb', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_i', NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-10-08 19:03:09.152251+00'),
  
  -- Pedro Mota
  ('78d448f5-b9b4-441b-8203-5c8ad9bc2f62', 'pedro.mota@popcode.com.br', 'Pedro Ana Dantas Mota', 'full_time', 'active', '2006-08-01', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '5a92c351-391b-4369-a1ed-7307b28d2a61', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'a5e79dd2-8fe7-4f8f-825d-5d9fd3a3e6b7', NULL, NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-11-06 19:20:42.829115+00'),
  
  -- William Bonfim
  ('9f60f041-e911-4af8-aed9-741b6a820104', 'william.bonfim@popcode.com.br', 'William Romão Bonfim', 'full_time', 'active', '1991-12-03', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '115184d4-4ae9-482d-980a-6eaf8edf66ac', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'senior_i', NULL, NULL, NULL, NULL, 0, '2025-10-06 20:49:06.744893+00', '2025-10-08 19:08:40.660447+00'),
  
  -- Adriel Borges (Dealer)
  ('d1564462-3881-4826-8145-ae055ab75467', 'adriel.borges@popcode.com.br', 'Adriel Santos Borges', 'full_time', 'active', '1995-08-18', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, 'b9dd653d-9988-4ba6-87a9-e5b04d218fe0', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', '2074d984-78f2-46e0-9c1c-73821b44b25e', 'senior_iii', NULL, NULL, NULL, NULL, 0, '2025-10-07 18:05:13.604691+00', '2025-10-08 13:15:40.396308+00'),
  
  -- Henrique Boeri
  ('53bcf3b6-a530-4f12-9112-d6850ea09dd2', 'henrique.boeri@popcode.com.br', 'Henrique da Silva Boeri', 'full_time', 'active', '1993-09-14', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, 'b9dd653d-9988-4ba6-87a9-e5b04d218fe0', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', '2074d984-78f2-46e0-9c1c-73821b44b25e', 'senior_iii', NULL, NULL, NULL, NULL, 0, '2025-10-08 13:15:56.285096+00', '2025-10-08 13:20:21.877088+00'),
  
  -- Nathan Salustiano (Banese Card)
  ('1d464459-7f03-4565-9b69-335286001c6e', 'nathan.salustiano@popcode.com.br', 'Nathan Emir Nery Salustiano', 'full_time', 'active', '1998-04-19', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '115184d4-4ae9-482d-980a-6eaf8edf66ac', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_ii', NULL, NULL, NULL, NULL, 0, '2025-10-08 13:15:56.285096+00', '2025-10-08 13:15:56.285096+00'),
  
  -- Ruan Xavier (Open Finance)
  ('d12e0e7e-c7c9-49ee-928f-6be8e9c7e831', 'ruan.xavier@popcode.com.br', 'Ruan Coêlho Xavier', 'full_time', 'active', '1999-06-21', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '48f9c11a-2899-4c2f-8c17-0a47a1815b6b', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_ii', NULL, NULL, NULL, NULL, 0, '2025-10-08 13:25:49.628478+00', '2025-10-08 13:28:02.411291+00'),
  
  -- Thiago Barbosa (Desty)
  ('ec1ae9a8-b399-4d9e-be94-f39f22a4dd2b', 'thiago.barbosa@popcode.com.br', 'Thiago Santos Barbosa', 'full_time', 'active', '1994-01-09', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '97601f70-680b-432d-989c-97f8ad494705', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', '2074d984-78f2-46e0-9c1c-73821b44b25e', 'senior_i', NULL, NULL, NULL, NULL, 0, '2025-10-08 13:25:49.628478+00', '2025-10-08 13:29:00.629413+00'),
  
  -- Jefferson Nascimento (Likeappro)
  ('a04ebb0d-05ed-48ed-a1df-1c91f2a4c86b', 'jefferson.nascimento@popcode.com.br', 'Jefferson Ferreira do Nascimento', 'full_time', 'active', '1988-12-02', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, 'c1a5c7d4-42eb-40bb-bd7c-4ceddd448ae1', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'senior_i', NULL, NULL, NULL, NULL, 0, '2025-10-08 13:31:31.119119+00', '2025-11-06 19:38:09.346679+00'),
  
  -- Higor Schimidt (Banese Card)
  ('ad1daba6-2d22-4cd2-926a-e89c97b4b02e', 'higor.schimidt@popcode.com.br', 'Higor Schimidt de Souza', 'full_time', 'active', '1997-05-18', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '115184d4-4ae9-482d-980a-6eaf8edf66ac', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_i', NULL, NULL, NULL, NULL, 0, '2025-10-08 13:36:35.181706+00', '2025-11-06 19:36:24.704547+00'),
  
  -- Ryan Martins (Mulvi Pay - terminated)
  ('f0f13aef-1d84-483a-bdae-bba1f63dfea2', 'ryan.martins@popcode.com.br', 'Ryan Borges Martins', 'full_time', 'terminated', '1998-09-04', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '2f0c3bda-1281-415a-bea1-e6a6ed5f39fb', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_i', '2025-11-18', 'pedido_demissao', 'pediu_pra_sair', 'recebimento_proposta', 0, '2025-10-08 13:40:20.217206+00', '2025-11-06 19:17:28.422108+00'),
  
  -- Evandro Medeiros (Open Finance)
  ('8a3f1a4a-e6ad-4eea-bb65-1e4bb72f0c13', 'evandro.medeiros@popcode.com.br', 'Evandro Medeiros de Souza', 'full_time', 'active', '1993-03-18', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '48f9c11a-2899-4c2f-8c17-0a47a1815b6b', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_ii', NULL, NULL, NULL, NULL, 0, '2025-10-08 13:45:19.631695+00', '2025-10-08 13:49:26.18318+00'),
  
  -- Eduardo Silveira (Dealer)
  ('0690be72-3dc0-4337-9758-7b75a57d5595', 'eduardo.silveira@popcode.com.br', 'Eduardo Adriano Silveira', 'full_time', 'active', '1997-04-14', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, 'b9dd653d-9988-4ba6-87a9-e5b04d218fe0', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_ii', NULL, NULL, NULL, NULL, 0, '2025-10-08 13:54:03.109855+00', '2025-10-08 13:58:00.139844+00'),
  
  -- Davi Leandro (Banese Card)
  ('60177558-bb01-4948-afee-822ec553690a', 'davi.leandro@popcode.com.br', 'Davi Leandro Fernandes Silva', 'full_time', 'active', '2001-06-11', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '115184d4-4ae9-482d-980a-6eaf8edf66ac', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_i', NULL, NULL, NULL, NULL, 0, '2025-10-08 14:04:09.389312+00', '2025-12-11 15:51:27.925917+00'),
  
  -- Kleber Silva (Design)
  ('9b1c0ab5-8c8d-47cd-a1f3-d19ed05f89c1', 'kleber.silva@popcode.com.br', 'Kleber Silva Santos', 'full_time', 'active', '1989-09-28', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '45348de1-fb94-461a-90f3-87f53e3c8ef0', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'ecfdb7a0-8f99-4f44-b61c-e5df1f10bc13', 'pleno_i', NULL, NULL, NULL, NULL, 0, '2025-10-08 20:36:29.055547+00', '2025-10-08 20:41:21.306802+00'),
  
  -- Richard Souza (Desty)
  ('dc3e4c7e-21e7-483b-aa94-b6eaa1c7de53', 'richard.souza@popcode.com.br', 'Richard Barros de Souza', 'full_time', 'active', '1994-08-08', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, '97601f70-680b-432d-989c-97f8ad494705', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'senior_i', NULL, NULL, NULL, NULL, 0, '2025-10-08 20:45:26.606959+00', '2025-10-08 20:48:09.287851+00'),
  
  -- Vitor Frizio (DevAdmin - teste)
  ('83887901-e41e-4d91-a953-7e7619f3eae5', 'vitoranfrizio@proton.me', 'Vitor Anfrisio', 'full_time', 'active', NULL, NULL, NULL, NULL, NULL, NULL, 'BR', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2025-12-05 14:14:55.124813+00', '2025-12-09 14:53:38.879626+00'),
  
  -- Hugo Teste (DevAdmin)
  ('fd6a17ff-fc72-416e-ba98-25faae0fd07d', 'hugomacielsouza@gmail.com', 'Hugo Teste', 'full_time', 'active', '2014-07-14', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, 'b9dd653d-9988-4ba6-87a9-e5b04d218fe0', NULL, NULL, 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_i', NULL, NULL, NULL, NULL, 0, '2025-12-09 17:21:15.406474+00', '2025-12-09 17:25:03.665287+00'),
  
  -- Rafael Alves (Dealer)
  ('4adced16-6990-4eb7-ae09-7e82fdfae00e', 'rafael.alves@popcode.com.br', 'Rafael Alves dos Santos', 'full_time', 'active', '1998-11-21', 'male', NULL, NULL, NULL, NULL, 'BR', NULL, NULL, 'b9dd653d-9988-4ba6-87a9-e5b04d218fe0', NULL, '4898992a-e127-470f-a32e-5fabdd2bcac8', 'e1fdd998-7ce4-478b-a52a-48734a54d9f9', 'pleno_i', NULL, NULL, NULL, NULL, 0, '2025-11-20 14:41:32.000000+00', '2025-11-20 14:41:32.000000+00');

-- Reabilitar triggers
ALTER TABLE employees ENABLE TRIGGER ALL;

-- ============================================
-- FIM DOS DADOS DE EMPLOYEES
-- ============================================
