-- =============================================================================
--  Fix 1 : ON CONFLICT sur emargements/test_completions
--  Fix 2 : RLS — le formateur peut lire les employees / profiles de SES sessions
-- =============================================================================
--  - L'upsert "ON CONFLICT (inscription_participant_id, creneau_id)" exigeait
--    un *constraint* ou un *index non-partiel*. On remplace les index partiels
--    par des contraintes uniques.
--  - Le formateur affichait une liste vide de stagiaires car aucune policy ne
--    lui permettait de lire la table employees/profiles. On ajoute deux
--    fonctions SECURITY DEFINER + deux policies select.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Contraintes uniques (au lieu d'index partiels) pour ON CONFLICT
-- -----------------------------------------------------------------------------
drop index if exists public.uniq_emargt_part_creneau;
do $$ begin
  alter table public.emargements
    add constraint emargements_part_creneau_unique unique (inscription_participant_id, creneau_id);
exception when duplicate_table then null; end $$;

drop index if exists public.uniq_completion_part_test;
do $$ begin
  alter table public.test_completions
    add constraint completion_part_test_unique unique (inscription_participant_id, test_id);
exception when duplicate_table then null; end $$;

-- -----------------------------------------------------------------------------
-- 2. Fonctions helpers pour l'accès formateur (security definer = bypass RLS)
-- -----------------------------------------------------------------------------
create or replace function public.uid_is_formateur_of_employee(p_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.inscription_participants ip
    join public.inscriptions i on i.id = ip.inscription_id
    join public.sessions s on s.id = i.session_id
    where ip.employee_id = p_employee_id and s.formateur_id = auth.uid()
  );
$$;

create or replace function public.uid_is_formateur_of_profile_in_session(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.inscription_participants ip
    join public.inscriptions i on i.id = ip.inscription_id
    join public.sessions s on s.id = i.session_id
    where ip.participant_profile_id = p_profile_id and s.formateur_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- 3. Policies : le formateur lit les employees et profiles de ses sessions
-- -----------------------------------------------------------------------------
drop policy if exists "employees read by formateur" on public.employees;
create policy "employees read by formateur" on public.employees
  for select using (public.uid_is_formateur_of_employee(id));

drop policy if exists "profiles read participants of my session" on public.profiles;
create policy "profiles read participants of my session" on public.profiles
  for select using (public.uid_is_formateur_of_profile_in_session(id));
