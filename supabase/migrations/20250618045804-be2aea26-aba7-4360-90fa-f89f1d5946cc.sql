
-- Create followers table to track user relationships (18-06-2025)
CREATE TABLE public.followers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Add RLS policies for followers table
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Users can view all follower relationships
CREATE POLICY "Users can view follower relationships" 
  ON public.followers 
  FOR SELECT 
  USING (true);

-- Users can follow other users
CREATE POLICY "Users can follow others" 
  ON public.followers 
  FOR INSERT 
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow others
CREATE POLICY "Users can unfollow others" 
  ON public.followers 
  FOR DELETE 
  USING (auth.uid() = follower_id);

-- Add RLS policies to audio_stories table so users can view others' stories
CREATE POLICY "Users can view all audio stories" 
  ON public.audio_stories 
  FOR SELECT 
  USING (true);

-- Add RLS policies to profiles table so users can view other profiles
CREATE POLICY "Users can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

-- Create function to get follower counts
CREATE OR REPLACE FUNCTION get_user_stats(user_id uuid)
RETURNS TABLE(followers_count bigint, following_count bigint) 
LANGUAGE sql STABLE
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.followers WHERE following_id = user_id) as followers_count,
    (SELECT COUNT(*) FROM public.followers WHERE follower_id = user_id) as following_count;
$$;
