-- Desativar políticas em inglês (manter apenas português)
UPDATE time_off_policies 
SET is_active = false 
WHERE name IN ('Vacation', 'Sick Leave', 'Personal Day');