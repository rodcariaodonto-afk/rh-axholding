-- Drop existing policies that only allow self-management
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Usuários autenticados podem fazer upload do próprio avatar OU admins/people podem fazer upload de qualquer avatar
CREATE POLICY "Users can upload own avatar or admin/people can upload any"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL AND
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'people')
  )
);

-- Usuários podem atualizar próprio avatar OU admins/people podem atualizar qualquer avatar
CREATE POLICY "Users can update own avatar or admin/people can update any"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'people')
  )
);

-- Usuários podem deletar próprio avatar OU admins/people podem deletar qualquer avatar
CREATE POLICY "Users can delete own avatar or admin/people can delete any"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'people')
  )
);