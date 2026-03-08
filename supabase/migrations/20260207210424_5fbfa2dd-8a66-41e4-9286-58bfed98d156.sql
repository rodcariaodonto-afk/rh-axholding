-- Create rate limiting function for edge functions
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_function_name TEXT,
  p_key TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  
  -- Count requests in the current window
  SELECT COUNT(*)
  INTO v_count
  FROM public.rate_limit_log
  WHERE function_name = p_function_name
    AND rate_key = p_key
    AND created_at > v_window_start;
  
  -- If under limit, log the request and return true
  IF v_count < p_max_requests THEN
    INSERT INTO public.rate_limit_log (function_name, rate_key)
    VALUES (p_function_name, p_key);
    RETURN TRUE;
  END IF;
  
  -- Over limit
  RETURN FALSE;
END;
$$;

-- Create rate limit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  rate_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_lookup 
ON public.rate_limit_log (function_name, rate_key, created_at);

-- Enable RLS
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_log FORCE ROW LEVEL SECURITY;

-- No direct access - only through the function (which uses SECURITY DEFINER)
CREATE POLICY "No direct access to rate_limit_log"
ON public.rate_limit_log
FOR ALL
USING (false);

-- Cleanup old records (older than 1 hour) to prevent table bloat
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_log()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_log
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$;