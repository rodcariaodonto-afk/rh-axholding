-- Atualizar dados pessoais dos colaboradores existentes
UPDATE public.employees SET
  full_name = 'Alex Alves',
  birth_date = '1993-04-14',
  gender = 'male',
  department_id = '115184d4-4ae9-482d-980a-6eaf8edf66ac',
  base_position_id = '2074d984-78f2-46e0-9c1c-73821b44b25e',
  position_level_detail = 'pleno_i'
WHERE id = '91f24ee4-0ee1-4966-9694-bfb4189abeb1';

UPDATE public.employees SET
  full_name = 'Arthur Gonzaga',
  birth_date = '2002-02-10',
  gender = 'male',
  department_id = '55dd219e-c732-4a73-ac0c-4fd35eb69529',
  base_position_id = '2074d984-78f2-46e0-9c1c-73821b44b25e',
  position_level_detail = 'senior_iii'
WHERE id = '299d2cb5-e2fe-4688-9b84-3a892d3c3505';

UPDATE public.employees SET
  full_name = 'Dayse Quirino',
  birth_date = '1986-05-05',
  gender = 'female',
  department_id = '5a92c351-391b-4369-a1ed-7307b28d2a61',
  base_position_id = 'e5aa0b09-3e2d-40a4-89ea-b8c93319bc8f',
  position_level_detail = 'pleno_i'
WHERE id = '5a2ba5b4-c96f-4bea-bad6-cf93643958ca';

UPDATE public.employees SET
  full_name = 'Fabiana Dias',
  gender = 'female',
  department_id = '55dd219e-c732-4a73-ac0c-4fd35eb69529',
  base_position_id = 'e1fdd998-7ce4-478b-a52a-48734a54d9f9',
  position_level_detail = 'pleno_i'
WHERE id = 'e271ad38-e3f8-4b18-93c8-cc7acf53cc08';

UPDATE public.employees SET
  full_name = 'Hugo Oliveira',
  birth_date = '2005-07-07',
  gender = 'male',
  department_id = '115184d4-4ae9-482d-980a-6eaf8edf66ac',
  base_position_id = 'e1fdd998-7ce4-478b-a52a-48734a54d9f9',
  position_level_detail = 'junior_ii'
WHERE id = 'b4d03f4c-3638-4726-9085-73b350cac9f4';

UPDATE public.employees SET
  full_name = 'Hugo Feitosa',
  birth_date = '1986-01-02',
  gender = 'male',
  department_id = '932576a4-0f8f-4475-a122-6046594053f7',
  base_position_id = 'f67b8708-65c5-4191-8756-433a79dee7f1',
  position_level_detail = 'junior_ii'
WHERE id = '4062e1a4-95be-4012-8c2d-e7340603cc9e';

UPDATE public.employees SET
  full_name = 'Isaac Oliveira',
  birth_date = '1998-12-06',
  gender = 'male',
  department_id = '2f0c3bda-1281-415a-bea1-e6a6ed5f39fb',
  base_position_id = 'c1ab8793-329a-4769-a425-cb863eae2a5b',
  position_level_detail = 'pleno_i'
WHERE id = 'af149867-edd5-4066-9964-68d072d0484f';

UPDATE public.employees SET
  full_name = 'Matheus Costa',
  birth_date = '1994-09-17',
  gender = 'male',
  department_id = '2f0c3bda-1281-415a-bea1-e6a6ed5f39fb',
  base_position_id = 'c1ab8793-329a-4769-a425-cb863eae2a5b',
  position_level_detail = 'pleno_iii'
WHERE id = 'bc902ae3-e41d-4044-8edf-5528be4c4867';

UPDATE public.employees SET
  full_name = 'Michael Correia',
  birth_date = '1997-04-22',
  gender = 'male',
  department_id = 'c1a5c7d4-42eb-40bb-bd7c-4ceddd448ae1',
  base_position_id = 'c1ab8793-329a-4769-a425-cb863eae2a5b',
  position_level_detail = 'pleno_i'
WHERE id = 'd113a45a-2fb0-4399-b18a-e6287bad4290';

UPDATE public.employees SET
  full_name = 'Samuel Coutinho',
  birth_date = '1995-05-20',
  gender = 'male',
  department_id = '97601f70-680b-432d-989c-97f8ad494705',
  base_position_id = '9e60dcc2-8e35-4784-be01-d0ddf88deac1',
  position_level_detail = 'senior_i'
WHERE id = '7c4847d3-ad4e-46f4-b592-91944c93e624';

UPDATE public.employees SET
  full_name = 'Thiago Martins',
  gender = 'male',
  department_id = '32d000e2-355d-49c3-80d9-2f8ed1a6c678',
  base_position_id = '9e60dcc2-8e35-4784-be01-d0ddf88deac1',
  position_level_detail = 'pleno_i'
WHERE id = '4729197a-c836-4c1c-8fe1-35a298213b8d';

UPDATE public.employees SET
  full_name = 'Tiago Santos',
  gender = 'male',
  department_id = '45348de1-fb94-461a-90f3-87f53e3c8ef0',
  base_position_id = '266fa75a-6678-4a04-963e-015a7978bf64',
  position_level_detail = 'pleno_i'
WHERE id = '2a433602-10e7-4c66-a7b3-f9b3caa74d5f';

UPDATE public.employees SET
  full_name = 'Felipe Gomes'
WHERE id = '3d9048af-12d6-4d9f-bdfe-b79183c222db';