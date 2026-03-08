-- ============================================
-- PoPeople Database Migration
-- DATA: time_off_requests
-- ============================================
-- Execute após 04-employees.sql e 18-time_off_policies.sql
-- ============================================

INSERT INTO time_off_requests (id, employee_id, policy_id, start_date, end_date, total_days, status, notes, review_notes, reviewed_by, reviewed_at, created_at, updated_at) VALUES
  -- Solicitação de férias do Hugo (aprovada)
  ('5b4a787e-0086-4af9-bac2-aeb1fa813447', '30cd17fc-e20c-4945-98c0-a29cd1573244', 'd46b67c9-dfd0-40cc-9161-eead7165858f', '2026-01-08', '2026-01-20', 9.0, 'approved', NULL, NULL, '30cd17fc-e20c-4945-98c0-a29cd1573244', '2026-01-01 14:03:29.366+00', '2026-01-01 14:03:22.427742+00', '2026-01-01 14:03:29.613278+00');

-- ============================================
-- FIM DOS DADOS DE TIME_OFF_REQUESTS
-- ============================================
