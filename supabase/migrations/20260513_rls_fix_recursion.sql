-- =============================================================================
--  Fix RLS infinite recursion entre inscriptions et inscription_participants
-- =============================================================================
--  Symptôme : 42P17 "infinite recursion detected in policy for relation"
--  Cause    : la policy de inscriptions lit inscription_participants,
--             la policy de inscription_participants lit inscriptions → boucle.
--  Solution : encapsuler les checks croisés dans des fonctions SECURITY DEFINER
--             (elles bypass RLS, plus de récursion possible).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Fonctions helpers (security definer)
-- -----------------------------------------------------------------------------

-- L'utilisateur courant participe-t-il à cette inscription (via profile direct
-- OU via employees.profile_id) ?
create or replace function public.uid_participates_in_inscription(p_inscription_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.inscription_participants ip
    left join public.employees e on e.id = ip.employee_id
    where ip.inscription_id = p_inscription_id
      and (ip.participant_profile_id = auth.uid() or e.profile_id = auth.uid())
  );
$$;

-- L'utilisateur courant est-il l'employeur d'un participant de l'inscription ?
create or replace function public.uid_is_employer_of_participant(p_inscription_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.inscription_participants ip
    join public.employees e on e.id = ip.employee_id
    where ip.inscription_id = p_inscription_id
      and e.employer_profile_id = auth.uid()
  );
$$;

-- L'utilisateur courant est-il le payer de cette inscription ?
create or replace function public.uid_is_payer_of_inscription(p_inscription_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.inscriptions where id = p_inscription_id and payer_profile_id = auth.uid()
  );
$$;

-- L'utilisateur courant est-il le formateur de la session de l'inscription ?
create or replace function public.uid_is_formateur_of_inscription(p_inscription_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.inscriptions i
    join public.sessions s on s.id = i.session_id
    where i.id = p_inscription_id and s.formateur_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. Re-écriture des policies sans récursion
-- -----------------------------------------------------------------------------

-- ---- inscriptions ----
drop policy if exists "inscriptions read self" on public.inscriptions;
create policy "inscriptions read self" on public.inscriptions
  for select using (
    payer_profile_id = auth.uid()
    or participant_profile_id = auth.uid()
    or public.uid_participates_in_inscription(id)
  );

-- ---- inscription_participants ----
drop policy if exists "insc_part read related" on public.inscription_participants;
create policy "insc_part read related" on public.inscription_participants
  for select using (
    public.is_admin()
    or participant_profile_id = auth.uid()
    or public.uid_is_payer_of_inscription(inscription_id)
    or public.uid_is_formateur_of_inscription(inscription_id)
    or (employee_id is not null and exists (
      select 1 from public.employees e
      where e.id = employee_id
        and (e.employer_profile_id = auth.uid() or e.profile_id = auth.uid())
    ))
  );

drop policy if exists "insc_part insert by payer" on public.inscription_participants;
create policy "insc_part insert by payer" on public.inscription_participants
  for insert with check (
    public.uid_is_payer_of_inscription(inscription_id)
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

drop policy if exists "insc_part delete admin or payer" on public.inscription_participants;
create policy "insc_part delete admin or payer" on public.inscription_participants
  for delete using (
    public.is_admin()
    or public.uid_is_payer_of_inscription(inscription_id)
  );

-- ---- creneau_emargement_triggers : on retire les sous-requêtes sur inscriptions ----
drop policy if exists "emargt read related" on public.creneau_emargement_triggers;
create policy "emargt read related" on public.creneau_emargement_triggers
  for select using (
    public.is_admin()
    or exists (select 1 from public.sessions s where s.id = session_id and s.formateur_id = auth.uid())
    or exists (
      select 1 from public.inscriptions i
      where i.session_id = creneau_emargement_triggers.session_id
        and (
          i.payer_profile_id = auth.uid()
          or i.participant_profile_id = auth.uid()
          or public.uid_participates_in_inscription(i.id)
        )
    )
  );
