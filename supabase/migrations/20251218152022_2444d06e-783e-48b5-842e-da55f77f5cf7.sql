-- Criar bucket para logos das empresas
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Qualquer um pode ver logos (público)
CREATE POLICY "company_logos_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Policy: Admin/People podem fazer upload
CREATE POLICY "company_logos_insert_admin_people"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' 
  AND (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'people')
  )
);

-- Policy: Admin/People podem atualizar
CREATE POLICY "company_logos_update_admin_people"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-logos' 
  AND (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'people')
  )
);

-- Policy: Admin/People podem deletar
CREATE POLICY "company_logos_delete_admin_people"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos' 
  AND (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'people')
  )
);