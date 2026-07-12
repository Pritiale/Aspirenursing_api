-- ═══════════════════════════════════════════════════════════════════════════
-- profiles: extra info for each authenticated user (1:1 with auth.users)
-- Run this in Supabase → SQL Editor.
-- Users are created directly in Supabase (Authentication → Users → Add user);
-- there is no public signup. A profile row is auto-created for each new user.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'admin',
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A signed-in user can read/update only their own profile row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile whenever a new auth user is added.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users that already exist.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;
