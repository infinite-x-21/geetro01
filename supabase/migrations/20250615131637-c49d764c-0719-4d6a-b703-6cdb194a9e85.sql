
-- Profiles table banaye user info ke liye
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  updated_at timestamp with time zone default now()
);

-- Jab bhi naya user sign up kare, profile me row daale
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles(id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- RLS enable kare takki har user apna hi profile dekh/modify kare
alter table public.profiles enable row level security;

create policy "Users can view and edit their own profile"
  on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles
  for insert with check (auth.uid() = id);

