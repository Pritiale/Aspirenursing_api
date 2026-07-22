-- ─────────────────────────────────────────────────────────────────────────────
-- Aspire Nursing Agency — career postings
-- Run after contact-messages.sql in the Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

create table if not exists public.careers (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  location         text not null,
  department       text not null,
  job_type         text not null,
  salary           text,
  about_role       text not null,
  responsibilities jsonb not null default '[]'::jsonb,
  requirements     jsonb not null default '[]'::jsonb,
  benefits         jsonb not null default '[]'::jsonb,
  apply_url        text not null,
  status           text not null default 'draft',
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint careers_status_check check (status in ('draft', 'published', 'closed'))
);

create index if not exists careers_status_idx on public.careers (status);
create index if not exists careers_sort_order_idx on public.careers (sort_order desc, created_at desc);
create index if not exists careers_location_idx on public.careers (location);

alter table public.careers enable row level security;

-- Sample postings (replace apply_url with your JotForm links in admin)
insert into public.careers (
  title, location, department, job_type, salary, about_role,
  responsibilities, requirements, benefits, apply_url, status, sort_order
) values
(
  'Registered Nurse (RN) — Aged Care',
  'Melbourne, VIC',
  'Registered Nurse',
  'Casual',
  'Competitive hourly rates',
  'Experienced Registered Nurses wanted to join our aged care agency network across Melbourne and Victoria. Flexible shifts — you choose your availability. Must hold current AHPRA registration and aged care experience.',
  '["Deliver safe, person-centred clinical care in residential aged care settings","Administer medications in line with facility policies and Victorian reforms","Complete accurate clinical documentation and handover","Collaborate with ENs, PCAs and facility leadership","Represent Aspire Nursing Agency professionally on every shift"]'::jsonb,
  '["Current AHPRA registration as a Registered Nurse","Minimum 1 year aged care or residential care experience","Police check and working with children check (if required)","Right to work in Australia","Strong communication and teamwork skills"]'::jsonb,
  '["Flexible casual shifts to suit your schedule","Competitive pay rates with transparent pricing","Steady flow of shifts across Melbourne and Victoria","Supportive agency team and shift coordination","Work with facilities that value quality aged care"]'::jsonb,
  'https://form.jotform.com/',
  'published',
  30
),
(
  'Enrolled Nurse (EN) — Aged Care',
  'Melbourne, VIC',
  'Enrolled Nurse',
  'Casual',
  'Competitive hourly rates',
  'We are seeking reliable Enrolled Nurses with aged care experience to support residential facilities across Melbourne. Enjoy flexible rostering and ongoing shift opportunities with a specialist aged care agency.',
  '["Provide direct resident care under RN delegation","Support medication rounds and clinical observations","Assist with care planning and documentation","Maintain professional relationships with residents and staff","Deliver care consistent with Aspire Nursing Agency standards"]'::jsonb,
  '["Current AHPRA registration as an Enrolled Nurse","Aged care or residential care experience preferred","Police check","Right to work in Australia","Reliable transport across metro Melbourne"]'::jsonb,
  '["Flexible casual work","Competitive EN rates","Regular shift opportunities","Agency scheduling and admin support","Join a team that specialises 100% in aged care"]'::jsonb,
  'https://form.jotform.com/',
  'published',
  20
),
(
  'Personal Care Assistant (PCA) — Aged Care',
  'Victoria-wide',
  'Personal Care',
  'Casual',
  'Competitive hourly rates',
  'Personal Care Assistants with a passion for aged care are invited to join Aspire Nursing Agency. Support residents with daily living activities across residential aged care facilities in Melbourne and regional Victoria.',
  '["Assist residents with personal care and daily living activities","Support meal times, mobility and social engagement","Follow individual care plans and facility procedures","Report changes in resident condition to nursing staff","Maintain a respectful, dignified approach to care"]'::jsonb,
  '["Certificate III or IV in Individual Support (Ageing) or equivalent","Aged care experience preferred","Police check","Right to work in Australia","Compassionate, reliable and professional manner"]'::jsonb,
  '["Flexible shifts across Victoria","Competitive PCA rates","Ongoing placement opportunities","Dedicated agency support team","Work with an aged care specialist agency"]'::jsonb,
  'https://form.jotform.com/',
  'published',
  10
);
