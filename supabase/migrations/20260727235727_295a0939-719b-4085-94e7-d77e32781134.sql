
DROP POLICY IF EXISTS "tool-logos public read" ON storage.objects;
CREATE POLICY "tool-logos authenticated read" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'tool-logos');
