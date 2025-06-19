
-- Create playlists table
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Playlist',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlist_items table for storing audio tracks in playlists
CREATE TABLE public.playlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  audio_story_id UUID NOT NULL REFERENCES public.audio_stories(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX idx_playlist_items_playlist_id ON public.playlist_items(playlist_id);
CREATE INDEX idx_playlist_items_position ON public.playlist_items(playlist_id, position);

-- Enable RLS on both tables
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for playlists table
CREATE POLICY "Users can view their own playlists" 
  ON public.playlists 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own playlists" 
  ON public.playlists 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own playlists" 
  ON public.playlists 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own playlists" 
  ON public.playlists 
  FOR DELETE 
  USING (user_id = auth.uid());

-- RLS policies for playlist_items table
CREATE POLICY "Users can view items in their playlists" 
  ON public.playlist_items 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.playlists p 
    WHERE p.id = playlist_items.playlist_id 
    AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can add items to their playlists" 
  ON public.playlist_items 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.playlists p 
    WHERE p.id = playlist_items.playlist_id 
    AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update items in their playlists" 
  ON public.playlist_items 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.playlists p 
    WHERE p.id = playlist_items.playlist_id 
    AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete items from their playlists" 
  ON public.playlist_items 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.playlists p 
    WHERE p.id = playlist_items.playlist_id 
    AND p.user_id = auth.uid()
  ));

-- Function to automatically update playlist positions
CREATE OR REPLACE FUNCTION update_playlist_positions()
RETURNS TRIGGER AS $$
BEGIN
  -- When deleting an item, update positions of remaining items
  IF TG_OP = 'DELETE' THEN
    UPDATE public.playlist_items 
    SET position = position - 1 
    WHERE playlist_id = OLD.playlist_id 
    AND position > OLD.position;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain consistent positions
CREATE TRIGGER maintain_playlist_positions
  AFTER DELETE ON public.playlist_items
  FOR EACH ROW EXECUTE FUNCTION update_playlist_positions();
