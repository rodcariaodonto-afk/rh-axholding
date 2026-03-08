-- Atualizar cargos faltantes baseado no CSV (department_id, base_position_id, position_level_detail)

-- André Lucas - Dealer, Desenvolvedor Flutter, pleno_ii
UPDATE employees SET 
  department_id = 'b9dd653d-9988-4ba6-87a9-e5b04d218fe0', 
  base_position_id = '9e60dcc2-8e35-4784-be01-d0ddf88deac1',
  position_level_detail = 'pleno_ii',
  unit_id = '4898992a-e127-470f-a32e-5fabdd2bcac8'
WHERE email = 'andre.lucas@popcode.com.br';

-- André Rajo - Likeappro, Desenvolvedor Backend, pleno_ii
UPDATE employees SET 
  department_id = 'c1a5c7d4-42eb-40bb-bd7c-4ceddd448ae1', 
  base_position_id = 'd78dbb74-c86b-4d15-86fc-3f46bb62f7a9',
  position_level_detail = 'pleno_ii'
WHERE email = 'andre.rajo@popcode.com.br';

-- Bruno Noveli - Open Finance, Desenvolvedor Flutter, pleno_i
UPDATE employees SET 
  department_id = '48f9c11a-2899-4c2f-8c17-0a47a1815b6b', 
  base_position_id = '9e60dcc2-8e35-4784-be01-d0ddf88deac1',
  position_level_detail = 'pleno_i'
WHERE email = 'bruno.noveli@popcode.com.br';

-- Gabriel Goncalves - Desty, Desenvolvedor Flutter, pleno_i
UPDATE employees SET 
  department_id = '97601f70-680b-432d-989c-97f8ad494705', 
  base_position_id = '9e60dcc2-8e35-4784-be01-d0ddf88deac1',
  position_level_detail = 'pleno_i',
  unit_id = '4898992a-e127-470f-a32e-5fabdd2bcac8'
WHERE email = 'gabriel.goncalves@popcode.com.br';

-- Guilherme Araújo - Banese Card, Desenvolvedor Android, senior_i
UPDATE employees SET 
  department_id = '115184d4-4ae9-482d-980a-6eaf8edf66ac', 
  base_position_id = '2074d984-78f2-46e0-9c1c-73821b44b25e',
  position_level_detail = 'senior_i',
  unit_id = '4898992a-e127-470f-a32e-5fabdd2bcac8'
WHERE email = 'guilherme.araujo@popcode.com.br';

-- Luis Honorato - Desty, Desenvolvedor Flutter, pleno_i
UPDATE employees SET 
  department_id = '97601f70-680b-432d-989c-97f8ad494705', 
  base_position_id = '9e60dcc2-8e35-4784-be01-d0ddf88deac1',
  position_level_detail = 'pleno_i',
  unit_id = '4898992a-e127-470f-a32e-5fabdd2bcac8'
WHERE email = 'luis.honorato@popcode.com.br';

-- Marco Marques - Banese, Desenvolvedor iOS, senior_i
UPDATE employees SET 
  department_id = '55dd219e-c732-4a73-ac0c-4fd35eb69529', 
  base_position_id = 'e1fdd998-7ce4-478b-a52a-48734a54d9f9',
  position_level_detail = 'senior_i'
WHERE email = 'marco.marques@popcode.com.br';

-- Gabriel Amat - Desty, Desenvolvedor Flutter, pleno_i (já tem posição, adicionar level)
UPDATE employees SET 
  department_id = '97601f70-680b-432d-989c-97f8ad494705',
  position_level_detail = 'pleno_i',
  unit_id = '4898992a-e127-470f-a32e-5fabdd2bcac8'
WHERE email = 'gabriel.amat@popcode.com.br';

-- Samuel Coutinho - Desty, Desenvolvedor Flutter, senior_i
UPDATE employees SET 
  department_id = '97601f70-680b-432d-989c-97f8ad494705',
  base_position_id = '9e60dcc2-8e35-4784-be01-d0ddf88deac1',
  position_level_detail = 'senior_i'
WHERE email = 'samuel.coutinho@popcode.com.br';

-- Walex Santos - Desty, Desenvolvedor Flutter, pleno_i
UPDATE employees SET 
  department_id = '97601f70-680b-432d-989c-97f8ad494705', 
  base_position_id = '9e60dcc2-8e35-4784-be01-d0ddf88deac1',
  position_level_detail = 'pleno_i',
  unit_id = 'dc4ccd99-fd3c-47d5-b13c-2fb7576f9832'
WHERE email = 'walex.santos@popcode.com.br';