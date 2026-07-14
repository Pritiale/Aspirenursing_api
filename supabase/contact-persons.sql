-- ─────────────────────────────────────────────────────────────────────────────
-- Aspire Nursing Agency — Contact persons table
-- Run this AFTER facilities.sql (it references public.facilities).
--
-- Stores the "Booking contact" captured in Step 4 of the booking flow, linked
-- to the facility it belongs to.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

create table if not exists public.contact_persons (
  id                uuid primary key default gen_random_uuid(),

  -- ── Step 4: Booking contact ──
  contact_name      text not null,   -- booking person name (full name)
  contact_position  text not null,   -- e.g. Care Manager
  contact_email     text not null,

  -- Linked facility (the "company" record)
  facility_id       uuid references public.facilities(id) on delete set null,

  status            text not null default 'active',  -- active | inactive | archived

  created_at        timestamptz not null default now()
);

create index if not exists contact_persons_facility_id_idx on public.contact_persons (facility_id);
create index if not exists contact_persons_created_at_idx  on public.contact_persons (created_at desc);
create index if not exists contact_persons_status_idx      on public.contact_persons (status);

-- ── Row Level Security ─────────────────────────────────────────────────────────
-- RLS is ENABLED. Service role only (API) — no anon/authenticated policies.
alter table public.contact_persons enable row level security;
