
-- Create a table for video stories
CREATE TABLE public.video_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  wallpaper_url TEXT,
  youtube_url TEXT,
  uploaded_by UUID REFERENCES auth.users NOT NULL,
  category TEXT DEFAULT 'videos',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS on the video_stories table
ALTER TABLE public.video_stories ENABLE ROW LEVEL SECURITY;

-- Allow users to select and view all video stories (public feed)
CREATE POLICY "Allow read access to all video stories"
  ON public.video_stories
  FOR SELECT
  USING (true);

-- Allow insertion only for authenticated users, restrict to their own user_id
CREATE POLICY "Allow authenticated users to insert their own video stories"
  ON public.video_stories
  FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- Allow users to update or delete their own video stories
CREATE POLICY "Allow users to update their own video stories"
  ON public.video_stories
  FOR UPDATE
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Allow users to delete their own video stories"
  ON public.video_stories
  FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Create a public storage bucket for video uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('story-videos', 'story-videos', true);

-- Create a public storage bucket for video wallpapers
INSERT INTO storage.buckets (id, name, public) VALUES ('video-wallpapers', 'video-wallpapers', true);
