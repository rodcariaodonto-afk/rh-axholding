-- Create storage policy to allow anonymous users to upload resumes
CREATE POLICY "Anon can upload resumes"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'resumes');