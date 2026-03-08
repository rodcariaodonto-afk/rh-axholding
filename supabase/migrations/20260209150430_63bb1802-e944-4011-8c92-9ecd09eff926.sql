CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
  _name text,
  _slug text,
  _description text DEFAULT NULL,
  _industry text DEFAULT NULL,
  _employee_count text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _org_id uuid;
  _admin_role_id uuid;
  _user_email text;
  _user_full_name text;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT u.email, u.raw_user_meta_data->>'full_name'
  INTO _user_email, _user_full_name
  FROM auth.users u WHERE u.id = _user_id;

  IF _user_email IS NULL THEN
    RAISE EXCEPTION 'User email not found';
  END IF;

  INSERT INTO organizations (name, slug, description, industry, employee_count)
  VALUES (_name, _slug, _description, _industry, _employee_count)
  RETURNING id INTO _org_id;

  SELECT id INTO _admin_role_id
  FROM roles
  WHERE organization_id = _org_id AND slug = 'admin';

  IF _admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create organization roles';
  END IF;

  INSERT INTO organization_members (organization_id, user_id, role_id, is_owner, joined_at)
  VALUES (_org_id, _user_id, _admin_role_id, true, now());

  INSERT INTO employees (id, organization_id, email, full_name, status)
  VALUES (_user_id, _org_id, _user_email, _user_full_name, 'active')
  ON CONFLICT (id) DO NOTHING;

  RETURN _org_id;
END;
$$;