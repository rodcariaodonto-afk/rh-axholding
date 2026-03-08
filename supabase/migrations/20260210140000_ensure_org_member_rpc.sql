-- RPC: fallback para garantir que o organization_member existe após aceitar convite
-- Chamado pelo frontend AcceptInvite se o trigger handle_new_user não criou o registro
CREATE OR REPLACE FUNCTION public.ensure_invite_org_member()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_email text;
  _pending RECORD;
  _role_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Já tem organization_member? Nada a fazer
  IF EXISTS (SELECT 1 FROM organization_members WHERE user_id = _user_id) THEN
    RETURN;
  END IF;

  -- Buscar email do user
  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;

  -- Buscar pending_employee
  SELECT * INTO _pending
  FROM pending_employees
  WHERE email = _user_email
    AND status IN ('draft', 'invited', 'accepted')
  ORDER BY created_at DESC
  LIMIT 1;

  IF _pending IS NULL THEN
    RETURN; -- Não é um convite, nada a fazer
  END IF;

  -- Buscar role 'user' da org
  SELECT id INTO _role_id
  FROM roles
  WHERE slug = 'user' AND organization_id = _pending.organization_id
  LIMIT 1;

  -- Criar organization_member
  INSERT INTO organization_members (user_id, organization_id, role_id, invited_by)
  VALUES (_user_id, _pending.organization_id, _role_id, _pending.invited_by)
  ON CONFLICT DO NOTHING;

  -- Garantir que employee existe e está ativo
  UPDATE employees
  SET status = 'active', updated_at = now()
  WHERE email = _user_email
    AND organization_id = _pending.organization_id
    AND status = 'pending';

  -- Marcar pending como aceito
  UPDATE pending_employees
  SET status = 'accepted', updated_at = now()
  WHERE id = _pending.id
    AND status != 'accepted';
END;
$$;
