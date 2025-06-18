
-- Drop existing RLS policies if any exist on audio_stories table
DROP POLICY IF EXISTS "Users can view all audio stories" ON public.audio_stories;
DROP POLICY IF EXISTS "Users can view their own audio stories" ON public.audio_stories;
DROP POLICY IF EXISTS "Users can insert their own audio stories" ON public.audio_stories;
DROP POLICY IF EXISTS "Users can update their own audio stories" ON public.audio_stories;
DROP POLICY IF EXISTS "Users can delete their own audio stories" ON public.audio_stories;

-- Enable RLS on audio_stories table
ALTER TABLE public.audio_stories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to view all audio stories
CREATE POLICY "All users can view all audio stories" 
  ON public.audio_stories 
  FOR SELECT 
  USING (true);

-- Create policy to allow users to insert their own audio stories
CREATE POLICY "Users can insert their own audio stories" 
  ON public.audio_stories 
  FOR INSERT 
  WITH CHECK (auth.uid() = uploaded_by);

-- Create policy to allow users to update their own audio stories
CREATE POLICY "Users can update their own audio stories" 
  ON public.audio_stories 
  FOR UPDATE 
  USING (auth.uid() = uploaded_by);

-- Create policy to allow users to delete their own audio stories
CREATE POLICY "Users can delete their own audio stories" 
  ON public.audio_stories 
  FOR DELETE 
  USING (auth.uid() = uploaded_by);

-- Also create similar policies for profiles table to ensure all users can view all profiles
DROP POLICY IF EXISTS "All users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to view all profiles
CREATE POLICY "All users can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);
