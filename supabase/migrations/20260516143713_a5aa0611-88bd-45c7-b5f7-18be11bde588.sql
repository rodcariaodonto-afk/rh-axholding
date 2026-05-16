
CREATE OR REPLACE FUNCTION public.block_modify_append_only()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Tabela append-only: % não permite alterar ou apagar registros', TG_TABLE_NAME;
END;
$$;
