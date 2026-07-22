-- ─────────────────────────────────────────────────────────────────────────────
-- Aspire Nursing Agency — contact form submissions
-- Run after subscription.sql in the Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  email       text not null,
  phone       text,
  company     text,
  message     text not null,
  status      text not null default 'new',
  ip_address  text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists contact_messages_status_idx
  on public.contact_messages (status);

alter table public.contact_messages enable row level security;
