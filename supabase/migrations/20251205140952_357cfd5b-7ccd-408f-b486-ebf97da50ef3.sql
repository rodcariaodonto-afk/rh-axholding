-- Drop the restrictive storage policy for anon uploads
DROP POLICY IF EXISTS "Anon can upload resumes" ON storage.objects;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Anon can upload resumes"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'resumes');