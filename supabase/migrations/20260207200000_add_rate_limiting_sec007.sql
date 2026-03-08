-- ================================================
-- Rate Limiting: Table + Atomic Check Function
-- SEC-007: Implementar rate limiting
-- ================================================

-- Table to track request counts per key/function
CREATE TABLE IF NOT EXISTS public.rate_limit_entries (
  id bigserial PRIMARY KEY,
  key text NOT NULL,
  function_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups (composite key + function + time)
CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup 
  ON public.rate_limit_entries (key, function_name, created_at DESC);

-- Enable RLS (no policies = only service role can access)
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;

-- Atomic rate limit check + insert function
-- Returns: { allowed, count, limit, remaining, reset_at }
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_function_name text,
  p_max_requests int,
  p_window_seconds int DEFAULT 60
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_count int;
  v_allowed boolean;
  v_reset_at timestamptz;
BEGIN
  v_window_start := now() - make_interval(secs := p_window_seconds);
  v_reset_at := now() + make_interval(secs := p_window_seconds);

  -- Count requests in the current window
  SELECT count(*) INTO v_count
  FROM rate_limit_entries
  WHERE key = p_key
    AND function_name = p_function_name
    AND created_at > v_window_start;

  v_allowed := v_count < p_max_requests;

  -- Record the request if allowed
  IF v_allowed THEN
    INSERT INTO rate_limit_entries (key, function_name)
    VALUES (p_key, p_function_name);
    v_count := v_count + 1;
  END IF;

  -- Opportunistic cleanup: remove entries older than 1 hour
  DELETE FROM rate_limit_entries
  WHERE id IN (
    SELECT id FROM rate_limit_entries
    WHERE created_at < now() - interval '1 hour'
    LIMIT 100
  );

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'count', v_count,
    'limit', p_max_requests,
    'remaining', GREATEST(0, p_max_requests - v_count),
    'reset_at', v_reset_at
  );
END;
$$;
