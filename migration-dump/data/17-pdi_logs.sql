-- ============================================
-- PoPeople Database Migration
-- DATA: pdi_logs
-- ============================================
-- Execute após 14-pdis.sql e 15-pdi_goals.sql
-- ============================================

INSERT INTO pdi_logs (id, pdi_id, goal_id, logged_by, event_type, description, metadata, created_at) VALUES
  -- PDI criado
  ('65de194d-7899-4a55-bf67-98f040ae1950', '05c42ef6-65d5-40a1-accc-ab33625816ea', NULL, '83887901-e41e-4d91-a953-7e7619f3eae5', 'created', 'PDI "PDI para 2026" criado', NULL, '2025-12-09 17:28:55.404409+00'),
  
  -- Meta adicionada: Ser referência no Lovable
  ('a4b65eac-a651-4344-bc19-e2c9fd1fb2c5', '05c42ef6-65d5-40a1-accc-ab33625816ea', 'c6e87ba3-63e7-4297-aaca-bf2741d2802d', '83887901-e41e-4d91-a953-7e7619f3eae5', 'goal_added', 'Meta "Ser referência no Lovable" adicionada', NULL, '2025-12-09 17:48:26.782217+00'),
  
  -- Meta adicionada: Ser Team Leader de Lovable
  ('b7545bf4-2133-48d8-b354-5634f4f84aa5', '05c42ef6-65d5-40a1-accc-ab33625816ea', '05a2fe03-8b74-4d41-bda3-1b3bdb01010a', '83887901-e41e-4d91-a953-7e7619f3eae5', 'goal_added', 'Meta "Ser Team Leader de Lovable" adicionada', NULL, '2025-12-10 13:20:08.4136+00'),
  
  -- PDI Brenda criado
  ('5aa11973-9bf2-4468-8d85-366fad55f2af', 'b3b1f58e-0b78-47c4-ace3-ee5ff097dbde', NULL, '4275f744-c442-4805-a7a9-05c7df646869', 'created', 'PDI "PDI 2026" criado', NULL, '2025-12-10 13:45:00.285027+00'),
  
  -- Meta 1 adicionada ao PDI Brenda
  ('7f756052-1d38-4da4-9857-6625cdd95875', 'b3b1f58e-0b78-47c4-ace3-ee5ff097dbde', 'b40bb1dd-e439-4bf9-bf6c-208e4ba0e018', '4275f744-c442-4805-a7a9-05c7df646869', 'goal_added', 'Meta "Meta 1" adicionada', NULL, '2025-12-10 13:46:15.319428+00'),
  
  -- Comentário adicionado ao PDI Brenda
  ('a2211fba-a841-4447-8bbd-35891eb1f479', 'b3b1f58e-0b78-47c4-ace3-ee5ff097dbde', NULL, '4275f744-c442-4805-a7a9-05c7df646869', 'comment_added', 'Comentário adicionado', NULL, '2025-12-10 13:46:45.253152+00'),
  
  -- Checklist atualizado
  ('eb3b0b69-00b1-4728-91a1-a6dea58fbd3c', 'b3b1f58e-0b78-47c4-ace3-ee5ff097dbde', 'b40bb1dd-e439-4bf9-bf6c-208e4ba0e018', '4275f744-c442-4805-a7a9-05c7df646869', 'checklist_updated', 'Checklist atualizado', NULL, '2025-12-10 13:49:10.896078+00'),
  
  ('ad26981d-5e71-4357-a9d7-a59b83cd2960', 'b3b1f58e-0b78-47c4-ace3-ee5ff097dbde', 'b40bb1dd-e439-4bf9-bf6c-208e4ba0e018', '4275f744-c442-4805-a7a9-05c7df646869', 'checklist_updated', 'Checklist atualizado', NULL, '2025-12-10 13:49:13.44859+00'),
  
  -- Comentário adicionado ao PDI Hugo Teste
  ('3daa322b-67e5-410b-81e7-3356c9800b32', '05c42ef6-65d5-40a1-accc-ab33625816ea', NULL, '83887901-e41e-4d91-a953-7e7619f3eae5', 'comment_added', 'Comentário adicionado', NULL, '2025-12-10 13:51:51.570505+00'),
  
  -- Checklists atualizados
  ('e6a8f86a-cf9f-4aaf-91fe-07f3d6358a12', '05c42ef6-65d5-40a1-accc-ab33625816ea', '05a2fe03-8b74-4d41-bda3-1b3bdb01010a', '83887901-e41e-4d91-a953-7e7619f3eae5', 'checklist_updated', 'Checklist atualizado', NULL, '2025-12-10 14:03:17.557229+00'),
  
  ('4690ac7c-33c5-4aa1-8775-cf4261645eb1', '05c42ef6-65d5-40a1-accc-ab33625816ea', '05a2fe03-8b74-4d41-bda3-1b3bdb01010a', '83887901-e41e-4d91-a953-7e7619f3eae5', 'checklist_updated', 'Checklist atualizado', NULL, '2025-12-10 14:03:17.781505+00'),
  
  ('21bf557a-e59e-4c34-bf68-b64a4e85b626', '05c42ef6-65d5-40a1-accc-ab33625816ea', '05a2fe03-8b74-4d41-bda3-1b3bdb01010a', '83887901-e41e-4d91-a953-7e7619f3eae5', 'checklist_updated', 'Checklist atualizado', NULL, '2025-12-10 14:03:18.420022+00'),
  
  ('8612cc26-3ac4-4e0c-8cd6-fad1b1705c06', '05c42ef6-65d5-40a1-accc-ab33625816ea', '05a2fe03-8b74-4d41-bda3-1b3bdb01010a', '83887901-e41e-4d91-a953-7e7619f3eae5', 'checklist_updated', 'Checklist atualizado', NULL, '2025-12-10 14:03:19.482498+00');

-- ============================================
-- FIM DOS DADOS DE PDI_LOGS
-- ============================================
