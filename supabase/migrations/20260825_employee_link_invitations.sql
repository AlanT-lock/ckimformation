-- =============================================================================
--  Invitations de rattachement salarié ↔ compte existant
-- =============================================================================
--  Un stagiaire peut déjà avoir un compte (signup particulier). Si une
--  entreprise l'ajoute ensuite comme salarié, on ne crée PAS un second
--  compte auth : on envoie une invitation pour lier employees.profile_id
--  au profil existant.
-- =============================================================================

create table if not exists public.employee_invitations (
  id            uuid primary key default uuid_generate_v4(),
  employee_id   uuid not null references public.employees(id) on delete cascade,
  email         text not null,
  token         text not null unique,
  invited_by    uuid references public.profiles(id) on delete set null,
  invited_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '14 days'),
  claimed_by    uuid references public.profiles(id) on delete set null,
  claimed_at    timestamptz
);

create index if not exists idx_employee_invitations_employee
  on public.employee_invitations(employee_id);

create index if not exists idx_employee_invitations_email
  on public.employee_invitations(lower(email));

-- Une seule invitation en attente par fiche salarié (le renvoi met à jour le token).
create unique index if not exists uniq_employee_invitations_pending
  on public.employee_invitations (employee_id)
  where claimed_at is null;

-- Un même profil ne peut pas être lié deux fois à la même entreprise.
create unique index if not exists uniq_employees_employer_profile
  on public.employees (employer_profile_id, profile_id)
  where profile_id is not null;

alter table public.employee_invitations enable row level security;

drop policy if exists "employee_invitations read employer or admin" on public.employee_invitations;
create policy "employee_invitations read employer or admin" on public.employee_invitations
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.employees e
      where e.id = employee_id
        and e.employer_profile_id = auth.uid()
    )
  );

-- Insert / update / delete : service_role uniquement (pas de policy d'écriture).
