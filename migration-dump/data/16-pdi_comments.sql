-- ============================================
-- PoPeople Database Migration
-- DATA: pdi_comments
-- ============================================
-- Execute após 14-pdis.sql
-- ============================================

INSERT INTO pdi_comments (id, pdi_id, user_id, content, edit_history, created_at, updated_at) VALUES
  -- Comentário 1: Comentário teste
  ('82b6e203-6423-4320-8cd6-8343c4e06d22', '05c42ef6-65d5-40a1-accc-ab33625816ea', '83887901-e41e-4d91-a953-7e7619f3eae5', 'Comentário teste', '[]'::jsonb, '2025-12-10 13:37:00.654599+00', NULL),
  
  -- Comentário 2: Checkpoint do PDI Brenda
  ('dae9d330-e02b-4115-ac54-16176def4678', 'b3b1f58e-0b78-47c4-ace3-ee5ff097dbde', '4275f744-c442-4805-a7a9-05c7df646869', 'Checkpoint 1: feito leitura de livro', '[]'::jsonb, '2025-12-10 13:46:45.253152+00', NULL),
  
  -- Comentário 3: Comentário editado
  ('7b3e7603-d1f2-4dd3-8f9a-e0145be7b0c4', '05c42ef6-65d5-40a1-accc-ab33625816ea', '83887901-e41e-4d91-a953-7e7619f3eae5', 'Blebleblesss', '[{"content": "Blebleble", "edited_at": "2025-12-10T13:51:56.115Z"}]'::jsonb, '2025-12-10 13:51:51.570505+00', '2025-12-10 13:51:56.115+00');

-- ============================================
-- FIM DOS DADOS DE PDI_COMMENTS
-- ============================================
