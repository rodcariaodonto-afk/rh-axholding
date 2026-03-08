-- ============================================
-- PoPeople Database Migration
-- DATA: profiler_history
-- ============================================
-- Execute após 04-employees.sql
-- Nota: profiler_result_detail (JSON grande) foi omitido para simplicidade
-- ============================================

INSERT INTO profiler_history (id, employee_id, profiler_result_code, completed_at, created_at) VALUES
  -- Michael Correia
  ('5b9910e9-d64a-4b93-8906-5b66f286635f', '011c8b45-5aa3-42f2-9bf3-79bc4a2d97c8', 'COM_PLA', '2025-12-09 14:36:00.196+00', '2025-12-09 14:36:00.652455+00'),
  
  -- Vitor Frizio (DevAdmin)
  ('c7bc75de-046f-4801-b09f-544107475bc3', '83887901-e41e-4d91-a953-7e7619f3eae5', 'PLA', '2025-12-09 14:53:38.015+00', '2025-12-09 14:53:38.710096+00'),
  
  -- Davi Leandro
  ('be8bc991-dd04-4117-ac6e-5247b0496b12', '60177558-bb01-4948-afee-822ec553690a', 'COM_PLA', '2025-12-11 15:51:27.448+00', '2025-12-11 15:51:27.74213+00'),
  
  -- Hugo (Admin)
  ('503f0d08-3778-43bc-9b92-b87284090290', '30cd17fc-e20c-4945-98c0-a29cd1573244', 'PLA', '2025-12-22 13:27:08.344+00', '2025-12-22 13:27:08.93597+00');

-- NOTA: Para incluir profiler_result_detail, seria necessário exportar cada JSON individualmente
-- Os dados de profiler_result_detail são muito grandes para inclusão manual aqui
-- Recomenda-se usar pg_dump para exportar esses dados com JSONs completos

-- ============================================
-- FIM DOS DADOS DE PROFILER_HISTORY
-- ============================================
