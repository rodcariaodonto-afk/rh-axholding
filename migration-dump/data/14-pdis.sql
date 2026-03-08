-- ============================================
-- PoPeople Database Migration
-- DATA: pdis
-- ============================================
-- Execute após 04-employees.sql
-- ============================================

INSERT INTO pdis (id, employee_id, manager_id, created_by, title, objective, current_state, desired_state, start_date, due_date, status, progress, engagement_score, finalized_at, finalized_by, created_at, updated_at) VALUES
  -- PDI Hugo Teste (em andamento)
  ('05c42ef6-65d5-40a1-accc-ab33625816ea', 'fd6a17ff-fc72-416e-ba98-25faae0fd07d', NULL, '83887901-e41e-4d91-a953-7e7619f3eae5', 'PDI para 2026', '', 'Desenvolvedor Lovable', 'Team Leader de Lovable', '2025-12-07', '2026-06-15', 'em_andamento', 50.00, 1.00, NULL, NULL, '2025-12-09 17:28:55.133339+00', '2025-12-10 14:03:19.482498+00'),
  
  -- PDI Brenda (entregue)
  ('b3b1f58e-0b78-47c4-ace3-ee5ff097dbde', '4275f744-c442-4805-a7a9-05c7df646869', NULL, '4275f744-c442-4805-a7a9-05c7df646869', 'PDI 2026', '', '', '', '2025-12-10', '2026-12-30', 'entregue', 100.00, 1.00, NULL, NULL, '2025-12-10 13:44:59.861744+00', '2025-12-10 13:49:13.44859+00');

-- ============================================
-- FIM DOS DADOS DE PDIS
-- ============================================
