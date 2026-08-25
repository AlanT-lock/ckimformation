-- =============================================================================
--  Émargement formateur (signature du formateur par créneau)
-- =============================================================================
--  Distinct des émargements stagiaires (table emargements, liée à une
--  inscription). Une seule signature formateur par créneau.
-- =============================================================================

create table if not exists public.formateur_emargements (
  id              uuid primary key default uuid_generate_v4(),
  session_id      uuid not null references public.sessions(id) on delete cascade,
  creneau_id      uuid not null references public.session_creneaux(id) on delete cascade,
  profile_id      uuid not null references public.profiles(id) on delete restrict,
  signature_data  text not null,
  signed_at       timestamptz not null default now(),
  unique (creneau_id)
);

create index if not exists idx_formateur_emargements_session
  on public.formateur_emargements(session_id);

alter table public.formateur_emargements enable row level security;

drop policy if exists "formateur_emargements read staff" on public.formateur_emargements;
create policy "formateur_emargements read staff" on public.formateur_emargements
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.sessions s
      where s.id = session_id and s.formateur_id = auth.uid()
    )
  );

drop policy if exists "formateur_emargements insert own" on public.formateur_emargements;
create policy "formateur_emargements insert own" on public.formateur_emargements
  for insert with check (
    profile_id = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from public.sessions s
        where s.id = session_id and s.formateur_id = auth.uid()
      )
    )
  );

drop policy if exists "formateur_emargements update own" on public.formateur_emargements;
create policy "formateur_emargements update own" on public.formateur_emargements
  for update using (
    profile_id = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from public.sessions s
        where s.id = session_id and s.formateur_id = auth.uid()
      )
    )
  )
  with check (
    profile_id = auth.uid()
  );

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'formateur_emargements'
    ) then
      execute 'alter publication supabase_realtime add table public.formateur_emargements';
    end if;
  end if;
end $$;
