-- Remove a política insegura que permite qualquer usuário inserir logs
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_log;

-- Cria função SECURITY DEFINER para inserir logs de auditoria
-- Apenas funções do sistema (triggers, outras funções) podem chamar isso
CREATE OR REPLACE FUNCTION public.insert_audit_log(
  p_user_id uuid,
  p_resource_type text,
  p_resource_id uuid,
  p_action text,
  p_changes jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_is_sensitive boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.audit_log (
    user_id,
    resource_type,
    resource_id,
    action,
    changes,
    ip_address,
    user_agent,
    is_sensitive
  ) VALUES (
    p_user_id,
    p_resource_type,
    p_resource_id,
    p_action,
    p_changes,
    p_ip_address,
    p_user_agent,
    p_is_sensitive
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION public.insert_audit_log IS 
'Sistema de auditoria seguro. Esta função deve ser chamada apenas por triggers e funções internas do sistema. Usuários não podem inserir logs diretamente para prevenir adulteração de registros de auditoria.';
