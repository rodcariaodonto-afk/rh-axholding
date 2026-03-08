-- user_roles (37 registros)
-- IMPORTANTE: Os user_ids precisam corresponder aos novos UUIDs do auth.users no destino
-- Execute após os usuários fazerem login ou serem criados

-- Mapeamento original:
-- hugo@popcode.com.br -> admin
-- brenda.mendes@popcode.com.br -> people
-- dayse.quirino@popcode.com.br -> people
-- Demais usuários -> user

-- O trigger handle_new_user() criará automaticamente os user_roles quando os usuários fizerem login
-- Se preferir inserir manualmente após criar usuários:

-- INSERT INTO public.user_roles (user_id, role) VALUES
--   ('[novo_uuid_hugo]', 'admin'),
--   ('[novo_uuid_brenda]', 'people'),
--   ('[novo_uuid_dayse]', 'people');
