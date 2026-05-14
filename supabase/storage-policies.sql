-- bucket: technique-images (콘솔에서 Public=ON으로 생성한 상태 가정)

CREATE POLICY "anyone can read images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'technique-images');

CREATE POLICY "authenticated can write images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'technique-images');

CREATE POLICY "authenticated can update images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'technique-images');

CREATE POLICY "authenticated can delete images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'technique-images');
