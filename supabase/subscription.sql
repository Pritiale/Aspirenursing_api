-- ─────────────────────────────────────────────────────────────────────────────
-- Aspire Nursing Agency — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- ─────────────────────────────────────────────────────────────────────────────

-- Extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ── Subscriptions (newsletter sign-ups) ──────────────────────────────────────
create table if not exists public.subscriptions (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  source       text default 'homepage',            -- where the sign-up came from
  status       text not null default 'active',      -- active | unsubscribed
  ip_address   text,                                -- optional, for abuse tracking
  user_agent   text,
  created_at   timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- One active row per email (case-insensitive)
create unique index if not exists subscriptions_email_unique
  on public.subscriptions (lower(email));

-- Fast ordering for the admin list
create index if not exists subscriptions_created_at_idx
  on public.subscriptions (created_at desc);

-- ── Row Level Security ───────────────────────────────────────────────────────
-- RLS is ENABLED. The API talks to Supabase with the SERVICE ROLE key, which
-- bypasses RLS entirely. No public policies are added, so the anon/publishable
-- key cannot read or write this table directly — all access must go through the
-- API project. This keeps subscriber emails private.
alter table public.subscriptions enable row level security;

-- (Intentionally NO policies for anon/authenticated — service role only.)
