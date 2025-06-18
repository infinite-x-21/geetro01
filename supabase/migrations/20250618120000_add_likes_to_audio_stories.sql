alter table "public"."audio_stories" add column if not exists "likes" integer not null default 0;
create index if not exists "audio_stories_likes_idx" on "public"."audio_stories" ("likes");
