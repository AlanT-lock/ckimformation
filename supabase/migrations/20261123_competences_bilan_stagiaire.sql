-- =============================================================================
--  Bilan de fin de formation : niveau d'acquisition des compétences par stagiaire
-- =============================================================================
--  - inscription_participant_competences : pour chaque stagiaire d'une session,
--    le niveau attribué par le formateur à chaque compétence de la formation
--    (acquise / en cours d'acquisition / non acquise).
--  Le suivi de fin de journée (session_competences_vues) reste inchangé : il dit
--  ce que le groupe a vu ; cette table dit ce que chaque stagiaire a acquis.
--  Écritures : server actions (service-role) après contrôle du rôle.
--  Lecture directe : admin + formateur de la session ; l'entreprise et le
--  stagiaire lisent côté serveur après vérification de leurs droits.
--  Pré-requis : migration 20261017_competences_suivi.sql appliquée.
-- =============================================================================

create table if not exists public.inscription_participant_competences (
  id                          uuid primary key default uuid_generate_v4(),
  inscription_participant_id  uuid not null references public.inscription_participants(id) on delete cascade,
  competence_id               uuid not null references public.formation_competences(id) on delete cascade,
  niveau                      text not null check (niveau in ('acquise', 'en_cours', 'non_acquise')),
  evalue_by                   uuid references public.profiles(id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  unique (inscription_participant_id, competence_id)
);
create index if not exists idx_participant_competences_competence
  on public.inscription_participant_competences(competence_id);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.inscription_participant_competences enable row level security;

drop policy if exists "participant_competences read admin or formateur" on public.inscription_participant_competences;
create policy "participant_competences read admin or formateur" on public.inscription_participant_competences
  for select using (
    public.is_admin()
    or exists (
      select 1
        from public.inscription_participants ip
        join public.inscriptions i on i.id = ip.inscription_id
        join public.sessions s on s.id = i.session_id
       where ip.id = inscription_participant_id and s.formateur_id = auth.uid()
    )
  );
-- Insert / update / delete : service-role uniquement (server actions).
