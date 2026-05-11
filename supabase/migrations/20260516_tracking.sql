-- =============================================================================
--  Tracking analytics auto-hébergé (site vitrine)
-- =============================================================================
--  - sessions  : 1 par "browser session" (sessionStorage), avec visitor_id
--                stable (localStorage) et profile_id quand l'utilisateur est
--                connecté à Supabase
--  - pageviews : 1 par page consultée, durée + max scroll %
--  - events    : clics CTA via attribut data-track
--
--  RLS : lecture admin uniquement. Les écritures passent par /api/track
--  côté serveur avec la service_role key (bypass RLS).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. tracking_sessions
-- -----------------------------------------------------------------------------
create table if not exists public.tracking_sessions (
  id              uuid primary key default uuid_generate_v4(),
  visitor_id      text not null,
  profile_id      uuid references public.profiles(id) on delete set null,
  user_agent      text,
  referrer_host   text,
  started_at      timestamptz not null default now(),
  last_seen_at    timestamptz not null default now()
);

create index if not exists idx_track_sessions_visitor on public.tracking_sessions(visitor_id);
create index if not exists idx_track_sessions_profile on public.tracking_sessions(profile_id);
create index if not exists idx_track_sessions_started on public.tracking_sessions(started_at desc);

alter table public.tracking_sessions enable row level security;

drop policy if exists "track sessions read admin" on public.tracking_sessions;
create policy "track sessions read admin" on public.tracking_sessions
  for select using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 2. tracking_pageviews
-- -----------------------------------------------------------------------------
create table if not exists public.tracking_pageviews (
  id                       uuid primary key default uuid_generate_v4(),
  session_id               uuid not null references public.tracking_sessions(id) on delete cascade,
  url_path                 text not null,
  page_title               text,
  started_at               timestamptz not null default now(),
  ended_at                 timestamptz,
  duration_ms              int,
  max_scroll_pct           int not null default 0,
  scroll_25_at             timestamptz,
  scroll_50_at             timestamptz,
  scroll_75_at             timestamptz,
  scroll_100_at            timestamptz
);

create index if not exists idx_track_pv_session on public.tracking_pageviews(session_id);
create index if not exists idx_track_pv_path on public.tracking_pageviews(url_path);
create index if not exists idx_track_pv_started on public.tracking_pageviews(started_at desc);

alter table public.tracking_pageviews enable row level security;

drop policy if exists "track pv read admin" on public.tracking_pageviews;
create policy "track pv read admin" on public.tracking_pageviews
  for select using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. tracking_events
-- -----------------------------------------------------------------------------
create table if not exists public.tracking_events (
  id           uuid primary key default uuid_generate_v4(),
  session_id   uuid not null references public.tracking_sessions(id) on delete cascade,
  pageview_id  uuid references public.tracking_pageviews(id) on delete set null,
  name         text not null,
  props        jsonb not null default '{}'::jsonb,
  occurred_at  timestamptz not null default now()
);

create index if not exists idx_track_evt_session on public.tracking_events(session_id);
create index if not exists idx_track_evt_name on public.tracking_events(name);
create index if not exists idx_track_evt_occurred on public.tracking_events(occurred_at desc);

alter table public.tracking_events enable row level security;

drop policy if exists "track events read admin" on public.tracking_events;
create policy "track events read admin" on public.tracking_events
  for select using (public.is_admin());
