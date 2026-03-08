-- Atualizar gênero faltante (6 colaboradores ativos)
UPDATE employees SET gender = 'male' WHERE email = 'bruno.noveli@popcode.com.br' AND gender IS NULL;
UPDATE employees SET gender = 'male' WHERE email = 'gabriel.goncalves@popcode.com.br' AND gender IS NULL;
UPDATE employees SET gender = 'male' WHERE email = 'guilherme.araujo@popcode.com.br' AND gender IS NULL;
UPDATE employees SET gender = 'male' WHERE email = 'luis.honorato@popcode.com.br' AND gender IS NULL;
UPDATE employees SET gender = 'male' WHERE email = 'marco.marques@popcode.com.br' AND gender IS NULL;
UPDATE employees SET gender = 'male' WHERE email = 'walex.santos@popcode.com.br' AND gender IS NULL;

-- Atualizar birth_date faltantes baseado no CSV
UPDATE employees SET birth_date = '1999-04-21' WHERE email = 'bruno.noveli@popcode.com.br' AND birth_date IS NULL;
UPDATE employees SET birth_date = '1998-11-28' WHERE email = 'gabriel.goncalves@popcode.com.br' AND birth_date IS NULL;
UPDATE employees SET birth_date = '2002-07-14' WHERE email = 'guilherme.araujo@popcode.com.br' AND birth_date IS NULL;
UPDATE employees SET birth_date = '2003-05-16' WHERE email = 'luis.honorato@popcode.com.br' AND birth_date IS NULL;
UPDATE employees SET birth_date = '1985-01-14' WHERE email = 'marco.marques@popcode.com.br' AND birth_date IS NULL;
UPDATE employees SET birth_date = '2000-01-10' WHERE email = 'walex.santos@popcode.com.br' AND birth_date IS NULL;
UPDATE employees SET birth_date = '1998-11-28' WHERE email = 'gabriel.amat@popcode.com.br' AND birth_date IS NULL;
UPDATE employees SET birth_date = '2001-09-11' WHERE email = 'andre.lucas@popcode.com.br' AND birth_date IS NULL;
UPDATE employees SET birth_date = '1997-07-30' WHERE email = 'andre.rajo@popcode.com.br' AND birth_date IS NULL;

-- Atualizar full_name completo baseado no CSV
UPDATE employees SET full_name = 'Bruno Aparecido Zupp Noveli' WHERE email = 'bruno.noveli@popcode.com.br';
UPDATE employees SET full_name = 'Gabriel Mendonça De Sousa Gonçalves' WHERE email = 'gabriel.goncalves@popcode.com.br';
UPDATE employees SET full_name = 'Guilherme Araújo dos Santos' WHERE email = 'guilherme.araujo@popcode.com.br';
UPDATE employees SET full_name = 'Luis Felipe Maciel Honorato' WHERE email = 'luis.honorato@popcode.com.br';
UPDATE employees SET full_name = 'Marco Henrique Maia Marques' WHERE email = 'marco.marques@popcode.com.br';
UPDATE employees SET full_name = 'Walex de Souza Santos' WHERE email = 'walex.santos@popcode.com.br';
UPDATE employees SET full_name = 'Felipe Gomes Da Silva Monte' WHERE email = 'felipe.gomes@popcode.com.br';
UPDATE employees SET full_name = 'Gabriel Martins Amat' WHERE email = 'gabriel.amat@popcode.com.br';
UPDATE employees SET full_name = 'André Lucas Barbosa Salvador' WHERE email = 'andre.lucas@popcode.com.br';
UPDATE employees SET full_name = 'André Urpia Rajo Junior' WHERE email = 'andre.rajo@popcode.com.br';
UPDATE employees SET full_name = 'Hugo Doria Nunes' WHERE email = 'hugo@popcode.com.br';
UPDATE employees SET full_name = 'Dayse Ane Quirino' WHERE email = 'dayse.quirino@popcode.com.br';
UPDATE employees SET full_name = 'Fabiana Petrovick Soares Dias' WHERE email = 'fabiana.dias@popcode.com.br';
UPDATE employees SET full_name = 'Arthur Gonzaga Ribeiro' WHERE email = 'arthur.gonzaga@popcode.com.br';
UPDATE employees SET full_name = 'Hugo Gomes de Oliveira' WHERE email = 'hugo.oliveira@popcode.com.br';
UPDATE employees SET full_name = 'Isaac Santos De Oliveira' WHERE email = 'isaac.oliveira@popcode.com.br';
UPDATE employees SET full_name = 'Matheus Jorge Oliveira Costa' WHERE email = 'matheus.costa@popcode.com.br';
UPDATE employees SET full_name = 'Michael Lucas Silva Correia' WHERE email = 'michael.correia@popcode.com.br';
UPDATE employees SET full_name = 'Rafael dos Santos da Silva' WHERE email = 'rafael.silva@popcode.com.br';
UPDATE employees SET full_name = 'Samuel Alves Coutinho' WHERE email = 'samuel.coutinho@popcode.com.br';
UPDATE employees SET full_name = 'Thiago Silva Martins' WHERE email = 'thiago.martins@popcode.com.br';
UPDATE employees SET full_name = 'Tiago Antonio dos Santos Silva' WHERE email = 'tiago.santos@popcode.com.br';
UPDATE employees SET full_name = 'Maria Eduarda Tupich' WHERE email = 'maria.tupich@popcode.com.br';
UPDATE employees SET full_name = 'Brenno Silveira Do Nascimento' WHERE email = 'brenno.nascimento@popcode.com.br';
UPDATE employees SET full_name = 'Hian Kalled Alcântara Menezes' WHERE email = 'hian@popcode.com.br';
UPDATE employees SET full_name = 'Roberto Luiz Pedral dos Santos' WHERE email = 'roberto.pedral@popcode.com.br';
UPDATE employees SET full_name = 'Brenda Mendes Costa' WHERE email = 'brenda.mendes@popcode.com.br';
UPDATE employees SET full_name = 'Alex Brito Alves' WHERE email = 'alex.alves@popcode.com.br';