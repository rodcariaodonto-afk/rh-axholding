INSERT INTO public.permissions (id, module, action, description) VALUES
  ('onboarding.view', 'onboarding', 'view', 'Visualizar processos de onboarding digital'),
  ('onboarding.manage', 'onboarding', 'manage', 'Criar e gerenciar processos, etapas e documentos de onboarding digital')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN (VALUES ('onboarding.view'), ('onboarding.manage')) AS p(id)
WHERE r.slug IN ('admin', 'people')
ON CONFLICT DO NOTHING;