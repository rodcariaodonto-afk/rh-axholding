-- ============================================
-- PoPeople Database Migration
-- DATA: organization_members
-- ============================================
-- Execute após 04-employees.sql e 01-organizations.sql
-- ============================================

INSERT INTO organization_members (id, organization_id, user_id, role, is_owner, invited_by, joined_at, created_at) VALUES
  -- Hugo (Admin - Owner)
  ('0c7b207d-4e0a-4f58-a614-b58bcc5fb63b', '2aa6fd16-6baf-47c9-bd5d-d99947211568', '30cd17fc-e20c-4945-98c0-a29cd1573244', 'admin', true, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Arthur Gonzaga
  ('64a190a1-80a3-459d-912e-d51d0b8c8b88', '2aa6fd16-6baf-47c9-bd5d-d99947211568', '84170044-a578-40ed-8123-f936556bbba6', 'user', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Guilherme Araújo
  ('310ca9ce-bf6c-49be-bf7d-e8d54fa2242f', '2aa6fd16-6baf-47c9-bd5d-d99947211568', '5cb2c5ce-48be-481a-9e5d-86e2c6f71860', 'user', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Michael Correia
  ('0aa26e56-9225-4d22-a278-130d53ff20a8', '2aa6fd16-6baf-47c9-bd5d-d99947211568', '011c8b45-5aa3-42f2-9bf3-79bc4a2d97c8', 'user', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Jean Nascimento
  ('13177620-97b8-480e-8dc3-ea88a028ff4e', '2aa6fd16-6baf-47c9-bd5d-d99947211568', 'a6c5bbf6-3cf9-42d0-ba28-3550448c7e43', 'user', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Renan Lins
  ('4c6a46cd-9afc-4446-8f2d-5333d52b7803', '2aa6fd16-6baf-47c9-bd5d-d99947211568', '1defaf3d-4852-437d-b7e2-fb261601eea1', 'user', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Hugo Oliveira
  ('74699d3f-c31c-458e-9ac7-c6a89fc4143e', '2aa6fd16-6baf-47c9-bd5d-d99947211568', 'd9f739ea-2f7f-44c2-9446-4ae92c83a221', 'user', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Dayse Quirino (People)
  ('5fb873c0-9dd8-4537-8558-0ec4430235ba', '2aa6fd16-6baf-47c9-bd5d-d99947211568', '9131c6b1-fabf-44e6-959f-5f8e7dd0761b', 'people', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Gabriel Amat
  ('f90b87e9-af35-45e5-be4a-ea2f8ac8c497', '2aa6fd16-6baf-47c9-bd5d-d99947211568', 'fec381fe-0fd7-4bbc-871f-02cf0e8b0695', 'user', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Maria Tupich
  ('e779cbae-5a0a-4357-97a8-07097573bd80', '2aa6fd16-6baf-47c9-bd5d-d99947211568', 'e40fb30c-33f4-49f3-a290-7f6ff81e680f', 'user', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Matheus Carvalho
  ('79aa545d-05a2-4d1a-9703-7f72097afb4e', '2aa6fd16-6baf-47c9-bd5d-d99947211568', '394bd218-9e55-4d7f-82b2-6fdb0e1afdc9', 'user', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Pedro Mota
  ('320c04bf-dc44-4e93-b3c4-74d04326fdd5', '2aa6fd16-6baf-47c9-bd5d-d99947211568', '78d448f5-b9b4-441b-8203-5c8ad9bc2f62', 'user', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- William Bonfim
  ('bd3f06ec-c663-4f89-85e3-65b15a5c9f39', '2aa6fd16-6baf-47c9-bd5d-d99947211568', '9f60f041-e911-4af8-aed9-741b6a820104', 'user', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Gabriel Gonçalves
  ('f356fdd7-0d14-4c7c-a5b4-88b81fb303a7', '2aa6fd16-6baf-47c9-bd5d-d99947211568', '1196530f-992a-4c38-bdff-da522a4b34a3', 'user', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Gabriel Aragão
  ('1c3a3466-fe03-44ec-a3d9-91206fc6e361', '2aa6fd16-6baf-47c9-bd5d-d99947211568', '459a1027-a0e6-40be-b22e-8dfadee4891c', 'user', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Luis Honorato
  ('b10d6e30-f591-4886-95b1-ffc0ccc3cf82', '2aa6fd16-6baf-47c9-bd5d-d99947211568', 'f8cec1a2-6d17-49eb-8899-419037de4f15', 'user', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Thiago Martins
  ('88bad9fd-ec02-4205-9aed-d4440fed8a4c', '2aa6fd16-6baf-47c9-bd5d-d99947211568', 'd12d56a7-438f-498c-88df-8ed1e884360e', 'user', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Adriel Borges
  ('4112cad7-731c-4d04-9a57-d7759d0f1461', '2aa6fd16-6baf-47c9-bd5d-d99947211568', 'd1564462-3881-4826-8145-ae055ab75467', 'user', false, NULL, '2025-10-07 18:05:13.604691+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Brenda Mendes (People)
  ('0d5dbc8b-9ecf-40bc-90bb-b67289a89608', '2aa6fd16-6baf-47c9-bd5d-d99947211568', '4275f744-c442-4805-a7a9-05c7df646869', 'people', false, NULL, '2025-10-06 20:49:06.744893+00', '2025-12-18 14:59:19.102055+00'),
  
  -- Vitor Frizio (DevAdmin - teste)
  ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '2aa6fd16-6baf-47c9-bd5d-d99947211568', '83887901-e41e-4d91-a953-7e7619f3eae5', 'admin', false, NULL, '2025-12-05 14:14:55.124813+00', '2025-12-18 14:59:19.102055+00');

-- ============================================
-- FIM DOS DADOS DE ORGANIZATION_MEMBERS
-- ============================================
