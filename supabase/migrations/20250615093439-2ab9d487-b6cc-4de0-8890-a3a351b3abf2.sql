
-- Create a table for audio stories
CREATE TABLE public.audio_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS on the audio_stories table
ALTER TABLE public.audio_stories ENABLE ROW LEVEL SECURITY;

-- Allow users to select and view all stories (public feed)
CREATE POLICY "Allow read access to all stories"
  ON public.audio_stories
  FOR SELECT
  USING (true);

-- Allow insertion only for authenticated users, restrict to their own user_id
CREATE POLICY "Allow authenticated users to insert their own stories"
  ON public.audio_stories
  FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- (Optional for the future) Allow users to update or delete their own stories
CREATE POLICY "Allow users to update their own stories"
  ON public.audio_stories
  FOR UPDATE
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Allow users to delete their own stories"
  ON public.audio_stories
  FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Create a public storage bucket for audio uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('story-audio', 'story-audio', true);

-- Allow all users to upload audio files
-- (by default, public policies apply; make sure public can insert)
-- You might want to restrict the bucket in the future if abuse is a concern
