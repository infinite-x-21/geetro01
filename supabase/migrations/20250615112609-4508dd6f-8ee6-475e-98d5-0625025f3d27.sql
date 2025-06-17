
-- Add a nullable category column to audio_stories
ALTER TABLE public.audio_stories
ADD COLUMN category text NULL;

-- (Recommended, but optional) Backfill with 'music', 'podcast', or 'stories' based on business rules

-- (Optional) Add an index for performance if you expect many category filters
CREATE INDEX IF NOT EXISTS audio_stories_category_idx ON public.audio_stories(category);
