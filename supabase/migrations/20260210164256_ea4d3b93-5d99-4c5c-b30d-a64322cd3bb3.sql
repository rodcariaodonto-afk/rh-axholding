
CREATE OR REPLACE FUNCTION public.ensure_invite_org_member()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid;
  _user_email text;
  _pending RECORD;
  _local_role_id uuid;
  _org_name text;
  _org_slug text;
  _existing_member_id uuid;
  _orphan_employee_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  SELECT email INTO _user_email
  FROM auth.users WHERE id = _user_id;

  IF _user_email IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'User email not found');
  END IF;

  -- Check if already a member of any org
  SELECT id INTO _existing_member_id
  FROM organization_members
  WHERE user_id = _user_id
  LIMIT 1;

  IF _existing_member_id IS NOT NULL THEN
    SELECT o.name, o.slug INTO _org_name, _org_slug
    FROM organization_members om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.id = _existing_member_id;

    RETURN jsonb_build_object(
      'ok', true,
      'already_member', true,
      'org_name', _org_name,
      'org_slug', _org_slug
    );
  END IF;

  -- Find pending invite
  SELECT * INTO _pending
  FROM pending_employees
  WHERE email = _user_email
    AND status IN ('draft', 'invited', 'accepted')
  ORDER BY created_at DESC
  LIMIT 1;

  IF _pending IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No pending invite found');
  END IF;

  -- ========================================================
  -- Reconcile orphan employee (temp ID from invite flow)
  -- The invite-employee edge function creates employees with
  -- a temporary UUID, while auth creates a different UUID.
  -- We need to update the employee ID to match auth.uid().
  -- ========================================================
  SELECT id INTO _orphan_employee_id
  FROM employees
  WHERE email = _user_email
    AND organization_id = _pending.organization_id
    AND id != _user_id;

  IF _orphan_employee_id IS NOT NULL THEN
    -- Update FK references first
    UPDATE employees_contracts SET user_id = _user_id WHERE user_id = _orphan_employee_id;
    UPDATE employees_contact SET user_id = _user_id WHERE user_id = _orphan_employee_id;
    UPDATE employees_demographics SET user_id = _user_id WHERE user_id = _orphan_employee_id;
    UPDATE employees_legal_docs SET user_id = _user_id WHERE user_id = _orphan_employee_id;

    -- Now update the employee record itself
    UPDATE employees
    SET id = _user_id,
        status = 'active',
        full_name = COALESCE(_pending.full_name, full_name),
        updated_at = now()
    WHERE id = _orphan_employee_id;
  ELSE
    -- No orphan: ensure employee exists
    INSERT INTO employees (id, email, full_name, organization_id, status, employment_type)
    VALUES (
      _user_id,
      _user_email,
      COALESCE(_pending.full_name, split_part(_user_email, '@', 1)),
      _pending.organization_id,
      'active',
      COALESCE(_pending.employment_type, 'full_time')
    )
    ON CONFLICT (id) DO UPDATE SET
      organization_id = COALESCE(employees.organization_id, EXCLUDED.organization_id),
      status = 'active',
      updated_at = now();
  END IF;

  -- Get local 'user' role for the org
  SELECT id INTO _local_role_id
  FROM roles
  WHERE slug = 'user' AND organization_id = _pending.organization_id
  LIMIT 1;

  -- Create organization_member
  INSERT INTO organization_members (user_id, organization_id, role_id, invited_by)
  VALUES (_user_id, _pending.organization_id, _local_role_id, _pending.invited_by)
  ON CONFLICT DO NOTHING;

  -- Mark pending as accepted
  UPDATE pending_employees
  SET status = 'accepted', updated_at = now()
  WHERE id = _pending.id;

  -- Get org info for response
  SELECT name, slug INTO _org_name, _org_slug
  FROM organizations
  WHERE id = _pending.organization_id;

  RETURN jsonb_build_object(
    'ok', true,
    'already_member', false,
    'org_name', _org_name,
    'org_slug', _org_slug
  );
END;
$function$;
