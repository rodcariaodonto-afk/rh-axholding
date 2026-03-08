
-- Habilitar RLS na tabela rate_limit_entries
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_entries FORCE ROW LEVEL SECURITY;

-- Policy: Apenas a função check_rate_limit (SECURITY DEFINER) pode manipular
-- Nenhum acesso direto permitido a usuários
-- A função já roda com privilégios elevados, então não precisa de policy permissiva
