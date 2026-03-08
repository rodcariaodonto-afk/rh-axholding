-- Remover política atual permissiva de DELETE no bucket training-certificates
DROP POLICY IF EXISTS "training_certificates_delete" ON storage.objects;

-- Criar nova política restritiva para Admin e People
CREATE POLICY "training_certificates_delete_admin_people" ON storage.objects
  FOR DELETE TO public
  USING (
    bucket_id = 'training-certificates' AND (
      public.has_role(auth.uid(), 'admin') OR 
      public.has_role(auth.uid(), 'people')
    )
  );