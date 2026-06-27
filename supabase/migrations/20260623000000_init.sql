-- Erick Photo Editor — initial schema
-- Run with the Supabase CLI (`supabase db push`) OR paste into the Supabase
-- dashboard → SQL Editor → Run.

-- ─── profiles ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            text primary key,
  email         text,
  display_name  text,
  photo_url     text,
  is_premium    boolean default false,
  created_at    timestamptz default now()
);

-- ─── projects ───────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id                  uuid primary key,
  user_id             text not null,
  title               text,
  original_image_uri  text,
  edited_image_uri    text,
  thumbnail_uri       text,
  status              text default 'draft',
  is_favorite         boolean default false,
  width               int,
  height              int,
  file_size_bytes     bigint,
  applied_filter_id   text,
  applied_filter_name text,
  adjustments         jsonb,
  layers              jsonb,
  tags                text[],
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Each device signs in anonymously (Supabase Auth), so auth.uid() is a real,
-- stable id. Rows are scoped to their owner: a user can only read/write their
-- own projects. user_id stores auth.uid() as text.
--
-- REQUIRED: enable Anonymous sign-ins in the dashboard →
--   Authentication → Sign In / Providers → Anonymous → Enable.
alter table public.projects enable row level security;
alter table public.profiles enable row level security;

-- Clean up the earlier permissive policies if they exist.
drop policy if exists "anon full access projects" on public.projects;
drop policy if exists "anon full access profiles" on public.profiles;

drop policy if exists "own projects" on public.projects;
create policy "own projects" on public.projects
  for all
  to authenticated
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all
  to authenticated
  using (auth.uid()::text = id)
  with check (auth.uid()::text = id);

-- ─── Storage: project-images bucket ───────────────────────────────────────────
-- Public bucket so saved images display via their URL. Writes are restricted to
-- each user's own folder (the first path segment must equal their auth.uid()).
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

drop policy if exists "own images write" on storage.objects;
create policy "own images write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own images update" on storage.objects;
create policy "own images update" on storage.objects
  for update to authenticated
  using (bucket_id = 'project-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own images delete" on storage.objects;
create policy "own images delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-images' and (storage.foldername(name))[1] = auth.uid()::text);
