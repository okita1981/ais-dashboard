-- AIS Dashboard — ais_events table
-- Run this in the Supabase SQL Editor for project tgxnvzxqavduokchykga
-- Coexists alongside Emergence Scope tables (ais_ prefix avoids collision).

create table if not exists public.ais_events (
  id uuid primary key default gen_random_uuid(),

  -- Identity
  ad_id text not null,
  ad_name text not null,
  ad_type text not null check (ad_type in ('Popup', 'Banner', 'Native', 'Video')),

  -- Raw log inputs (matches types.ts AdLog shape)
  duration numeric not null default 0,
  occupancy numeric not null default 0,
  volume_level numeric not null default 0,
  is_sticky boolean not null default false,
  is_forced boolean not null default false,
  is_interrupted boolean not null default false,
  is_audio_intrusive boolean not null default false,
  continue_after_ad boolean not null default true,
  no_mute boolean not null default true,
  no_skip boolean not null default true,
  no_leave boolean not null default true,

  -- User action snapshot (skip / mute / leave / view)
  user_action text check (user_action in ('view', 'skip', 'mute', 'leave', 'reset')),

  -- Derived scores (server-side calculated via logic.ts)
  exposure numeric not null,
  vaf numeric not null,
  ais_score numeric not null,
  status text not null check (status in ('healthy', 'warning', 'critical')),

  -- Metadata
  client_timestamp timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists ais_events_created_at_idx on public.ais_events (created_at desc);
create index if not exists ais_events_ad_type_idx on public.ais_events (ad_type);
create index if not exists ais_events_status_idx on public.ais_events (status);

-- Row Level Security: permissive for demo (tighten in production)
alter table public.ais_events enable row level security;

-- Allow public anon insert (DemoPage posts events)
drop policy if exists "ais_events_anon_insert" on public.ais_events;
create policy "ais_events_anon_insert"
  on public.ais_events
  for insert
  to anon
  with check (true);

-- Allow public anon select (Dashboard reads aggregates)
drop policy if exists "ais_events_anon_select" on public.ais_events;
create policy "ais_events_anon_select"
  on public.ais_events
  for select
  to anon
  using (true);

-- Sanity check
comment on table public.ais_events is 'AIS Dashboard demo events. RLS permissive — tighten when adding auth.';
