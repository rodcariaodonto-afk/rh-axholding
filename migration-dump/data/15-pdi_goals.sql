-- ============================================
-- PoPeople Database Migration
-- DATA: pdi_goals
-- ============================================
-- Execute após 14-pdis.sql
-- ============================================

INSERT INTO pdi_goals (id, pdi_id, title, description, goal_type, action_plan, due_date, weight, status, completion_ratio, checklist_items, display_order, criterion_id, training_id, created_at, updated_at) VALUES
  -- Meta 1: Ser referência no Lovable (pendente)
  ('c6e87ba3-63e7-4297-aaca-bf2741d2802d', '05c42ef6-65d5-40a1-accc-ab33625816ea', 'Ser referência no Lovable', '', 'carreira', 'Fazendo cursos e estudando mais.', '2026-06-09', 1.00, 'pendente', 0.00, '[]'::jsonb, 0, NULL, NULL, '2025-12-09 17:48:26.549122+00', '2025-12-09 17:49:16.578805+00'),
  
  -- Meta 2: Ser Team Leader de Lovable (concluída)
  ('05a2fe03-8b74-4d41-bda3-1b3bdb01010a', '05c42ef6-65d5-40a1-accc-ab33625816ea', 'Ser Team Leader de Lovable', '', 'lideranca', '', '2026-05-05', 1.00, 'concluida', 100.00, '[{"id": "d4c0b00e-a1d1-4083-b771-6a6e0a7f74a5", "text": "Check 1", "completed": true}, {"id": "22551c2d-377b-4a48-8e33-2c4b6fb8ddbc", "text": "Check 2", "completed": true}]'::jsonb, 0, NULL, NULL, '2025-12-10 13:20:08.013411+00', '2025-12-10 14:03:19.192068+00'),
  
  -- Meta 3: Meta 1 do PDI Brenda (concluída)
  ('b40bb1dd-e439-4bf9-bf6c-208e4ba0e018', 'b3b1f58e-0b78-47c4-ace3-ee5ff097dbde', 'Meta 1', '', 'comportamental', 'Treinamento X', '2026-01-31', 1.00, 'concluida', 100.00, '[{"id": "c8084246-26f9-4343-8d0a-55d6358fdc42", "text": "Leitura de livro", "completed": true}, {"id": "5e4425e2-733d-46b7-a635-94b4ebbfca08", "text": "Resumo sobre livro", "completed": true}]'::jsonb, 0, NULL, NULL, '2025-12-10 13:46:14.91694+00', '2025-12-10 13:49:13.168649+00');

-- ============================================
-- FIM DOS DADOS DE PDI_GOALS
-- ============================================
