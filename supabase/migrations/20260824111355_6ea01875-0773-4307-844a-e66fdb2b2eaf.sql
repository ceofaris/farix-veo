CREATE POLICY "niche images authenticated read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'niche-images');
CREATE POLICY "niche images king insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'niche-images' AND public.is_king(auth.uid()));
CREATE POLICY "niche images king update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'niche-images' AND public.is_king(auth.uid()))
  WITH CHECK (bucket_id = 'niche-images' AND public.is_king(auth.uid()));
CREATE POLICY "niche images king delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'niche-images' AND public.is_king(auth.uid()));