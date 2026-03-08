-- Remover unidades duplicadas, mantendo as do seed original

-- Primeiro, atualizar colaboradores que usam IDs duplicados para usar os corretos
UPDATE employees SET unit_id = 'dc4ccd99-fd3c-47d5-b13c-2fb7576f9832' WHERE unit_id = '8b218db4-f6ba-44ce-ab60-18fee102de69';
UPDATE employees SET unit_id = '4898992a-e127-470f-a32e-5fabdd2bcac8' WHERE unit_id = '9313fc9b-8a8d-45f9-9083-44d788191bc8';

-- Agora deletar as unidades duplicadas
DELETE FROM units WHERE id = '8b218db4-f6ba-44ce-ab60-18fee102de69';
DELETE FROM units WHERE id = '9313fc9b-8a8d-45f9-9083-44d788191bc8';