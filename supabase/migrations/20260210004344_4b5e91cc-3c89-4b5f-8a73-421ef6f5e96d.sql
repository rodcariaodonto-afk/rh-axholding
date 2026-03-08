
CREATE OR REPLACE FUNCTION public.has_any_organization()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM organizations LIMIT 1);
$$;

-- Allow anon and authenticated to call it
GRANT EXECUTE ON FUNCTION public.has_any_organization() TO anon, authenticated;
