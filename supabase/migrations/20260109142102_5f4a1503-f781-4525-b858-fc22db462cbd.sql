-- Associar todos os employees existentes à organização Popcode
INSERT INTO public.organization_members (user_id, organization_id, role, is_owner, joined_at)
SELECT
  e.id,
  '2aa6fd16-6baf-47c9-bd5d-d99947211568'::uuid, -- Popcode org ID
  COALESCE(
    (SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = e.id LIMIT 1),
    'user'::app_role
  ),
  CASE WHEN e.email = 'hugo@popcode.com.br' THEN true ELSE false END,
  NOW()
FROM public.employees e
WHERE e.status = 'active'
ON CONFLICT DO NOTHING;