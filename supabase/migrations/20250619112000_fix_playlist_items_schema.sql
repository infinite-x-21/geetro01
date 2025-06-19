-- Ensure playlist_items table has correct columns and foreign keys
alter table if exists public.playlist_items
  add column if not exists audio_story_id uuid references public.audio_stories(id) on delete cascade,
  add column if not exists playlist_id uuid references public.playlists(id) on delete cascade,
  add column if not exists position int4,
  add column if not exists added_at timestamptz default now();

-- Remove any incorrect/duplicate columns
-- (No-op if already correct)
