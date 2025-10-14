CREATE POLICY "Allow anonymous updates to encrypted-letters"
ON storage.objects FOR UPDATE TO anon
USING ( bucket_id = 'encrypted-letters' );
