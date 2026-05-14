-- =============================================================================
--  Logs d'envoi des emails de satisfaction (traçabilité Qualiopi)
-- =============================================================================
--  - Trace les emails d'enquête de satisfaction (à froid + financeur).
--  - Permet d'afficher l'historique des envois côté fiche stagiaire admin.
--  - Insert via service-role (cron), lecture admin via RLS.
-- =============================================================================

create table if not exists public.email_logs (
  id               uuid primary key default uuid_generate_v4(),
  sent_at          timestamptz not null default now(),
  kind             text not null,                                    -- 'enquete_froid' | 'enquete_financeur'
  to_email         text not null,
  to_profile_id    uuid references public.profiles(id) on delete set null,
  subject          text not null,
  status           text not null default 'sent',                     -- 'sent' | 'failed'
  error_message    text,
  ref_table        text,                                             -- 'enquete_froid_envois' | 'enquete_financeur_envois'
  ref_id           uuid,
  is_reminder      boolean not null default false,
  reminder_number  int,
  metadata         jsonb default '{}'::jsonb                         -- formationTitre, inscription_id, etc.
);

create index if not exists idx_email_logs_to_profile on public.email_logs(to_profile_id);
create index if not exists idx_email_logs_to_email   on public.email_logs(to_email);
create index if not exists idx_email_logs_kind       on public.email_logs(kind);
create index if not exists idx_email_logs_sent_at    on public.email_logs(sent_at desc);

-- RLS : lecture admin uniquement
alter table public.email_logs enable row level security;

drop policy if exists "email_logs admin read" on public.email_logs;
create policy "email_logs admin read" on public.email_logs
  for select using (public.is_admin());

-- Insert / update : via service-role uniquement (pas de policy)
