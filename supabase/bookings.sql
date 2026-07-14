-- ─────────────────────────────────────────────────────────────────────────────
-- Aspire Nursing Agency — Bookings table (normalised)
-- Run AFTER facilities.sql and contact-persons.sql.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

create sequence if not exists public.booking_number_seq start 1;

create or replace function public.next_booking_number()
returns text
language sql
as $$
  select 'BK_' || lpad(nextval('public.booking_number_seq')::text, 4, '0');
$$;

create table if not exists public.bookings (
  id                  uuid primary key default gen_random_uuid(),
  booking_number      text not null unique default public.next_booking_number(),

  -- Step 1: Selected role / service
  service_id          text not null,
  service_title       text not null,
  grade               smallint,  -- RN grade 1–5 when applicable; null for EN/PCA

  -- Step 3: Shift
  shift_start         timestamptz not null,
  shift_end           timestamptz not null,
  total_hours         numeric(6,2),

  -- Calculated pricing (ex-GST estimate from frontend; GST stored separately)
  subtotal            numeric(10,2),
  estimated_total     numeric(10,2),   -- ex-GST, after break
  gst_amount          numeric(10,2),
  total_with_gst      numeric(10,2),
  rate_breakdown      jsonb,
  break_applied       boolean not null default false,
  break_amount        numeric(10,2),
  overtime_applies    boolean not null default false,

  -- Step 4: Extra instructions
  notes               text,

  -- Links to facility + contact (created in same API request)
  facility_id         uuid references public.facilities(id) on delete set null,
  contact_person_id   uuid references public.contact_persons(id) on delete set null,

  status              text not null default 'pending',

  created_at          timestamptz not null default now()
);

create index if not exists bookings_created_at_idx        on public.bookings (created_at desc);
create index if not exists bookings_booking_number_idx    on public.bookings (booking_number);
create index if not exists bookings_service_id_idx        on public.bookings (service_id);
create index if not exists bookings_facility_id_idx       on public.bookings (facility_id);
create index if not exists bookings_contact_person_id_idx on public.bookings (contact_person_id);
create index if not exists bookings_status_idx            on public.bookings (status);

alter table public.bookings enable row level security;
