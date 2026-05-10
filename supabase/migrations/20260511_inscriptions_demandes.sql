-- =============================================================================
--  Refonte des inscriptions : demandes multi-participants + fiches salariés
-- =============================================================================
--  - Stripe/paiement laissé en dormant (colonnes conservées)
--  - Statuts inscription : pending_payment/paid/cancelled/refunded laissés mais
--    workflow effectif = en_attente / confirmee / refusee
--  - 1 inscription (= 1 demande) peut porter N participants via
--    inscription_participants (polymorphe : profile OU employee)
--  - Fiches salariés stockées dans employees, avec profile_id nullable jusqu'à
--    ce que le formateur déclenche la création de compte (étape ultérieure)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Nouveaux statuts inscription
-- -----------------------------------------------------------------------------
alter type inscription_statut add value if not exists 'en_attente';
alter type inscription_statut add value if not exists 'confirmee';
alter type inscription_statut add value if not exists 'refusee';

-- -----------------------------------------------------------------------------
-- 2. Table employees (fiches salariés rattachées à un compte entreprise)
-- -----------------------------------------------------------------------------
create table if not exists public.employees (
  id                    uuid primary key default uuid_generate_v4(),
  employer_profile_id   uuid not null references public.profiles(id) on delete cascade,
  profile_id            uuid references public.profiles(id) on delete set null,
  prenom                text not null,
  nom                   text not null,
  email                 text not null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (employer_profile_id, email)
);

create index if not exists idx_employees_employer on public.employees(employer_profile_id);
create index if not exists idx_employees_profile on public.employees(profile_id);

-- -----------------------------------------------------------------------------
-- 3. Refonte inscriptions
-- -----------------------------------------------------------------------------
-- Champ "Analyse des besoins" obligatoire à la demande
alter table public.inscriptions
  add column if not exists analyse_besoins text;

alter table public.inscriptions
  add column if not exists refus_motif text;

alter table public.inscriptions
  add column if not exists confirmed_at timestamptz;

alter table public.inscriptions
  add column if not exists refused_at timestamptz;

-- Le participant unique disparaît : il est porté par inscription_participants
alter table public.inscriptions
  drop constraint if exists inscriptions_session_id_participant_profile_id_key;

alter table public.inscriptions
  alter column participant_profile_id drop not null;

-- Note : on ne change PAS le default de statut ici.
-- Postgres interdit d'utiliser une nouvelle valeur d'enum dans la même
-- transaction que sa création. Le code applicatif fixe toujours statut
-- explicitement ('en_attente' à la création d'une demande), donc le default
-- BDD historique reste sans impact. Si besoin, un second script pourra le
-- modifier après commit du présent fichier.

-- -----------------------------------------------------------------------------
-- 4. Table inscription_participants (polymorphe : employee OU profile)
-- -----------------------------------------------------------------------------
create table if not exists public.inscription_participants (
  id                       uuid primary key default uuid_generate_v4(),
  inscription_id           uuid not null references public.inscriptions(id) on delete cascade,
  employee_id              uuid references public.employees(id) on delete restrict,
  participant_profile_id   uuid references public.profiles(id) on delete restrict,
  created_at               timestamptz not null default now(),
  check (
    (employee_id is not null)::int + (participant_profile_id is not null)::int = 1
  )
);

create index if not exists idx_insc_part_inscription on public.inscription_participants(inscription_id);
create index if not exists idx_insc_part_employee on public.inscription_participants(employee_id);
create index if not exists idx_insc_part_profile on public.inscription_participants(participant_profile_id);

-- Empêche le doublon d'un même participant sur une même inscription
create unique index if not exists uniq_insc_part_employee
  on public.inscription_participants (inscription_id, employee_id)
  where employee_id is not null;

create unique index if not exists uniq_insc_part_profile
  on public.inscription_participants (inscription_id, participant_profile_id)
  where participant_profile_id is not null;

-- -----------------------------------------------------------------------------
-- 5. RLS — employees
-- -----------------------------------------------------------------------------
alter table public.employees enable row level security;

drop policy if exists "employees read employer or admin" on public.employees;
create policy "employees read employer or admin" on public.employees
  for select using (
    employer_profile_id = auth.uid()
    or public.is_admin()
    or profile_id = auth.uid()
  );

drop policy if exists "employees insert by employer" on public.employees;
create policy "employees insert by employer" on public.employees
  for insert with check (employer_profile_id = auth.uid());

drop policy if exists "employees update by employer or admin" on public.employees;
create policy "employees update by employer or admin" on public.employees
  for update using (employer_profile_id = auth.uid() or public.is_admin())
  with check (employer_profile_id = auth.uid() or public.is_admin());

drop policy if exists "employees delete by employer or admin" on public.employees;
create policy "employees delete by employer or admin" on public.employees
  for delete using (employer_profile_id = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. RLS — inscription_participants
-- -----------------------------------------------------------------------------
alter table public.inscription_participants enable row level security;

drop policy if exists "insc_part read related" on public.inscription_participants;
create policy "insc_part read related" on public.inscription_participants
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.inscriptions i
      where i.id = inscription_id
        and (i.payer_profile_id = auth.uid() or i.participant_profile_id = auth.uid())
    )
    or participant_profile_id = auth.uid()
    or exists (
      select 1 from public.employees e
      where e.id = employee_id
        and (e.employer_profile_id = auth.uid() or e.profile_id = auth.uid())
    )
    or exists (
      select 1 from public.inscriptions i
      join public.sessions s on s.id = i.session_id
      where i.id = inscription_id and s.formateur_id = auth.uid()
    )
  );

drop policy if exists "insc_part insert by payer" on public.inscription_participants;
create policy "insc_part insert by payer" on public.inscription_participants
  for insert with check (
    exists (
      select 1 from public.inscriptions i
      where i.id = inscription_id and i.payer_profile_id = auth.uid()
    )
    and (
      participant_profile_id is null
      or participant_profile_id = auth.uid()
      or public.is_admin()
    )
    and (
      employee_id is null
      or exists (
        select 1 from public.employees e
        where e.id = employee_id and e.employer_profile_id = auth.uid()
      )
      or public.is_admin()
    )
  );

drop policy if exists "insc_part update admin" on public.inscription_participants;
create policy "insc_part update admin" on public.inscription_participants
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "insc_part delete admin or payer" on public.inscription_participants;
create policy "insc_part delete admin or payer" on public.inscription_participants
  for delete using (
    public.is_admin()
    or exists (
      select 1 from public.inscriptions i
      where i.id = inscription_id and i.payer_profile_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 7. RLS — inscriptions : update lecture pour autoriser employer/employé
-- -----------------------------------------------------------------------------
drop policy if exists "inscriptions read self" on public.inscriptions;
create policy "inscriptions read self" on public.inscriptions
  for select using (
    payer_profile_id = auth.uid()
    or participant_profile_id = auth.uid()
    or exists (
      select 1 from public.inscription_participants ip
      where ip.inscription_id = inscriptions.id
        and (
          ip.participant_profile_id = auth.uid()
          or exists (
            select 1 from public.employees e
            where e.id = ip.employee_id
              and (e.employer_profile_id = auth.uid() or e.profile_id = auth.uid())
          )
        )
    )
  );

-- -----------------------------------------------------------------------------
-- 8. RLS — emargements / completions : étendre via inscription_participants
-- -----------------------------------------------------------------------------
-- (à venir quand le formateur "déclenchera" la partie en-formation —
--  laissé en l'état pour cette étape pré-formation)
