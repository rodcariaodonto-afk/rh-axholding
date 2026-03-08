-- Criar buckets de storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('resumes', 'resumes', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('employee-documents', 'employee-documents', false, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('pdi-attachments', 'pdi-attachments', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

-- RLS para resumes (público para upload, admin/people para leitura)
CREATE POLICY "Anyone can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Admin and people can read resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' 
  AND public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'people')
);

CREATE POLICY "Admin and people can delete resumes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resumes' 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
);

-- RLS para employee-documents (próprio usuário + admin/people)
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'employee-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'people')
  )
);

CREATE POLICY "Users can read own documents or admin/people"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'employee-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'people')
  )
);

CREATE POLICY "Users can delete own documents or admin/people"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'employee-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'people')
  )
);

-- RLS para pdi-attachments (owner do PDI + manager + admin/people)
CREATE POLICY "Authenticated users can upload pdi attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pdi-attachments'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can read pdi attachments if involved"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pdi-attachments'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Admin and people can delete pdi attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pdi-attachments'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'people'))
);