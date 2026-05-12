-- =============================================================================
--  Absences par créneau (formateur)
-- =============================================================================
--  Permet au formateur de marquer un stagiaire absent à un créneau précis.
--  Impact :
--    - Émargement : un absent n'est pas attendu pour signer ce créneau
--      (le compteur "tout le monde a signé" l'exclut)
--    - Tests : un participant absent à TOUS les créneaux est exclu des
--      compteurs de tests. Sinon il compte normalement.
-- =============================================================================

create table if not exists public.creneau_absences (
  id                          uuid primary key default uuid_generate_v4(),
  creneau_id                  uuid not null references public.session_creneaux(id) on delete cascade,
  inscription_participant_id  uuid not null references public.inscription_participants(id) on delete cascade,
  marked_by                   uuid references public.profiles(id) on delete set null,
  marked_at                   timestamptz not null default now(),
  reason                      text,
  unique (creneau_id, inscription_participant_id)
);

create index if not exists idx_creneau_absences_creneau on public.creneau_absences(creneau_id);
create index if not exists idx_creneau_absences_participant on public.creneau_absences(inscription_participant_id);

alter table public.creneau_absences enable row level security;

-- Lecture : admin + formateur de la session + payer/employé + le participant lui-même
drop policy if exists "creneau_absences read related" on public.creneau_absences;
create policy "creneau_absences read related" on public.creneau_absences
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.session_creneaux sc
      join public.sessions s on s.id = sc.session_id
      where sc.id = creneau_id and s.formateur_id = auth.uid()
    )
    or exists (
      select 1 from public.inscription_participants ip
      left join public.employees e on e.id = ip.employee_id
      join public.inscriptions i on i.id = ip.inscription_id
      where ip.id = inscription_participant_id
        and (
          ip.participant_profile_id = auth.uid()
          or e.profile_id = auth.uid()
          or i.payer_profile_id = auth.uid()
          or e.employer_profile_id = auth.uid()
        )
    )
  );

-- Écriture : admin + formateur de la session
drop policy if exists "creneau_absences write formateur" on public.creneau_absences;
create policy "creneau_absences write formateur" on public.creneau_absences
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.session_creneaux sc
      join public.sessions s on s.id = sc.session_id
      where sc.id = creneau_id and s.formateur_id = auth.uid()
    )
  ) with check (
    public.is_admin()
    or exists (
      select 1 from public.session_creneaux sc
      join public.sessions s on s.id = sc.session_id
      where sc.id = creneau_id and s.formateur_id = auth.uid()
    )
  );

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'creneau_absences'
  ) then
    execute 'alter publication supabase_realtime add table public.creneau_absences';
  end if;
end $$;
