
-- Criar tabela para rastreamento de rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address inet NOT NULL,
  action text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_action_window 
ON public.rate_limit_entries(ip_address, action, window_start DESC);

-- Função para verificar rate limit (atômica, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip_address inet,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_count integer;
  v_window_start timestamp with time zone;
  v_result jsonb;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;
  
  -- Limpar entradas antigas (opcional, para manutenção)
  DELETE FROM public.rate_limit_entries
  WHERE ip_address = p_ip_address 
    AND action = p_action
    AND window_start < now() - '1 hour'::interval;
  
  -- Contar requisições na janela atual
  SELECT COALESCE(SUM(request_count), 0)
  INTO v_current_count
  FROM public.rate_limit_entries
  WHERE ip_address = p_ip_address 
    AND action = p_action
    AND window_start >= v_window_start;
  
  -- Verificar se excedeu o limite
  IF v_current_count >= p_limit THEN
    v_result := jsonb_build_object(
      'allowed', false,
      'current_count', v_current_count,
      'limit', p_limit,
      'reset_after_seconds', p_window_seconds
    );
  ELSE
    -- Incrementar contador
    INSERT INTO public.rate_limit_entries (ip_address, action, request_count, window_start)
    VALUES (p_ip_address, p_action, 1, v_window_start)
    ON CONFLICT DO NOTHING;
    
    -- Se não inseriu, atualizar
    UPDATE public.rate_limit_entries
    SET request_count = request_count + 1
    WHERE ip_address = p_ip_address 
      AND action = p_action
      AND window_start = v_window_start;
    
    v_result := jsonb_build_object(
      'allowed', true,
      'current_count', v_current_count + 1,
      'limit', p_limit,
      'reset_after_seconds', p_window_seconds
    );
  END IF;
  
  RETURN v_result;
END;
$$;
