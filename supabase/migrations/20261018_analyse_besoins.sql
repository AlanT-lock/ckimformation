-- =============================================================================
--  Analyse des besoins configurable par formation
-- =============================================================================
--  - Nouveau type de test « analyse_besoins » : un questionnaire par formation
--    (tests.formation_id) ou le questionnaire par défaut (formation_id NULL),
--    créé à la volée par l'application. Ce script n'utilise PAS la nouvelle
--    valeur d'enum (interdit dans la même transaction que son ajout).
--  - besoins_reponses : réponses d'une demande d'inscription (inscription_id)
--    ou d'une session dédiée (session_id), avec un instantané des questions.
--  Lecture : admin. Écriture : server actions (service-role).
-- =============================================================================

alter type test_kind add value if not exists 'analyse_besoins';

create table if not exists public.besoins_reponses (
  id              uuid primary key default uuid_generate_v4(),
  test_id         uuid references public.tests(id) on delete set null,
  inscription_id  uuid references public.inscriptions(id) on delete cascade,
  session_id      uuid references public.sessions(id) on delete cascade,
  answers         jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint besoins_reponses_cible check (
    (inscription_id is not null and session_id is null)
    or (inscription_id is null and session_id is not null)
  ),
  unique (inscription_id),
  unique (session_id)
);

alter table public.besoins_reponses enable row level security;

drop policy if exists "besoins_reponses read admin" on public.besoins_reponses;
create policy "besoins_reponses read admin" on public.besoins_reponses
  for select using (public.is_admin());
-- Insert / update : service-role uniquement (server actions).
