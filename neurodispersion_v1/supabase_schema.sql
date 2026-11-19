-- NeuroDispersion v1.1 — Supabase schema
-- Run this in Supabase SQL Editor.
-- Data are pseudonymous research records; do not store direct identifiers.

create extension if not exists pgcrypto;

create table if not exists public.neurodispersion_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  subject_id text not null,
  assessment_date date not null default current_date,
  demographics jsonb not null default '{}'::jsonb,
  clinical_features jsonb not null default '{}'::jsonb,
  raw_scores jsonb not null default '{}'::jsonb,
  percentiles jsonb not null default '{}'::jsonb,
  domains jsonb not null default '{}'::jsonb,
  outputs jsonb not null default '{}'::jsonb,
  model_version text not null default 'prototype-1.1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists neurodispersion_records_owner_idx
  on public.neurodispersion_records(owner_id, created_at desc);
create index if not exists neurodispersion_records_subject_idx
  on public.neurodispersion_records(owner_id, subject_id);

alter table public.neurodispersion_records enable row level security;

-- Least privilege: signed-out visitors get no table access.
revoke all on table public.neurodispersion_records from anon, authenticated;
grant select, insert, update, delete on table public.neurodispersion_records to authenticated;

-- Each authenticated researcher can access only their own rows.
drop policy if exists "select own neurodispersion records" on public.neurodispersion_records;
create policy "select own neurodispersion records"
on public.neurodispersion_records for select
to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "insert own neurodispersion records" on public.neurodispersion_records;
create policy "insert own neurodispersion records"
on public.neurodispersion_records for insert
to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "update own neurodispersion records" on public.neurodispersion_records;
create policy "update own neurodispersion records"
on public.neurodispersion_records for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "delete own neurodispersion records" on public.neurodispersion_records;
create policy "delete own neurodispersion records"
on public.neurodispersion_records for delete
to authenticated
using ((select auth.uid()) = owner_id);

-- Optional uniqueness if you want one row per subject per date:
-- create unique index neurodispersion_subject_date_unique
--   on public.neurodispersion_records(owner_id, subject_id, assessment_date);
