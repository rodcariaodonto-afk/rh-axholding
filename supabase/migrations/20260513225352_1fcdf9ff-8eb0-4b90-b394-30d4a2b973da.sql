
-- ============================================================
-- GOVERNANÇA DE DADOS — RH AXIS
-- ============================================================

-- ---------- 1. Ampliar audit_log ----------
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info','warn','critical')),
  ADD COLUMN IF NOT EXISTS previous_values jsonb,
  ADD COLUMN IF NOT EXISTS new_values jsonb;

CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON public.audit_log(severity) WHERE severity <> 'info';

-- ---------- 2. Ampliar lgpd_requests ----------
ALTER TABLE public.lgpd_requests
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received','in_review','in_progress','awaiting_subject','resolved','rejected')),
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_lgpd_requests_org ON public.lgpd_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_lgpd_requests_status ON public.lgpd_requests(status);

-- Add internal read policy for org admins (keep public insert + no public read)
DROP POLICY IF EXISTS "lgpd_requests_org_select" ON public.lgpd_requests;
CREATE POLICY "lgpd_requests_org_select" ON public.lgpd_requests
  FOR SELECT TO authenticated
  USING (
    organization_id IS NOT NULL
    AND has_org_permission(auth.uid(), organization_id, 'governance.dsr_manage')
  );

DROP POLICY IF EXISTS "lgpd_requests_org_update" ON public.lgpd_requests;
CREATE POLICY "lgpd_requests_org_update" ON public.lgpd_requests
  FOR UPDATE TO authenticated
  USING (
    organization_id IS NOT NULL
    AND has_org_permission(auth.uid(), organization_id, 'governance.dsr_manage')
  );

-- ---------- 3. data_governance_policies ----------
CREATE TABLE IF NOT EXISTS public.data_governance_policies (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_retention_days integer NOT NULL DEFAULT 730,
  terminated_employee_retention_days integer NOT NULL DEFAULT 1825,
  document_retention_days integer NOT NULL DEFAULT 1825,
  export_link_ttl_days integer NOT NULL DEFAULT 7,
  document_access_logging boolean NOT NULL DEFAULT true,
  ai_recruitment_policy text DEFAULT 'allowed_with_consent',
  dsr_response_sla_days integer NOT NULL DEFAULT 15,
  data_classification_required boolean NOT NULL DEFAULT false,
  sensitive_export_requires_2fa boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.data_governance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dgp_select" ON public.data_governance_policies
  FOR SELECT TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'governance.access'));

CREATE POLICY "dgp_insert" ON public.data_governance_policies
  FOR INSERT TO authenticated
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'governance.policies_manage'));

CREATE POLICY "dgp_update" ON public.data_governance_policies
  FOR UPDATE TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'governance.policies_manage'));

CREATE TRIGGER set_dgp_updated_at BEFORE UPDATE ON public.data_governance_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 4. data_exports ----------
CREATE TABLE IF NOT EXISTS public.data_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scope text[] NOT NULL DEFAULT '{}',
  subject_type text,
  subject_id uuid,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed','expired')),
  format text NOT NULL DEFAULT 'json',
  file_url text,
  file_size_bytes bigint,
  expires_at timestamptz,
  completed_at timestamptz,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_exports_org ON public.data_exports(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_created ON public.data_exports(created_at DESC);

ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exports_select" ON public.data_exports
  FOR SELECT TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'governance.access'));

CREATE POLICY "exports_insert" ON public.data_exports
  FOR INSERT TO authenticated
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'governance.export'));

-- ---------- 5. data_subject_requests ----------
CREATE TABLE IF NOT EXISTS public.data_subject_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.lgpd_requests(id) ON DELETE SET NULL,
  subject_type text NOT NULL CHECK (subject_type IN ('employee','candidate','external')),
  subject_id uuid,
  subject_name text,
  subject_email text,
  request_kind text NOT NULL CHECK (request_kind IN ('access','rectification','portability','anonymization','deletion','restriction','consent_revocation','review')),
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received','in_review','in_progress','awaiting_subject','resolved','rejected')),
  priority text NOT NULL DEFAULT 'med' CHECK (priority IN ('low','med','high','urgent')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_at timestamptz,
  resolution_notes text,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dsr_org ON public.data_subject_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_dsr_status ON public.data_subject_requests(status);
CREATE INDEX IF NOT EXISTS idx_dsr_due ON public.data_subject_requests(due_at);

ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dsr_select" ON public.data_subject_requests
  FOR SELECT TO authenticated
  USING (
    has_org_permission(auth.uid(), organization_id, 'governance.dsr_manage')
    OR (subject_type = 'employee' AND subject_id = auth.uid())
  );

CREATE POLICY "dsr_insert" ON public.data_subject_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    has_org_permission(auth.uid(), organization_id, 'governance.dsr_manage')
    OR (subject_type = 'employee' AND subject_id = auth.uid() AND is_same_org(organization_id))
  );

CREATE POLICY "dsr_update" ON public.data_subject_requests
  FOR UPDATE TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'governance.dsr_manage'));

CREATE TRIGGER set_dsr_updated_at BEFORE UPDATE ON public.data_subject_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 6. data_consents ----------
CREATE TABLE IF NOT EXISTS public.data_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subject_type text NOT NULL CHECK (subject_type IN ('employee','candidate')),
  subject_id uuid NOT NULL,
  purpose text NOT NULL,
  consent_status text NOT NULL DEFAULT 'pending'
    CHECK (consent_status IN ('granted','revoked','pending','not_required')),
  legal_basis text NOT NULL DEFAULT 'consent'
    CHECK (legal_basis IN ('consent','contract','legal_obligation','legitimate_interest','vital_interest','public_task')),
  consent_source text,
  consent_given_at timestamptz,
  consent_revoked_at timestamptz,
  data_origin text,
  privacy_notes text,
  ai_processing_allowed boolean NOT NULL DEFAULT false,
  talent_pool_opt_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, subject_type, subject_id, purpose)
);

CREATE INDEX IF NOT EXISTS idx_consents_org ON public.data_consents(organization_id);
CREATE INDEX IF NOT EXISTS idx_consents_subject ON public.data_consents(subject_type, subject_id);

ALTER TABLE public.data_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consents_select" ON public.data_consents
  FOR SELECT TO authenticated
  USING (
    has_org_permission(auth.uid(), organization_id, 'governance.consent_manage')
    OR (subject_type = 'employee' AND subject_id = auth.uid())
  );

CREATE POLICY "consents_insert" ON public.data_consents
  FOR INSERT TO authenticated
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'governance.consent_manage'));

CREATE POLICY "consents_update" ON public.data_consents
  FOR UPDATE TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'governance.consent_manage'));

CREATE TRIGGER set_consents_updated_at BEFORE UPDATE ON public.data_consents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 7. data_classifications ----------
CREATE TABLE IF NOT EXISTS public.data_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  classification text NOT NULL DEFAULT 'internal'
    CHECK (classification IN ('public','internal','confidential','sensitive','legal_obligation')),
  retention_until timestamptz,
  classified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_classif_org ON public.data_classifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_classif_resource ON public.data_classifications(resource_type, resource_id);

ALTER TABLE public.data_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classif_select" ON public.data_classifications
  FOR SELECT TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'governance.access'));

CREATE POLICY "classif_modify" ON public.data_classifications
  FOR ALL TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'governance.policies_manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'governance.policies_manage'));

CREATE TRIGGER set_classif_updated_at BEFORE UPDATE ON public.data_classifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 8. retention_jobs ----------
CREATE TABLE IF NOT EXISTS public.retention_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  target_table text NOT NULL,
  target_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('anonymize','delete','archive')),
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  executed_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','completed','failed','cancelled')),
  executed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ret_org ON public.retention_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ret_status ON public.retention_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ret_scheduled ON public.retention_jobs(scheduled_for) WHERE status = 'pending';

ALTER TABLE public.retention_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ret_select" ON public.retention_jobs
  FOR SELECT TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'governance.access'));

CREATE POLICY "ret_modify" ON public.retention_jobs
  FOR ALL TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'governance.retention_manage'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'governance.retention_manage'));

-- ---------- 9. Permissions (catálogo global) ----------
INSERT INTO public.permissions (id, module, action, description, display_order) VALUES
  ('governance.access', 'governance', 'access', 'Acessar área de Governança de Dados', 100),
  ('governance.export', 'governance', 'export', 'Exportar dados da organização', 101),
  ('governance.audit_view', 'governance', 'audit_view', 'Visualizar auditoria completa', 102),
  ('governance.policies_manage', 'governance', 'policies_manage', 'Gerenciar políticas de governança', 103),
  ('governance.dsr_manage', 'governance', 'dsr_manage', 'Gerenciar pedidos de titulares (LGPD)', 104),
  ('governance.consent_manage', 'governance', 'consent_manage', 'Gerenciar consentimentos', 105),
  ('governance.retention_manage', 'governance', 'retention_manage', 'Gerenciar retenção e exclusão', 106)
ON CONFLICT (id) DO NOTHING;

-- ---------- 10. Atribuir permissões a roles existentes (admin + people) ----------
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug IN ('admin','people')
  AND p.id LIKE 'governance.%'
ON CONFLICT DO NOTHING;

-- Patch seed_org_roles para incluir nas próximas orgs
CREATE OR REPLACE FUNCTION public.seed_org_roles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id uuid;
  v_people_id uuid;
  v_user_id uuid;
  v_manager_id uuid;
  v_coordinator_id uuid;
  v_director_id uuid;
BEGIN
  INSERT INTO roles (slug, organization_id, name, description, is_system)
  VALUES ('admin', NEW.id, 'Admin', 'Administrador com acesso total', false)
  ON CONFLICT DO NOTHING RETURNING id INTO v_admin_id;

  INSERT INTO roles (slug, organization_id, name, description, is_system)
  VALUES ('people', NEW.id, 'RH', 'Recursos Humanos', false)
  ON CONFLICT DO NOTHING RETURNING id INTO v_people_id;

  INSERT INTO roles (slug, organization_id, name, description, is_system)
  VALUES ('director', NEW.id, 'Gerente', 'Gerente com visão ampla da equipe', false)
  ON CONFLICT DO NOTHING RETURNING id INTO v_director_id;

  INSERT INTO roles (slug, organization_id, name, description, is_system)
  VALUES ('coordinator', NEW.id, 'Coordenador', 'Coordenador de equipe', false)
  ON CONFLICT DO NOTHING RETURNING id INTO v_coordinator_id;

  INSERT INTO roles (slug, organization_id, name, description, is_system)
  VALUES ('manager', NEW.id, 'Gestor', 'Gestor direto de colaboradores', false)
  ON CONFLICT DO NOTHING RETURNING id INTO v_manager_id;

  INSERT INTO roles (slug, organization_id, name, description, is_system)
  VALUES ('user', NEW.id, 'Funcionário', 'Acesso básico de colaborador', false)
  ON CONFLICT DO NOTHING RETURNING id INTO v_user_id;

  IF v_admin_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_admin_id, p.id FROM permissions p ON CONFLICT DO NOTHING;
  END IF;

  IF v_people_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_people_id, p.id FROM permissions p
    WHERE p.id NOT IN ('admin.view_costs','admin.system_settings','users.manage_roles')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_director_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_director_id, p.id FROM permissions p
    WHERE p.id IN ('employees.view','employees.edit','departments.view','devices.view','time_off.view','time_off.manage','certificates.view','trainings.view','trainings.manage','jobs.view','positions.view','feedbacks.view','feedbacks.send','evaluations.view','evaluations.manage','pdis.view','pdis.manage')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_coordinator_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_coordinator_id, p.id FROM permissions p
    WHERE p.id IN ('employees.view','departments.view','devices.view','time_off.view','certificates.view','trainings.view','jobs.view','positions.view','feedbacks.view','feedbacks.send','evaluations.view','pdis.view','pdis.manage')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_manager_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_manager_id, p.id FROM permissions p
    WHERE p.id IN ('employees.view','devices.view','time_off.view','certificates.view','trainings.view','jobs.view','positions.view','feedbacks.view','feedbacks.send','pdis.view','pdis.manage')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_user_id, p.id FROM permissions p
    WHERE p.id IN ('employees.view','devices.view','time_off.view','certificates.view','trainings.view','jobs.view','positions.view')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- ---------- 11. Backfill default policies para orgs existentes ----------
INSERT INTO public.data_governance_policies (organization_id)
SELECT id FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;

-- ---------- 12. Storage bucket privado ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('governance-exports', 'governance-exports', false)
ON CONFLICT (id) DO NOTHING;

-- Acesso isolado por organização (path = <org_id>/...)
DROP POLICY IF EXISTS "gov_exports_select" ON storage.objects;
CREATE POLICY "gov_exports_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'governance-exports'
    AND has_org_permission(auth.uid(), ((storage.foldername(name))[1])::uuid, 'governance.access')
  );
