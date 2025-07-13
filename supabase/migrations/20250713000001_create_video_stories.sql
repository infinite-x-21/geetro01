-- Create video_stories table
create table if not exists public.video_stories (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  video_url text,
  wallpaper_url text,
  youtube_url text,
  category text,
  uploaded_by uuid references auth.users(id) not null,
  created_at timestamptz default now(),
  likes integer default 0,
  description text,
  duration integer,
  views integer default 0
);
