-- =============================================================================
--  Tests vs Enquêtes (à chaud / à froid) + scoring QCM + envois enquête froide
-- =============================================================================
--  - tests.enquete_kind  : 'a_chaud' | 'a_froid' (NULL pour les vrais tests)
--  - questions.bonne_reponse existait déjà → on l'utilise pour le scoring
--  - enquete_froid_envois : tracking des envois email + token anonyme pour
--    que le stagiaire puisse répondre sans login (le lien reste valide tant
--    que l'enquête n'est pas répondue)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enum + colonne
-- -----------------------------------------------------------------------------
do $$ begin
  create type enquete_kind as enum ('a_chaud', 'a_froid');
exception when duplicate_object then null; end $$;

alter table public.tests
  add column if not exists enquete_kind enquete_kind;

create index if not exists idx_tests_enquete_kind on public.tests(enquete_kind);

-- -----------------------------------------------------------------------------
-- 2. Table de suivi des envois enquête froide
-- -----------------------------------------------------------------------------
create table if not exists public.enquete_froid_envois (
  id                          uuid primary key default uuid_generate_v4(),
  test_id                     uuid not null references public.tests(id) on delete cascade,
  inscription_participant_id  uuid not null references public.inscription_participants(id) on delete cascade,
  session_id                  uuid not null references public.sessions(id) on delete cascade,
  token                       text not null unique,
  scheduled_first_send_at     timestamptz not null,
  first_sent_at               timestamptz,
  last_reminder_at            timestamptz,
  reminder_count              int not null default 0,
  responded_at                timestamptz,
  created_at                  timestamptz not null default now(),
  unique (test_id, inscription_participant_id)
);

create index if not exists idx_efe_test on public.enquete_froid_envois(test_id);
create index if not exists idx_efe_part on public.enquete_froid_envois(inscription_participant_id);
create index if not exists idx_efe_pending
  on public.enquete_froid_envois(scheduled_first_send_at)
  where responded_at is null;

-- -----------------------------------------------------------------------------
-- 3. RLS
-- -----------------------------------------------------------------------------
alter table public.enquete_froid_envois enable row level security;

-- Lecture : admin + formateur de la session ; insert/update via service-role
drop policy if exists "efe read admin or formateur" on public.enquete_froid_envois;
create policy "efe read admin or formateur" on public.enquete_froid_envois
  for select using (
    public.is_admin()
    or exists (select 1 from public.sessions s where s.id = session_id and s.formateur_id = auth.uid())
  );
