
-- Create a public storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Policy to allow anyone to read avatars from the bucket
CREATE POLICY "Public read for avatar images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Policy to allow authenticated users to upload (insert) their avatars
CREATE POLICY "Authenticated upload for avatar images" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Policy to allow authenticated users to update their own avatars (by their own user id in the 'owner' column if set, but for now allow all authenticated)
CREATE POLICY "Authenticated update for avatar images" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

