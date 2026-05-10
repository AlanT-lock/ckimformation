-- =============================================================================
--  En-formation : déclenchement émargement, accès stagiaire-employé, etc.
-- =============================================================================
--  - creneau_emargement_triggers : le formateur "ouvre" l'émargement d'un créneau
--  - emargements / test_completions : ajout inscription_participant_id pour
--    permettre N signatures par inscription (1 par participant)
--  - handle_new_user : lie employees.profile_id quand l'invitation porte
--    metadata employee_id (création de compte par le formateur)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Trigger d'émargement par créneau
-- -----------------------------------------------------------------------------
create table if not exists public.creneau_emargement_triggers (
  id            uuid primary key default uuid_generate_v4(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  creneau_id    uuid not null references public.session_creneaux(id) on delete cascade,
  triggered_at  timestamptz not null default now(),
  triggered_by  uuid references public.profiles(id) on delete set null,
  closed_at     timestamptz,
  unique (creneau_id)
);

create index if not exists idx_emargt_session on public.creneau_emargement_triggers(session_id);

alter table public.creneau_emargement_triggers enable row level security;

drop policy if exists "emargt read related" on public.creneau_emargement_triggers;
create policy "emargt read related" on public.creneau_emargement_triggers
  for select using (
    public.is_admin()
    or exists (select 1 from public.sessions s where s.id = session_id and s.formateur_id = auth.uid())
    or exists (
      select 1 from public.inscriptions i
      where i.session_id = session_id
        and (
          i.payer_profile_id = auth.uid()
          or i.participant_profile_id = auth.uid()
          or exists (
            select 1 from public.inscription_participants ip
            left join public.employees e on e.id = ip.employee_id
            where ip.inscription_id = i.id
              and (ip.participant_profile_id = auth.uid() or e.profile_id = auth.uid())
          )
        )
    )
  );

drop policy if exists "emargt insert formateur" on public.creneau_emargement_triggers;
create policy "emargt insert formateur" on public.creneau_emargement_triggers
  for insert with check (
    public.is_admin()
    or exists (select 1 from public.sessions s where s.id = session_id and s.formateur_id = auth.uid())
  );

drop policy if exists "emargt update formateur" on public.creneau_emargement_triggers;
create policy "emargt update formateur" on public.creneau_emargement_triggers
  for update using (
    public.is_admin()
    or exists (select 1 from public.sessions s where s.id = session_id and s.formateur_id = auth.uid())
  ) with check (
    public.is_admin()
    or exists (select 1 from public.sessions s where s.id = session_id and s.formateur_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 2. Émargements multi-participants
-- -----------------------------------------------------------------------------
alter table public.emargements
  add column if not exists inscription_participant_id uuid references public.inscription_participants(id) on delete cascade;

-- L'ancien unique (inscription_id, creneau_id) ne tient plus dès qu'une
-- inscription porte plusieurs participants. On le remplace par un unique
-- (inscription_participant_id, creneau_id) appliqué quand la colonne est
-- renseignée (compat ascendante via index partiel).
alter table public.emargements drop constraint if exists emargements_inscription_id_creneau_id_key;

create unique index if not exists uniq_emargt_part_creneau
  on public.emargements (inscription_participant_id, creneau_id)
  where inscription_participant_id is not null;

create index if not exists idx_emargt_part on public.emargements(inscription_participant_id);

-- RLS : lecture/insertion via inscription_participants → employees/profile
drop policy if exists "emargements read self or staff" on public.emargements;
create policy "emargements read self or staff" on public.emargements
  for select using (
    public.is_admin()
    or exists (select 1 from public.inscriptions i where i.id = inscription_id and i.participant_profile_id = auth.uid())
    or exists (
      select 1 from public.inscriptions i
      join public.sessions s on s.id = i.session_id
      where i.id = inscription_id and s.formateur_id = auth.uid()
    )
    or exists (
      select 1 from public.inscription_participants ip
      left join public.employees e on e.id = ip.employee_id
      where ip.id = inscription_participant_id
        and (ip.participant_profile_id = auth.uid() or e.profile_id = auth.uid())
    )
    or exists (
      select 1 from public.inscriptions i
      where i.id = inscription_id and i.payer_profile_id = auth.uid()
    )
  );

drop policy if exists "emargements insert self" on public.emargements;
create policy "emargements insert self" on public.emargements
  for insert with check (
    exists (
      select 1 from public.inscription_participants ip
      left join public.employees e on e.id = ip.employee_id
      where ip.id = inscription_participant_id
        and (ip.participant_profile_id = auth.uid() or e.profile_id = auth.uid())
    )
    or exists (
      select 1 from public.inscriptions i
      where i.id = inscription_id and i.participant_profile_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 3. test_completions multi-participants
-- -----------------------------------------------------------------------------
alter table public.test_completions
  add column if not exists inscription_participant_id uuid references public.inscription_participants(id) on delete cascade;

alter table public.test_completions drop constraint if exists test_completions_inscription_id_test_id_key;

create unique index if not exists uniq_completion_part_test
  on public.test_completions (inscription_participant_id, test_id)
  where inscription_participant_id is not null;

create index if not exists idx_completion_part on public.test_completions(inscription_participant_id);

-- RLS
drop policy if exists "completions read self or staff" on public.test_completions;
create policy "completions read self or staff" on public.test_completions
  for select using (
    public.is_admin()
    or exists (select 1 from public.inscriptions i where i.id = inscription_id and i.participant_profile_id = auth.uid())
    or exists (
      select 1 from public.inscriptions i
      join public.sessions s on s.id = i.session_id
      where i.id = inscription_id and s.formateur_id = auth.uid()
    )
    or exists (
      select 1 from public.inscription_participants ip
      left join public.employees e on e.id = ip.employee_id
      where ip.id = inscription_participant_id
        and (ip.participant_profile_id = auth.uid() or e.profile_id = auth.uid())
    )
    or exists (
      select 1 from public.inscriptions i
      where i.id = inscription_id and i.payer_profile_id = auth.uid()
    )
  );

drop policy if exists "completions insert self" on public.test_completions;
create policy "completions insert self" on public.test_completions
  for insert with check (
    exists (
      select 1 from public.inscription_participants ip
      left join public.employees e on e.id = ip.employee_id
      where ip.id = inscription_participant_id
        and (ip.participant_profile_id = auth.uid() or e.profile_id = auth.uid())
    )
    or exists (
      select 1 from public.inscriptions i
      where i.id = inscription_id and i.participant_profile_id = auth.uid()
    )
  );

drop policy if exists "completions update self" on public.test_completions;
create policy "completions update self" on public.test_completions
  for update using (
    exists (
      select 1 from public.inscription_participants ip
      left join public.employees e on e.id = ip.employee_id
      where ip.id = inscription_participant_id
        and (ip.participant_profile_id = auth.uid() or e.profile_id = auth.uid())
    )
    or exists (
      select 1 from public.inscriptions i
      where i.id = inscription_id and i.participant_profile_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 4. responses RLS : étendre via participant_id
-- -----------------------------------------------------------------------------
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
    or exists (
      select 1 from public.test_completions c
      join public.inscription_participants ip on ip.id = c.inscription_participant_id
      left join public.employees e on e.id = ip.employee_id
      where c.id = completion_id
        and (ip.participant_profile_id = auth.uid() or e.profile_id = auth.uid())
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
    or exists (
      select 1 from public.test_completions c
      join public.inscription_participants ip on ip.id = c.inscription_participant_id
      left join public.employees e on e.id = ip.employee_id
      where c.id = completion_id
        and (ip.participant_profile_id = auth.uid() or e.profile_id = auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- 5. handle_new_user : lier employees.profile_id si invitation porte employee_id
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role         user_role;
  v_account_type account_type;
  v_employee_id  uuid;
begin
  v_role := coalesce(nullif(new.raw_user_meta_data->>'role',''), 'stagiaire')::user_role;
  v_account_type := nullif(new.raw_user_meta_data->>'account_type','')::account_type;
  v_employee_id := nullif(new.raw_user_meta_data->>'employee_id','')::uuid;

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

  -- Salarié invité par le formateur : on lie sa fiche employee à son profile.
  if v_employee_id is not null then
    update public.employees
       set profile_id = new.id, updated_at = now()
     where id = v_employee_id;
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Realtime publications (pour Supabase Realtime)
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'creneau_emargement_triggers',
    'session_test_triggers',
    'emargements',
    'test_completions'
  ])
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
