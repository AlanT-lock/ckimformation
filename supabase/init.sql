-- =============================================================================
--  CKIM Formation — Schéma initial Supabase
-- =============================================================================
--  À exécuter UNE SEULE FOIS sur un projet Supabase vide, dans le SQL Editor.
--  L'ordre est important : extensions → types → tables → triggers → RLS → seed.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Types énumérés
-- -----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'formateur', 'stagiaire');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_type as enum ('particulier', 'entreprise');
exception when duplicate_object then null; end $$;

do $$ begin
  create type session_statut as enum ('draft', 'published', 'cancelled', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type inscription_statut as enum ('pending_payment', 'paid', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

-- Genre de "test" : libre (l'admin nomme ses tests), mais on caractérise sa
-- nature pour adapter l'affichage côté stagiaire.
do $$ begin
  create type test_kind as enum ('quiz', 'enquete', 'info');
exception when duplicate_object then null; end $$;

do $$ begin
  create type question_type as enum (
    'qcm_unique',     -- 1 seule bonne réponse parmi N
    'qcm_multiple',   -- N réponses possibles
    'texte_libre',    -- réponse texte longue
    'echelle',        -- 1 à N (N défini par question.echelle_max)
    'liste'           -- réponse courte / item
  );
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 2. Table profiles (1 ligne pour chaque auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  role                  user_role     not null default 'stagiaire',
  account_type          account_type,                          -- null pour admin/formateur
  full_name             text          not null default '',
  phone                 text,
  email                 text          not null,
  employer_profile_id   uuid references public.profiles(id) on delete set null,
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_employer on public.profiles(employer_profile_id);

-- -----------------------------------------------------------------------------
-- 3. Détails entreprise (1:1 avec profiles si account_type = entreprise)
-- -----------------------------------------------------------------------------
create table if not exists public.company_details (
  profile_id        uuid primary key references public.profiles(id) on delete cascade,
  raison_sociale    text not null,
  siret             text,
  tva_intra         text,
  contact_fonction  text,                                      -- poste du contact
  billing_address   jsonb default '{}'::jsonb,                 -- {rue, ville, cp, pays}
  created_at        timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4. Formations (référence — le contenu marketing reste dans lib/formations/*.ts)
-- -----------------------------------------------------------------------------
create table if not exists public.formations (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null,
  titre       text        not null,
  parcours    text,
  actif       boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 5. Sessions de formation
-- -----------------------------------------------------------------------------
create table if not exists public.sessions (
  id                uuid primary key default uuid_generate_v4(),
  formation_id      uuid not null references public.formations(id) on delete restrict,
  formateur_id      uuid references public.profiles(id) on delete set null,
  statut            session_statut not null default 'draft',
  adresse           jsonb not null default '{}'::jsonb,        -- {rue, ville, code_postal, complement, latitude, longitude}
  notes_internes    text,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_sessions_formation on public.sessions(formation_id);
create index if not exists idx_sessions_formateur on public.sessions(formateur_id);
create index if not exists idx_sessions_statut on public.sessions(statut);

-- -----------------------------------------------------------------------------
-- 6. Créneaux d'une session (J1 matin, J1 aprem, J2 matin, etc.)
-- -----------------------------------------------------------------------------
create table if not exists public.session_creneaux (
  id            uuid primary key default uuid_generate_v4(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  ordre         int  not null,
  date          date not null,
  heure_debut   time not null,
  heure_fin     time not null,
  created_at    timestamptz not null default now(),
  unique (session_id, ordre)
);

create index if not exists idx_creneaux_session on public.session_creneaux(session_id);

-- -----------------------------------------------------------------------------
-- 7. Tests / quiz / enquêtes (créés par l'admin pour chaque formation)
-- -----------------------------------------------------------------------------
create table if not exists public.tests (
  id              uuid primary key default uuid_generate_v4(),
  formation_id    uuid not null references public.formations(id) on delete cascade,
  nom             text not null,
  description     text,
  kind            test_kind not null default 'quiz',
  ordre           int  not null default 0,
  actif           boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_tests_formation on public.tests(formation_id);

-- -----------------------------------------------------------------------------
-- 8. Questions d'un test
-- -----------------------------------------------------------------------------
create table if not exists public.questions (
  id              uuid primary key default uuid_generate_v4(),
  test_id         uuid not null references public.tests(id) on delete cascade,
  ordre           int  not null default 0,
  libelle         text not null,
  type_reponse    question_type not null,
  options         jsonb default '[]'::jsonb,                   -- ["Option 1", "Option 2", ...] pour QCM/liste
  echelle_max     int,                                         -- 5 ou 10 si type_reponse = 'echelle'
  bonne_reponse   jsonb,                                       -- pour QCM auto-corrigés (optionnel)
  required        boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists idx_questions_test on public.questions(test_id);

-- -----------------------------------------------------------------------------
-- 9. Inscriptions (un participant à une session ; payeur = profil entreprise OU stagiaire)
-- -----------------------------------------------------------------------------
create table if not exists public.inscriptions (
  id                       uuid primary key default uuid_generate_v4(),
  session_id               uuid not null references public.sessions(id) on delete restrict,
  payer_profile_id         uuid not null references public.profiles(id) on delete restrict,
  participant_profile_id   uuid not null references public.profiles(id) on delete restrict,
  statut                   inscription_statut not null default 'pending_payment',
  montant_centimes         int,                                -- snapshot prix au moment de l'inscription
  stripe_session_id        text,
  paid_at                  timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (session_id, participant_profile_id)
);

create index if not exists idx_inscriptions_session on public.inscriptions(session_id);
create index if not exists idx_inscriptions_payer on public.inscriptions(payer_profile_id);
create index if not exists idx_inscriptions_participant on public.inscriptions(participant_profile_id);

-- -----------------------------------------------------------------------------
-- 10. Émargements (signature électronique par créneau)
-- -----------------------------------------------------------------------------
create table if not exists public.emargements (
  id              uuid primary key default uuid_generate_v4(),
  inscription_id  uuid not null references public.inscriptions(id) on delete cascade,
  creneau_id      uuid not null references public.session_creneaux(id) on delete cascade,
  signed_at       timestamptz not null default now(),
  signature_data  text,                                        -- dataURL PNG du tracé
  unique (inscription_id, creneau_id)
);

create index if not exists idx_emargements_inscription on public.emargements(inscription_id);
create index if not exists idx_emargements_creneau on public.emargements(creneau_id);

-- -----------------------------------------------------------------------------
-- 11. Déclencheurs de tests (le formateur "ouvre" un test pour sa session)
-- -----------------------------------------------------------------------------
create table if not exists public.session_test_triggers (
  id            uuid primary key default uuid_generate_v4(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  test_id       uuid not null references public.tests(id) on delete cascade,
  triggered_at  timestamptz not null default now(),
  triggered_by  uuid references public.profiles(id) on delete set null,
  unique (session_id, test_id)
);

create index if not exists idx_triggers_session on public.session_test_triggers(session_id);

-- -----------------------------------------------------------------------------
-- 12. Complétion d'un test par un stagiaire
-- -----------------------------------------------------------------------------
create table if not exists public.test_completions (
  id              uuid primary key default uuid_generate_v4(),
  inscription_id  uuid not null references public.inscriptions(id) on delete cascade,
  test_id         uuid not null references public.tests(id) on delete cascade,
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  unique (inscription_id, test_id)
);

create index if not exists idx_completions_inscription on public.test_completions(inscription_id);

-- -----------------------------------------------------------------------------
-- 13. Réponses aux questions
-- -----------------------------------------------------------------------------
create table if not exists public.responses (
  id              uuid primary key default uuid_generate_v4(),
  completion_id   uuid not null references public.test_completions(id) on delete cascade,
  question_id     uuid not null references public.questions(id) on delete cascade,
  valeur          text,                                        -- texte_libre, echelle, liste
  valeur_json     jsonb,                                       -- qcm_unique / qcm_multiple
  created_at      timestamptz not null default now(),
  unique (completion_id, question_id)
);

create index if not exists idx_responses_completion on public.responses(completion_id);

-- =============================================================================
--  FONCTIONS HELPER (pour les policies RLS)
-- =============================================================================

-- Rôle de l'utilisateur courant (NULL si non connecté)
create or replace function public.auth_role()
returns user_role
language sql stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- Trigger : à chaque création d'un user dans auth.users, on crée son profil
-- en lisant les metadata fournies à la signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role         user_role;
  v_account_type account_type;
begin
  v_role := coalesce(nullif(new.raw_user_meta_data->>'role',''), 'stagiaire')::user_role;
  v_account_type := nullif(new.raw_user_meta_data->>'account_type','')::account_type;

  insert into public.profiles (id, role, account_type, full_name, phone, email, employer_profile_id)
  values (
    new.id,
    v_role,
    v_account_type,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    new.email,
    nullif(new.raw_user_meta_data->>'employer_profile_id','')::uuid
  );

  -- Si compte entreprise, on prépare la ligne company_details
  if v_account_type = 'entreprise' then
    insert into public.company_details (profile_id, raison_sociale, siret, tva_intra, contact_fonction, billing_address)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'raison_sociale', ''),
      new.raw_user_meta_data->>'siret',
      new.raw_user_meta_data->>'tva_intra',
      new.raw_user_meta_data->>'contact_fonction',
      coalesce((new.raw_user_meta_data->>'billing_address')::jsonb, '{}'::jsonb)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
--  RLS — Row Level Security
-- =============================================================================

alter table public.profiles              enable row level security;
alter table public.company_details       enable row level security;
alter table public.formations            enable row level security;
alter table public.sessions              enable row level security;
alter table public.session_creneaux      enable row level security;
alter table public.tests                 enable row level security;
alter table public.questions             enable row level security;
alter table public.inscriptions          enable row level security;
alter table public.emargements           enable row level security;
alter table public.session_test_triggers enable row level security;
alter table public.test_completions      enable row level security;
alter table public.responses             enable row level security;

-- ---- profiles ---------------------------------------------------------------
drop policy if exists "profiles read self" on public.profiles;
create policy "profiles read self" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles read by admin" on public.profiles;
create policy "profiles read by admin" on public.profiles
  for select using (public.is_admin());

drop policy if exists "profiles read employees of my company" on public.profiles;
create policy "profiles read employees of my company" on public.profiles
  for select using (employer_profile_id = auth.uid());

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles update by admin" on public.profiles;
create policy "profiles update by admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ---- company_details --------------------------------------------------------
drop policy if exists "company read self or admin" on public.company_details;
create policy "company read self or admin" on public.company_details
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "company update self" on public.company_details;
create policy "company update self" on public.company_details
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ---- formations -------------------------------------------------------------
drop policy if exists "formations read all" on public.formations;
create policy "formations read all" on public.formations
  for select using (true);

drop policy if exists "formations write admin" on public.formations;
create policy "formations write admin" on public.formations
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- sessions ---------------------------------------------------------------
-- Lecture publique des sessions "published" pour le site vitrine via anon key.
-- Les drafts/cancelled sont invisibles au public.
drop policy if exists "sessions read published" on public.sessions;
create policy "sessions read published" on public.sessions
  for select using (statut = 'published');

drop policy if exists "sessions read by admin" on public.sessions;
create policy "sessions read by admin" on public.sessions
  for select using (public.is_admin());

drop policy if exists "sessions read by formateur" on public.sessions;
create policy "sessions read by formateur" on public.sessions
  for select using (formateur_id = auth.uid());

drop policy if exists "sessions write admin" on public.sessions;
create policy "sessions write admin" on public.sessions
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- session_creneaux -------------------------------------------------------
drop policy if exists "creneaux read public" on public.session_creneaux;
create policy "creneaux read public" on public.session_creneaux
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and (s.statut = 'published' or public.is_admin() or s.formateur_id = auth.uid())
    )
  );

drop policy if exists "creneaux write admin" on public.session_creneaux;
create policy "creneaux write admin" on public.session_creneaux
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- tests / questions ------------------------------------------------------
drop policy if exists "tests read all auth" on public.tests;
create policy "tests read all auth" on public.tests
  for select using (auth.uid() is not null);

drop policy if exists "tests write admin" on public.tests;
create policy "tests write admin" on public.tests
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "questions read all auth" on public.questions;
create policy "questions read all auth" on public.questions
  for select using (auth.uid() is not null);

drop policy if exists "questions write admin" on public.questions;
create policy "questions write admin" on public.questions
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- inscriptions -----------------------------------------------------------
drop policy if exists "inscriptions read self" on public.inscriptions;
create policy "inscriptions read self" on public.inscriptions
  for select using (
    payer_profile_id = auth.uid() or participant_profile_id = auth.uid()
  );

drop policy if exists "inscriptions read by admin" on public.inscriptions;
create policy "inscriptions read by admin" on public.inscriptions
  for select using (public.is_admin());

drop policy if exists "inscriptions read by formateur" on public.inscriptions;
create policy "inscriptions read by formateur" on public.inscriptions
  for select using (
    exists (select 1 from public.sessions s where s.id = session_id and s.formateur_id = auth.uid())
  );

drop policy if exists "inscriptions insert by payer" on public.inscriptions;
create policy "inscriptions insert by payer" on public.inscriptions
  for insert with check (payer_profile_id = auth.uid());

drop policy if exists "inscriptions update admin" on public.inscriptions;
create policy "inscriptions update admin" on public.inscriptions
  for update using (public.is_admin()) with check (public.is_admin());

-- ---- emargements ------------------------------------------------------------
drop policy if exists "emargements read self or staff" on public.emargements;
create policy "emargements read self or staff" on public.emargements
  for select using (
    public.is_admin()
    or exists (select 1 from public.inscriptions i where i.id = inscription_id and i.participant_profile_id = auth.uid())
    or exists (select 1 from public.inscriptions i join public.sessions s on s.id = i.session_id where i.id = inscription_id and s.formateur_id = auth.uid())
  );

drop policy if exists "emargements insert self" on public.emargements;
create policy "emargements insert self" on public.emargements
  for insert with check (
    exists (select 1 from public.inscriptions i where i.id = inscription_id and i.participant_profile_id = auth.uid())
  );

-- ---- session_test_triggers --------------------------------------------------
drop policy if exists "triggers read participants" on public.session_test_triggers;
create policy "triggers read participants" on public.session_test_triggers
  for select using (
    public.is_admin()
    or exists (select 1 from public.sessions s where s.id = session_id and s.formateur_id = auth.uid())
    or exists (select 1 from public.inscriptions i where i.session_id = session_id and i.participant_profile_id = auth.uid())
  );

drop policy if exists "triggers insert formateur" on public.session_test_triggers;
create policy "triggers insert formateur" on public.session_test_triggers
  for insert with check (
    public.is_admin()
    or exists (select 1 from public.sessions s where s.id = session_id and s.formateur_id = auth.uid())
  );

-- ---- test_completions / responses ------------------------------------------
drop policy if exists "completions read self or staff" on public.test_completions;
create policy "completions read self or staff" on public.test_completions
  for select using (
    public.is_admin()
    or exists (select 1 from public.inscriptions i where i.id = inscription_id and i.participant_profile_id = auth.uid())
    or exists (select 1 from public.inscriptions i join public.sessions s on s.id = i.session_id where i.id = inscription_id and s.formateur_id = auth.uid())
  );

drop policy if exists "completions insert self" on public.test_completions;
create policy "completions insert self" on public.test_completions
  for insert with check (
    exists (select 1 from public.inscriptions i where i.id = inscription_id and i.participant_profile_id = auth.uid())
  );

drop policy if exists "completions update self" on public.test_completions;
create policy "completions update self" on public.test_completions
  for update using (
    exists (select 1 from public.inscriptions i where i.id = inscription_id and i.participant_profile_id = auth.uid())
  );

drop policy if exists "responses read self or staff" on public.responses;
create policy "responses read self or staff" on public.responses
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.test_completions c
      join public.inscriptions i on i.id = c.inscription_id
      where c.id = completion_id and i.participant_profile_id = auth.uid()
    )
    or exists (
      select 1 from public.test_completions c
      join public.inscriptions i on i.id = c.inscription_id
      join public.sessions s on s.id = i.session_id
      where c.id = completion_id and s.formateur_id = auth.uid()
    )
  );

drop policy if exists "responses insert self" on public.responses;
create policy "responses insert self" on public.responses
  for insert with check (
    exists (
      select 1 from public.test_completions c
      join public.inscriptions i on i.id = c.inscription_id
      where c.id = completion_id and i.participant_profile_id = auth.uid()
    )
  );

-- =============================================================================
--  SEED — 13 formations existantes (slug = source de vérité côté code)
-- =============================================================================

insert into public.formations (slug, titre, parcours) values
  ('duerp-formation-accompagnement',          'DUERP — Formation & Accompagnement',                  'prevention'),
  ('elaboration-duerp-manager-sst',           'Élaboration DUERP & Manager S&ST',                    'management'),
  ('formateur-incendie-gestes-postures',      'Formateur Sécurité Incendie & Gestes et Postures',    'formateurs'),
  ('formateur-independant-interne',           'Formateur Indépendant ou Interne',                    'formateurs'),
  ('formateur-professionnel-adultes-fpa',     'Formateur Professionnel d''Adultes (FPA)',            'certifiant'),
  ('formateur-sst',                           'Formateur Sauveteur Secouriste du Travail',           'formateurs'),
  ('gestes-et-postures',                      'Gestes et Postures — Prévention des TMS',             'securite'),
  ('habilitation-electrique-b1v-b2v',         'Habilitation Électrique B1V / B2V',                   'securite'),
  ('habilitation-electrique-bs-be-manoeuvre', 'Habilitation Électrique BS / BE Manœuvre',            'securite'),
  ('habilitation-electrique-h0-b0',           'Habilitation Électrique H0 / B0',                     'securite'),
  ('hygiene-alimentaire-haccp',               'Hygiène Alimentaire HACCP',                           'alimentaire'),
  ('incendie-extincteur-evacuation',          'Formation Incendie — Extincteur & Évacuation',        'securite'),
  ('mac-formateur-sst',                       'Maintien & Actualisation des Compétences SST',        'formateurs'),
  ('mac-sst',                                 'MAC SST — Maintien et Actualisation des Compétences', 'securite'),
  ('pnl-controle-qualiopi',                   'PNL — Programmation Neuro-Linguistique',              'developpement'),
  ('preparer-controle-qualiopi',              'Préparer un Contrôle Qualité Qualiopi',               'qualite'),
  ('sst-initiale',                            'Sauveteur Secouriste du Travail — Formation initiale','securite')
on conflict (slug) do update set titre = excluded.titre, parcours = excluded.parcours;

-- =============================================================================
--  CRÉATION DU COMPTE ADMIN
-- =============================================================================
--  1) Dashboard Supabase → Authentication → Users → "Add user"
--     Email = ton email admin, Password = un mot de passe fort, "Auto Confirm User" coché
--  2) Le trigger handle_new_user() crée automatiquement un profil avec role='stagiaire'
--  3) Exécute la requête ci-dessous en remplaçant l'email :
--
--     update public.profiles
--     set    role = 'admin', full_name = 'Ton Nom'
--     where  email = 'admin@ckim-formation.fr';
--
-- =============================================================================
