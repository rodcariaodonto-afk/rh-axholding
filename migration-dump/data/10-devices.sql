-- ============================================
-- PoPeople Database Migration
-- DATA: devices
-- ============================================
-- Execute após 04-employees.sql
-- ============================================

INSERT INTO devices (id, device_type, model, year, serial, processor, ram, disk, screen_size, status, hexnode_registered, warranty_date, user_id, user_name, notes, created_at, updated_at) VALUES
  -- Mac Minis
  ('ad4ffd08-a8ae-4931-baf9-c5bd78427ce3', 'computer', 'Mac Mini', 2024, 'NY66QP3JJT', 'M4', 16, 256, NULL, 'borrowed', true, '2026-07-24', '84170044-a578-40ed-8123-f936556bbba6', 'Arthur Gonzaga Ribeiro', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-06 17:39:15.070027+00'),
  ('cb98f710-755f-4023-acf7-fa243ea6e243', 'computer', 'Mac Mini', 2024, 'NY667PWLJT', 'M4', 16, 256, NULL, 'office', true, '2026-07-24', NULL, 'Popcode', 'Responsável: Popcode', '2025-10-06 14:03:53.49258+00', '2025-12-09 14:21:54.609929+00'),
  ('e3a5b7c9-d1f2-4a6b-8c9d-0e1f2a3b4c5d', 'computer', 'Mac Mini', 2024, 'NY667Q0PJT', 'M4', 16, 256, NULL, 'borrowed', true, '2026-07-24', 'd9f739ea-2f7f-44c2-9446-4ae92c83a221', 'Hugo Gomes de Oliveira', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-08 13:48:33.594644+00'),
  ('f4b6c8d0-e2a3-5b7c-9d0e-1f2a3b4c5d6e', 'computer', 'Mac Mini', 2024, 'NY66QP3MJT', 'M4', 16, 256, NULL, 'borrowed', true, '2026-07-24', '1d464459-7f03-4565-9b69-335286001c6e', 'Nathan Emir Nery Salustiano', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-08 13:16:12.379665+00'),
  ('a5c7d9e1-f3b4-6c8d-0e1f-2a3b4c5d6e7f', 'computer', 'Mac Mini', 2024, 'NY667Q7KJT', 'M4', 16, 256, NULL, 'borrowed', true, '2026-07-24', '1196530f-992a-4c38-bdff-da522a4b34a3', 'Gabriel Brandão Gonçalves', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-07 19:52:50.294473+00'),
  
  -- MacBooks Pro
  ('b6d8e0f2-a4c5-7d9e-1f2a-3b4c5d6e7f8a', 'computer', 'MacBook Pro 14"', 2023, 'JQGV4QD23V', 'M3 Pro', 18, 512, 14.2, 'borrowed', true, '2025-11-30', '394bd218-9e55-4d7f-82b2-6fdb0e1afdc9', 'Matheus de Jesus Souza Carvalho', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-08 19:02:35.150936+00'),
  ('c7e9f1a3-b5d6-8e0f-2a3b-4c5d6e7f8a9b', 'computer', 'MacBook Pro 14"', 2024, 'XDTKF5LK7W', 'M4 Pro', 24, 512, 14.2, 'borrowed', true, '2027-01-15', '30cd17fc-e20c-4945-98c0-a29cd1573244', 'Hugo Maciel Mendes de Souza', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-08 14:26:05.831508+00'),
  ('d8f0a2b4-c6e7-9f1a-3b4c-5d6e7f8a9b0c', 'computer', 'MacBook Pro 16"', 2023, 'HVK2Y5MWRJ', 'M3 Max', 36, 512, 16.2, 'borrowed', true, '2025-09-20', 'd1564462-3881-4826-8145-ae055ab75467', 'Adriel Santos Borges', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-08 13:06:38.614916+00'),
  
  -- MacBooks Air
  ('e9a1b3c5-d7f8-0a2b-4c5d-6e7f8a9b0c1d', 'computer', 'MacBook Air 13"', 2024, 'XPFYJ7L48M', 'M3', 16, 256, 13.6, 'borrowed', true, '2026-03-10', 'e40fb30c-33f4-49f3-a290-7f6ff81e680f', 'Maria Eduarda Tupich', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-08 18:58:05.371622+00'),
  ('f0b2c4d6-e8a9-1b3c-5d6e-7f8a9b0c1d2e', 'computer', 'MacBook Air 15"', 2024, 'MNJ43WK5PX', 'M3', 16, 512, 15.3, 'borrowed', true, '2026-05-22', '5cb2c5ce-48be-481a-9e5d-86e2c6f71860', 'Guilherme de Araújo', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-08 19:22:27.814315+00'),
  
  -- Monitores
  ('a1c3d5e7-f9b0-2c4d-6e7f-8a9b0c1d2e3f', 'monitor', 'LG UltraWide 29"', 2023, 'LG2023WD001', NULL, NULL, NULL, 29, 'borrowed', false, '2025-12-15', '84170044-a578-40ed-8123-f936556bbba6', 'Arthur Gonzaga Ribeiro', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-06 17:39:15.070027+00'),
  ('b2d4e6f8-a0c1-3d5e-7f8a-9b0c1d2e3f4a', 'monitor', 'Dell U2722D', 2022, 'DELL2722D002', NULL, NULL, NULL, 27, 'borrowed', false, '2025-06-30', '30cd17fc-e20c-4945-98c0-a29cd1573244', 'Hugo Maciel Mendes de Souza', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-08 14:26:05.831508+00'),
  ('c3e5f7a9-b1d2-4e6f-8a9b-0c1d2e3f4a5b', 'monitor', 'Samsung Odyssey G5', 2023, 'SAM2023G5003', NULL, NULL, NULL, 27, 'office', false, '2025-10-01', NULL, 'Escritório SP', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-06 14:03:53.49258+00'),
  
  -- Mouses
  ('d4f6a8b0-c2e3-5f7a-9b0c-1d2e3f4a5b6c', 'mouse', 'Apple Magic Mouse', 2024, NULL, NULL, NULL, NULL, NULL, 'borrowed', false, NULL, '394bd218-9e55-4d7f-82b2-6fdb0e1afdc9', 'Matheus de Jesus Souza Carvalho', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-08 19:02:35.150936+00'),
  ('e5a7b9c1-d3f4-6a8b-0c1d-2e3f4a5b6c7d', 'mouse', 'Logitech MX Master 3', 2023, 'LOGI2023MX001', NULL, NULL, NULL, NULL, 'borrowed', false, '2025-08-15', 'd1564462-3881-4826-8145-ae055ab75467', 'Adriel Santos Borges', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-08 13:06:38.614916+00'),
  
  -- Teclados
  ('f6b8c0d2-e4a5-7b9c-1d2e-3f4a5b6c7d8e', 'keyboard', 'Apple Magic Keyboard', 2024, NULL, NULL, NULL, NULL, NULL, 'borrowed', false, NULL, '30cd17fc-e20c-4945-98c0-a29cd1573244', 'Hugo Maciel Mendes de Souza', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-08 14:26:05.831508+00'),
  ('a7c9d1e3-f5b6-8c0d-2e3f-4a5b6c7d8e9f', 'keyboard', 'Keychron K2', 2023, 'KEY2023K2001', NULL, NULL, NULL, NULL, 'office', false, NULL, NULL, 'Escritório SP', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-06 14:03:53.49258+00'),
  
  -- Headsets
  ('b8d0e2f4-a6c7-9d1e-3f4a-5b6c7d8e9f0a', 'headset', 'AirPods Pro 2', 2023, 'APP2023PRO001', NULL, NULL, NULL, NULL, 'borrowed', false, '2025-09-30', '84170044-a578-40ed-8123-f936556bbba6', 'Arthur Gonzaga Ribeiro', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-06 17:39:15.070027+00'),
  ('c9e1f3a5-b7d8-0e2f-4a5b-6c7d8e9f0a1b', 'headset', 'Sony WH-1000XM5', 2023, 'SONY2023XM5001', NULL, NULL, NULL, NULL, 'borrowed', false, '2025-11-15', '30cd17fc-e20c-4945-98c0-a29cd1573244', 'Hugo Maciel Mendes de Souza', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-08 14:26:05.831508+00'),
  
  -- Webcams
  ('d0f2a4b6-c8e9-1f3a-5b6c-7d8e9f0a1b2c', 'webcam', 'Logitech C920', 2022, 'LOGI2022C920001', NULL, NULL, NULL, NULL, 'office', false, NULL, NULL, 'Escritório SP', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-06 14:03:53.49258+00'),
  
  -- iPhones
  ('e1a3b5c7-d9f0-2a4b-6c7d-8e9f0a1b2c3d', 'phone', 'iPhone 15 Pro', 2023, 'IP15PRO2023001', 'A17 Pro', 8, 256, 6.1, 'borrowed', false, '2025-09-15', '30cd17fc-e20c-4945-98c0-a29cd1573244', 'Hugo Maciel Mendes de Souza', 'Celular corporativo', '2025-10-06 14:03:53.49258+00', '2025-10-08 14:26:05.831508+00'),
  
  -- iPads
  ('f2b4c6d8-e0a1-3b5c-7d8e-9f0a1b2c3d4e', 'tablet', 'iPad Pro 11"', 2024, 'IPADPRO2024001', 'M4', 8, 256, 11, 'borrowed', false, '2026-05-01', '4275f744-c442-4805-a7a9-05c7df646869', 'Brenda Mendes', 'Uso em reuniões', '2025-10-06 14:03:53.49258+00', '2025-10-08 20:40:44.69401+00'),
  
  -- Apple TVs
  ('a3c5d7e9-f1b2-4c6d-8e9f-0a1b2c3d4e5f', 'apple_tv', 'Apple TV 4K', 2022, 'ATV4K2022001', 'A15 Bionic', NULL, 128, NULL, 'office', false, NULL, NULL, 'Sala de Reuniões SP', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-06 14:03:53.49258+00'),
  
  -- Carregadores
  ('b4d6e8f0-a2c3-5d7e-9f0a-1b2c3d4e5f6a', 'charger', 'Apple USB-C 140W', 2024, NULL, NULL, NULL, NULL, NULL, 'borrowed', false, NULL, '30cd17fc-e20c-4945-98c0-a29cd1573244', 'Hugo Maciel Mendes de Souza', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-08 14:26:05.831508+00'),
  ('c5e7f9a1-b3d4-6e8f-0a1b-2c3d4e5f6a7b', 'charger', 'Apple USB-C 96W', 2023, NULL, NULL, NULL, NULL, NULL, 'available', false, NULL, NULL, 'Estoque', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-06 14:03:53.49258+00'),
  
  -- Cabos
  ('d6f8a0b2-c4e5-7f9a-1b2c-3d4e5f6a7b8c', 'cable', 'Cabo Thunderbolt 4', 2024, NULL, NULL, NULL, NULL, NULL, 'borrowed', false, NULL, 'd1564462-3881-4826-8145-ae055ab75467', 'Adriel Santos Borges', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-08 13:06:38.614916+00'),
  ('e7a9b1c3-d5f6-8a0b-2c3d-4e5f6a7b8c9d', 'cable', 'Cabo USB-C para HDMI', 2023, NULL, NULL, NULL, NULL, NULL, 'office', false, NULL, NULL, 'Escritório SP', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-06 14:03:53.49258+00'),
  
  -- Chromecast
  ('f8b0c2d4-e6a7-9b1c-3d4e-5f6a7b8c9d0e', 'chromecast', 'Chromecast with Google TV', 2023, 'CC2023GTV001', NULL, NULL, NULL, NULL, 'office', false, NULL, NULL, 'Sala de Reuniões SP', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-06 14:03:53.49258+00'),
  
  -- Outros dispositivos
  ('a9c1d3e5-f7b8-0c2d-4e5f-6a7b8c9d0e1f', 'other', 'Hub USB-C Anker', 2023, 'ANKER2023HUB001', NULL, NULL, NULL, NULL, 'borrowed', false, NULL, '84170044-a578-40ed-8123-f936556bbba6', 'Arthur Gonzaga Ribeiro', 'Hub 10 em 1', '2025-10-06 14:03:53.49258+00', '2025-10-06 17:39:15.070027+00'),
  
  -- Dispositivos disponíveis
  ('b0d2e4f6-a8c9-1d3e-5f6a-7b8c9d0e1f2a', 'computer', 'Mac Mini', 2023, 'MMPF2LL/A001', 'M2', 8, 256, NULL, 'available', true, '2025-06-30', NULL, 'Estoque', 'Disponível para alocação', '2025-10-06 14:03:53.49258+00', '2025-10-06 14:03:53.49258+00'),
  ('c1e3f5a7-b9d0-2e4f-6a7b-8c9d0e1f2a3b', 'monitor', 'LG 24"', 2021, 'LG24IN2021001', NULL, NULL, NULL, 24, 'available', false, NULL, NULL, 'Estoque', NULL, '2025-10-06 14:03:53.49258+00', '2025-10-06 14:03:53.49258+00'),
  
  -- Dispositivos em manutenção
  ('d2f4a6b8-c0e1-3f5a-7b8c-9d0e1f2a3b4c', 'computer', 'MacBook Pro 13"', 2020, 'MBP2020OLD001', 'M1', 8, 256, 13.3, 'maintenance', true, NULL, NULL, 'Assistência Apple', 'Bateria com problema', '2025-10-06 14:03:53.49258+00', '2025-10-06 14:03:53.49258+00'),
  
  -- Dispositivos vendidos/doados
  ('e3a5b7c9-d1f2-4a6b-8c9d-0e1f2a3b4c5e', 'computer', 'MacBook Air 13"', 2019, 'MBA2019OLD001', 'Intel i5', 8, 256, 13.3, 'sold', false, NULL, NULL, 'Vendido', 'Vendido em leilão interno', '2025-10-06 14:03:53.49258+00', '2025-10-06 14:03:53.49258+00'),
  ('f4b6c8d0-e2a3-5b7c-9d0e-1f2a3b4c5d6f', 'monitor', 'Dell 21"', 2018, 'DELL21OLD001', NULL, NULL, NULL, 21, 'donated', false, NULL, NULL, 'Doado', 'Doado para escola', '2025-10-06 14:03:53.49258+00', '2025-10-06 14:03:53.49258+00');

-- ============================================
-- FIM DOS DADOS DE DEVICES
-- ============================================
