
-- Storage bucket for scan uploads (so premium users can resume with their image)
INSERT INTO storage.buckets (id, name, public) VALUES ('scan-uploads', 'scan-uploads', false);

-- RLS for scan-uploads bucket
CREATE POLICY "Users can upload scan files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'scan-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can read own scan files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'scan-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own scan files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'scan-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
