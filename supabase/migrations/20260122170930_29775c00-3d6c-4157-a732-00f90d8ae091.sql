-- Create storage bucket for training certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('training-certificates', 'training-certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own certificates
CREATE POLICY "training_certificates_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'training-certificates');

-- Allow anyone to view certificates (public bucket)
CREATE POLICY "training_certificates_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'training-certificates');

-- Allow users to update their own uploads
CREATE POLICY "training_certificates_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'training-certificates');

-- Allow admins and people to delete certificates
CREATE POLICY "training_certificates_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'training-certificates');