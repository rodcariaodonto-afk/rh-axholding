-- Drop the previous function with wrong signature
DROP FUNCTION IF EXISTS public.check_rate_limit(text, text, integer, integer);

-- Create rate limiting function with correct signature for edge functions
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_function_name TEXT,
  p_key TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_reset_at TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  v_reset_at := NOW() + (p_window_seconds || ' seconds')::INTERVAL;
  
  -- Delete old entries (cleanup)
  DELETE FROM public.rate_limit_log
  WHERE function_name = p_function_name
    AND rate_key = p_key
    AND created_at < v_window_start;
  
  -- Count requests in the current window
  SELECT COUNT(*)
  INTO v_count
  FROM public.rate_limit_log
  WHERE function_name = p_function_name
    AND rate_key = p_key
    AND created_at > v_window_start;
  
  -- If under limit, log the request and return allowed
  IF v_count < p_max_requests THEN
    INSERT INTO public.rate_limit_log (function_name, rate_key)
    VALUES (p_function_name, p_key);
    
    RETURN jsonb_build_object(
      'allowed', true,
      'count', v_count + 1,
      'limit', p_max_requests,
      'remaining', p_max_requests - v_count - 1,
      'reset_at', v_reset_at
    );
  END IF;
  
  -- Over limit
  RETURN jsonb_build_object(
    'allowed', false,
    'count', v_count,
    'limit', p_max_requests,
    'remaining', 0,
    'reset_at', v_reset_at
  );
END;
$$;