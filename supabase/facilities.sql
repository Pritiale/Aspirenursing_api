-- ─────────────────────────────────────────────────────────────────────────────
-- Aspire Nursing Agency — Facilities table
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- Stores the facility details captured in Step 2 of the booking flow. Only the
-- three fields the frontend collects today, plus a `status` column for admin use.
-- (We'll wire the API to write here later.)
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

create table if not exists public.facilities (
  id                uuid primary key default gen_random_uuid(),

  -- ── Step 2: Facility details ──
  facility_name     text not null,
  facility_address  text not null,
  facility_phone    text not null,

  status            text not null default 'active',  -- active | inactive | archived

  created_at        timestamptz not null default now()
);

create index if not exists facilities_created_at_idx on public.facilities (created_at desc);
create index if not exists facilities_status_idx      on public.facilities (status);

-- ── Row Level Security ─────────────────────────────────────────────────────────
-- RLS is ENABLED. The API talks to Supabase with the SERVICE ROLE key, which
-- bypasses RLS. No anon/authenticated policies — service role only.
alter table public.facilities enable row level security;
