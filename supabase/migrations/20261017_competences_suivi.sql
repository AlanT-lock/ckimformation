-- =============================================================================
--  Compétences par formation + fin de journée formateur + suivi entreprise
-- =============================================================================
--  - formation_competences : liste des compétences d'une formation (admin).
--  - session_journees : une ligne par journée (date) terminée par le formateur,
--    avec un commentaire général ; email_sent_at = récap envoyé aux entreprises.
--  - session_competences_vues : compétence vue lors d'une journée. Une compétence
--    n'est vue qu'une fois par session (unique session_id + competence_id).
--  - session_journee_commentaires : commentaire du formateur sur un stagiaire
--    rattaché à une entreprise, pour une journée.
--  Écritures : server actions (service-role) après contrôle du rôle.
--  Lecture directe : admin + formateur de la session ; l'espace entreprise lit
--  côté serveur après vérification du payeur.
-- =============================================================================

create table if not exists public.formation_competences (
  id            uuid primary key default uuid_generate_v4(),
  formation_id  uuid not null references public.formations(id) on delete cascade,
  libelle       text not null,
  ordre         int  not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists idx_formation_competences_formation
  on public.formation_competences(formation_id, ordre);

create table if not exists public.session_journees (
  id                   uuid primary key default uuid_generate_v4(),
  session_id           uuid not null references public.sessions(id) on delete cascade,
  date                 date not null,
  terminee_at          timestamptz,
  terminee_by          uuid references public.profiles(id) on delete set null,
  commentaire_general  text,
  email_sent_at        timestamptz,
  updated_at           timestamptz not null default now(),
  unique (session_id, date)
);
create index if not exists idx_session_journees_session on public.session_journees(session_id);

create table if not exists public.session_competences_vues (
  id             uuid primary key default uuid_generate_v4(),
  session_id     uuid not null references public.sessions(id) on delete cascade,
  competence_id  uuid not null references public.formation_competences(id) on delete cascade,
  journee_id     uuid not null references public.session_journees(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (session_id, competence_id)
);
create index if not exists idx_competences_vues_journee on public.session_competences_vues(journee_id);

create table if not exists public.session_journee_commentaires (
  id                          uuid primary key default uuid_generate_v4(),
  journee_id                  uuid not null references public.session_journees(id) on delete cascade,
  inscription_participant_id  uuid not null references public.inscription_participants(id) on delete cascade,
  commentaire                 text not null,
  updated_at                  timestamptz not null default now(),
  unique (journee_id, inscription_participant_id)
);
create index if not exists idx_journee_commentaires_participant
  on public.session_journee_commentaires(inscription_participant_id);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.formation_competences        enable row level security;
alter table public.session_journees             enable row level security;
alter table public.session_competences_vues     enable row level security;
alter table public.session_journee_commentaires enable row level security;

drop policy if exists "formation_competences read authenticated" on public.formation_competences;
create policy "formation_competences read authenticated" on public.formation_competences
  for select using (auth.uid() is not null);

drop policy if exists "session_journees read admin or formateur" on public.session_journees;
create policy "session_journees read admin or formateur" on public.session_journees
  for select using (
    public.is_admin()
    or exists (select 1 from public.sessions s where s.id = session_id and s.formateur_id = auth.uid())
  );

drop policy if exists "competences_vues read admin or formateur" on public.session_competences_vues;
create policy "competences_vues read admin or formateur" on public.session_competences_vues
  for select using (
    public.is_admin()
    or exists (select 1 from public.sessions s where s.id = session_id and s.formateur_id = auth.uid())
  );

drop policy if exists "journee_commentaires read admin or formateur" on public.session_journee_commentaires;
create policy "journee_commentaires read admin or formateur" on public.session_journee_commentaires
  for select using (
    public.is_admin()
    or exists (
      select 1
        from public.session_journees j
        join public.sessions s on s.id = j.session_id
       where j.id = journee_id and s.formateur_id = auth.uid()
    )
  );
-- Insert / update / delete : service-role uniquement (server actions).
