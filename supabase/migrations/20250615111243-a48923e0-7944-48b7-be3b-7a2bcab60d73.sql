
-- Create a Supabase storage bucket for cover/background photos (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-story-covers', 'audio-story-covers', true);

-- Add a cover_image_url column to audio_stories for uploaded image
ALTER TABLE public.audio_stories ADD COLUMN cover_image_url TEXT;

-- OPTIONAL: If RLS is enabled (and likely is), allow anyone to SELECT/GET, but only authenticated to INSERT/UPDATE
-- Allow users to upload cover photos to the new bucket (public read, authenticated write)
-- This will make cover images accessible to all visitors, but only logged in users can upload.

-- Policy for storage.objects just for 'audio-story-covers'
CREATE POLICY "Public can read cover images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'audio-story-covers');

CREATE POLICY "Authenticated can upload cover images" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'audio-story-covers' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update their cover images" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'audio-story-covers' AND auth.role() = 'authenticated');
