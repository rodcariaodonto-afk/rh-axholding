-- Tabela para configurações de aparência por organização
CREATE TABLE public.organization_appearance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  custom_css text DEFAULT '',
  color_mode text DEFAULT 'dark' CHECK (color_mode IN ('light', 'dark', 'system')),
  font_family text DEFAULT 'inter' CHECK (font_family IN ('inter', 'system', 'roboto', 'poppins')),
  border_radius text DEFAULT 'md' CHECK (border_radius IN ('none', 'sm', 'md', 'lg', 'xl')),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id)
);

-- RLS
ALTER TABLE public.organization_appearance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_appearance FORCE ROW LEVEL SECURITY;

-- Todos da org podem visualizar
CREATE POLICY "org_appearance_select" ON public.organization_appearance
  FOR SELECT USING (is_same_org(organization_id));

-- Apenas admins podem gerenciar
CREATE POLICY "org_appearance_manage" ON public.organization_appearance
  FOR ALL USING (is_same_org(organization_id) AND has_role(auth.uid(), 'admin'))
  WITH CHECK (is_same_org(organization_id) AND has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER update_organization_appearance_updated_at
  BEFORE UPDATE ON public.organization_appearance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();