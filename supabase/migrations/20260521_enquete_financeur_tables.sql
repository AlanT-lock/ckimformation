-- =============================================================================
--  Enquête financeur — étape 2 : nullabilité + table de suivi + RLS
-- =============================================================================
--  - Une UNIQUE enquête de type 'financeur' (pas liée à une formation) :
--    on autorise donc tests.formation_id NULL pour ce kind. La cohérence
--    (formation_id NULL ssi kind='enquete' + enquete_kind='financeur') est
--    garantie côté application (server actions admin).
--  - 1 envoi par inscription (l'entreprise payeuse répond une fois par demande).
--  - Mail initial J+7 après la fin de la formation, relance toutes les 7j,
--    max 2 relances. Le payer doit être connecté pour répondre.
-- =============================================================================

-- 1. Autoriser tests.formation_id NULL
alter table public.tests alter column formation_id drop not null;

-- 2. Table de suivi des envois (1 ligne par inscription)
create table if not exists public.enquete_financeur_envois (
  id                       uuid primary key default uuid_generate_v4(),
  inscription_id           uuid not null references public.inscriptions(id) on delete cascade,
  test_id                  uuid not null references public.tests(id) on delete cascade,
  token                    text not null unique,
  scheduled_first_send_at  timestamptz not null,
  first_sent_at            timestamptz,
  last_reminder_at         timestamptz,
  reminder_count           int  not null default 0,
  responded_at             timestamptz,
  completion_id            uuid references public.test_completions(id) on delete set null,
  created_at               timestamptz not null default now(),
  unique (inscription_id)
);

create index if not exists idx_efinanceur_inscription
  on public.enquete_financeur_envois(inscription_id);
create index if not exists idx_efinanceur_pending
  on public.enquete_financeur_envois(scheduled_first_send_at)
  where responded_at is null;

-- 3. RLS : lecture admin + le payer de l'inscription
alter table public.enquete_financeur_envois enable row level security;

drop policy if exists "efinanceur read admin or payer" on public.enquete_financeur_envois;
create policy "efinanceur read admin or payer" on public.enquete_financeur_envois
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.inscriptions i
      where i.id = inscription_id and i.payer_profile_id = auth.uid()
    )
  );
-- Insert/update : via service-role uniquement (cron + server action /enquete-financeur)
