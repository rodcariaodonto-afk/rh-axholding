-- Corrigir mapeamento de user_id nos dispositivos baseado em nomes/emails

-- Mapeamento nome antigo -> novo ID no sistema atual:
-- Hugo Doria/Hugo Doria Nunes (30cd17fc-e20c-4945-98c0-a29cd1573244) -> 4062e1a4-95be-4012-8c2d-e7340603cc9e (hugo@popcode.com.br)
-- Arthur Gonzaga Ribeiro (84170044-a578-40ed-8123-f936556bbba6) -> 299d2cb5-e2fe-4688-9b84-3a892d3c3505 (arthur.gonzaga@popcode.com.br)
-- Guilherme Araújo dos Santos (5cb2c5ce-48be-481a-9e5d-86e2c6f71860) -> 2264f217-73d0-4a91-b925-113c380c07b8 (guilherme.araujo@popcode.com.br)
-- Gabriel Martins Amat (fec381fe-0fd7-4bbc-871f-02cf0e8b0695) -> cbde1eb7-22b2-4e1a-add8-1f7a2412123e (gabriel.amat@popcode.com.br)
-- Hugo Gomes de Oliveira (d9f739ea-2f7f-44c2-9446-4ae92c83a221) -> b4d03f4c-3638-4726-9085-73b350cac9f4 (hugo.oliveira@popcode.com.br)
-- Michael Correia (011c8b45-5aa3-42f2-9bf3-79bc4a2d97c8) -> d113a45a-2fb0-4399-b18a-e6287bad4290 (michael.correia@popcode.com.br)
-- Dayse Quirino (9131c6b1-fabf-44e6-959f-5f8e7dd0761b) -> 5a2ba5b4-c96f-4bea-bad6-cf93643958ca (dayse.quirino@popcode.com.br)
-- Fabiana Dias (f46be2af-48c7-4d1f-9354-cc2e54bf399e) -> e271ad38-e3f8-4b18-93c8-cc7acf53cc08 (fabiana.dias@popcode.com.br)
-- Samuel Coutinho (d1564462-3881-4826-8145-ae055ab75467) -> 7c4847d3-ad4e-46f4-b592-91944c93e624 (samuel.coutinho@popcode.com.br)
-- Luis Honorato (f8cec1a2-6d17-49eb-8899-419037de4f15) -> c2d662f6-aa06-4b7b-a09d-a5ce1f9e5384 (luis.honorato@popcode.com.br)
-- Matheus Costa (394bd218-9e55-4d7f-82b2-6fdb0e1afdc9) -> bc902ae3-e41d-4044-8edf-5528be4c4867 (matheus.costa@popcode.com.br)
-- Isaac Oliveira (9f60f041-e911-4af8-aed9-741b6a820104) -> af149867-edd5-4066-9964-68d072d0484f (isaac.oliveira@popcode.com.br)
-- André Lucas (0690be72-3dc0-4337-9758-7b75a57d5595) -> 5f9e9bee-963b-4c62-9e7c-4e1bfe8aca64 (andre.lucas@popcode.com.br)
-- Alex Alves (ee41ca50-f7bf-4fc5-8ce3-63bbb8b5f4e6) -> 91f24ee4-0ee1-4966-9694-bfb4189abeb1 (alex.alves@popcode.com.br)
-- Thiago Martins (d12d56a7-438f-498c-88df-8ed1e884360e) -> 4729197a-c836-4c1c-8fe1-35a298213b8d (thiago.martins@popcode.com.br)
-- Felipe Gomes (para webcam) -> 3d9048af-12d6-4d9f-bdfe-b79183c222db (felipe.gomes@popcode.com.br)
-- Tiago Santos/Tiago Antonio -> 2a433602-10e7-4c66-a7b3-f9b3caa74d5f (tiago.santos@popcode.com.br)

-- 1. Arthur Gonzaga Ribeiro - atualizar para o ID correto
UPDATE devices SET user_id = '299d2cb5-e2fe-4688-9b84-3a892d3c3505'
WHERE user_name ILIKE '%Arthur Gonzaga%';

-- 2. Guilherme Araújo dos Santos
UPDATE devices SET user_id = '2264f217-73d0-4a91-b925-113c380c07b8'
WHERE user_name ILIKE '%Guilherme Ara%jo%';

-- 3. Gabriel Martins Amat
UPDATE devices SET user_id = 'cbde1eb7-22b2-4e1a-add8-1f7a2412123e'
WHERE user_name ILIKE '%Gabriel%Amat%';

-- 4. Hugo Gomes de Oliveira (diferente de Hugo Doria)
UPDATE devices SET user_id = 'b4d03f4c-3638-4726-9085-73b350cac9f4'
WHERE user_name ILIKE '%Hugo Gomes%' OR user_name ILIKE '%Hugo%Oliveira%';

-- 5. Michael Correia
UPDATE devices SET user_id = 'd113a45a-2fb0-4399-b18a-e6287bad4290'
WHERE user_name ILIKE '%Michael%';

-- 6. Dayse Quirino
UPDATE devices SET user_id = '5a2ba5b4-c96f-4bea-bad6-cf93643958ca'
WHERE user_name ILIKE '%Dayse%';

-- 7. Fabiana Dias (Fabiana Petrovick)
UPDATE devices SET user_id = 'e271ad38-e3f8-4b18-93c8-cc7acf53cc08'
WHERE user_name ILIKE '%Fabiana%';

-- 8. Samuel Coutinho
UPDATE devices SET user_id = '7c4847d3-ad4e-46f4-b592-91944c93e624'
WHERE user_name ILIKE '%Samuel%';

-- 9. Luis Honorato
UPDATE devices SET user_id = 'c2d662f6-aa06-4b7b-a09d-a5ce1f9e5384'
WHERE user_name ILIKE '%Luis Honorato%';

-- 10. Matheus Costa (não Matheus Jorge)
UPDATE devices SET user_id = 'bc902ae3-e41d-4044-8edf-5528be4c4867'
WHERE user_name = 'Matheus Costa';

-- 11. Isaac Oliveira
UPDATE devices SET user_id = 'af149867-edd5-4066-9964-68d072d0484f'
WHERE user_name ILIKE '%Isaac%';

-- 12. André Lucas Barbosa Salvador
UPDATE devices SET user_id = '5f9e9bee-963b-4c62-9e7c-4e1bfe8aca64'
WHERE user_name ILIKE '%Andr%Lucas%';

-- 13. Alex Alves (Alex Brito Alves)
UPDATE devices SET user_id = '91f24ee4-0ee1-4966-9694-bfb4189abeb1'
WHERE user_name ILIKE '%Alex%';

-- 14. Thiago Martins
UPDATE devices SET user_id = '4729197a-c836-4c1c-8fe1-35a298213b8d'
WHERE user_name ILIKE '%Thiago%Martins%';

-- 15. Felipe Gomes
UPDATE devices SET user_id = '3d9048af-12d6-4d9f-bdfe-b79183c222db'
WHERE user_name ILIKE '%Felipe Gomes%';

-- 16. Tiago Antonio/Tiago Santos
UPDATE devices SET user_id = '2a433602-10e7-4c66-a7b3-f9b3caa74d5f'
WHERE user_name ILIKE '%Tiago Antonio%';

-- 17. Dispositivos "Popcode" ou "Sem responsável" -> user_id = NULL
UPDATE devices SET user_id = NULL
WHERE user_name IN ('Popcode', 'Sem responsável', 'OK')
   OR user_name ILIKE '%Sem respons%vel%';

-- 18. Dispositivos do escritório (status = 'office') que são do Popcode -> user_id = NULL 
-- (com exceção de itens pessoais)
UPDATE devices SET user_id = NULL
WHERE status = 'office' 
  AND (notes ILIKE '%Responsável: Popcode%' OR notes ILIKE '%Popcode%');

-- 19. Itens com "Responsável: Popcode" que estão available -> user_id = NULL
UPDATE devices SET user_id = NULL
WHERE status = 'available' 
  AND notes ILIKE '%Responsável: Popcode%';

-- 20. Brenda Mendes Costa - não existe no sistema novo, remover associação
UPDATE devices SET user_id = NULL
WHERE user_name ILIKE '%Brenda%';