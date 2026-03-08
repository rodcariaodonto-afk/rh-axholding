
-- Create company-logos bucket (public for logo display)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos
CREATE POLICY "Admins can upload company logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND public.user_has_org_role_slug(auth.uid(), 'admin')
);

-- Allow anyone to view logos (public bucket)
CREATE POLICY "Anyone can view company logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'company-logos');

-- Allow admins to update logos
CREATE POLICY "Admins can update company logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND public.user_has_org_role_slug(auth.uid(), 'admin')
);

-- Allow admins to delete logos
CREATE POLICY "Admins can delete company logos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND public.user_has_org_role_slug(auth.uid(), 'admin')
);
