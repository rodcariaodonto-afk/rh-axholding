-- Remover cargos duplicados criados em 2026-01-08, mantendo os originais de 2025-10-08
DELETE FROM positions 
WHERE created_at >= '2026-01-08' 
  AND created_at < '2026-01-09';