CREATE POLICY "extensions king write" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'extensions' AND public.is_king(auth.uid()))
  WITH CHECK (bucket_id = 'extensions' AND public.is_king(auth.uid()));

CREATE POLICY "extensions authenticated read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'extensions');