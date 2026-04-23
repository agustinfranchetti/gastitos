-- Gastitos schema. Run once in your Supabase SQL editor.
-- Solo-per-user with RLS by auth.uid().

create extension if not exists "pgcrypto";

create table if not exists public.subscriptions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.people (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_idx on public.subscriptions(user_id);
create index if not exists people_user_idx on public.people(user_id);
create index if not exists categories_user_idx on public.categories(user_id);

alter table public.subscriptions enable row level security;
alter table public.people       enable row level security;
alter table public.categories   enable row level security;
alter table public.settings     enable row level security;

do $$
begin
  create policy "own rows" on public.subscriptions
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$
begin
  create policy "own rows" on public.people
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$
begin
  create policy "own rows" on public.categories
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$
begin
  create policy "own rows" on public.settings
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
