-- Adicionar campos de documentos e dados bancários à tabela employees_contact
ALTER TABLE public.employees_contact
ADD COLUMN cpf TEXT,
ADD COLUMN rg TEXT,
ADD COLUMN rg_issuer TEXT,
ADD COLUMN bank_name TEXT,
ADD COLUMN bank_agency TEXT,
ADD COLUMN bank_account TEXT,
ADD COLUMN bank_account_type TEXT,
ADD COLUMN pix_key TEXT;

COMMENT ON COLUMN employees_contact.cpf IS 'CPF do colaborador';
COMMENT ON COLUMN employees_contact.rg IS 'RG do colaborador';
COMMENT ON COLUMN employees_contact.rg_issuer IS 'Órgão emissor do RG';
COMMENT ON COLUMN employees_contact.bank_name IS 'Nome do banco';
COMMENT ON COLUMN employees_contact.bank_agency IS 'Número da agência';
COMMENT ON COLUMN employees_contact.bank_account IS 'Número da conta';
COMMENT ON COLUMN employees_contact.bank_account_type IS 'Tipo da conta: checking ou savings';
COMMENT ON COLUMN employees_contact.pix_key IS 'Chave PIX';