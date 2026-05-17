-- =============================================================================
--  Évaluation Formateur : tests remplis par le formateur pour chaque stagiaire
-- =============================================================================
--  - Ajout valeur 'evaluation_formateur' à l'enum test_kind
--  - Ajout colonne test_completions.filled_by_formateur_id pour tracer
--    quel formateur a rempli l'évaluation
--  - RLS : formateur de la session peut créer/modifier les complétions
--    de kind 'evaluation_formateur' pour les stagiaires de sa session
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enum : ajouter la valeur
-- -----------------------------------------------------------------------------
do $$ begin
  alter type test_kind add value if not exists 'evaluation_formateur';
exception when others then null; end $$;

-- -----------------------------------------------------------------------------
-- 2. Colonne filled_by_formateur_id
-- -----------------------------------------------------------------------------
alter table public.test_completions
  add column if not exists filled_by_formateur_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_completion_filled_by
  on public.test_completions(filled_by_formateur_id)
  where filled_by_formateur_id is not null;

-- -----------------------------------------------------------------------------
-- 3. RLS test_completions : autoriser formateur de la session pour
--    les évaluations formateur
-- -----------------------------------------------------------------------------
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

-- Formateur peut INSERT une évaluation formateur pour un stagiaire de sa session
drop policy if exists "completions insert formateur eval" on public.test_completions;
create policy "completions insert formateur eval" on public.test_completions
  for insert with check (
    -- soit le stagiaire qui remplit son propre test (cas existant)
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
    -- soit le formateur de la session qui remplit une évaluation_formateur
    or exists (
      select 1 from public.inscription_participants ip
      join public.inscriptions i on i.id = ip.inscription_id
      join public.sessions s on s.id = i.session_id
      join public.tests t on t.id = test_id
      where ip.id = inscription_participant_id
        and s.formateur_id = auth.uid()
        and t.kind = 'evaluation_formateur'
    )
  );

drop policy if exists "completions insert self" on public.test_completions;

-- Formateur peut UPDATE pour modifier une évaluation
drop policy if exists "completions update formateur eval" on public.test_completions;
create policy "completions update formateur eval" on public.test_completions
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
    or exists (
      select 1 from public.inscription_participants ip
      join public.inscriptions i on i.id = ip.inscription_id
      join public.sessions s on s.id = i.session_id
      join public.tests t on t.id = test_id
      where ip.id = inscription_participant_id
        and s.formateur_id = auth.uid()
        and t.kind = 'evaluation_formateur'
    )
  );

drop policy if exists "completions update self" on public.test_completions;

-- -----------------------------------------------------------------------------
-- 4. RLS responses : étendre pour permettre au formateur d'écrire les réponses
--    associées à une évaluation_formateur qu'il remplit
-- -----------------------------------------------------------------------------
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
    or exists (
      select 1 from public.test_completions c
      join public.tests t on t.id = c.test_id
      join public.inscription_participants ip on ip.id = c.inscription_participant_id
      join public.inscriptions i on i.id = ip.inscription_id
      join public.sessions s on s.id = i.session_id
      where c.id = completion_id
        and t.kind = 'evaluation_formateur'
        and s.formateur_id = auth.uid()
    )
  );

drop policy if exists "responses update self" on public.responses;
create policy "responses update self" on public.responses
  for update using (
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
    or exists (
      select 1 from public.test_completions c
      join public.tests t on t.id = c.test_id
      join public.inscription_participants ip on ip.id = c.inscription_participant_id
      join public.inscriptions i on i.id = ip.inscription_id
      join public.sessions s on s.id = i.session_id
      where c.id = completion_id
        and t.kind = 'evaluation_formateur'
        and s.formateur_id = auth.uid()
    )
  );

drop policy if exists "responses delete self" on public.responses;
create policy "responses delete self" on public.responses
  for delete using (
    public.is_admin()
    or exists (
      select 1 from public.test_completions c
      join public.tests t on t.id = c.test_id
      join public.inscription_participants ip on ip.id = c.inscription_participant_id
      join public.inscriptions i on i.id = ip.inscription_id
      join public.sessions s on s.id = i.session_id
      where c.id = completion_id
        and t.kind = 'evaluation_formateur'
        and s.formateur_id = auth.uid()
    )
  );
