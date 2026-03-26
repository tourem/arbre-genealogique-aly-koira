ALTER TABLE members ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT NULL;

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS : lecture publique, ecriture authentifiee
CREATE POLICY "Public read photos" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'photos');
CREATE POLICY "Auth upload photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos');
CREATE POLICY "Auth update photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'photos');
CREATE POLICY "Auth delete photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'photos');
