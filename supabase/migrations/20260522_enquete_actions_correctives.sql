-- =============================================================================
--  Qualiopi — gestion des mauvais résultats d'enquête
-- =============================================================================
--  Une "alerte" = une complétion d'enquête dont le score moyen normalisé
--  (sur les questions échelle) est sous le seuil défini côté application.
--  Cette table stocke uniquement l'action corrective et la résolution :
--  les alertes sont détectées à la volée à la lecture (pas de doublon de vérité).
-- =============================================================================

create table if not exists public.enquete_actions_correctives (
  id                 uuid primary key default uuid_generate_v4(),
  completion_id      uuid not null unique references public.test_completions(id) on delete cascade,
  action_corrective  text,
  resolved           boolean not null default false,
  resolved_at        timestamptz,
  resolved_by        uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_eac_completion on public.enquete_actions_correctives(completion_id);
create index if not exists idx_eac_open
  on public.enquete_actions_correctives(updated_at desc)
  where resolved = false;

-- RLS : admin uniquement
alter table public.enquete_actions_correctives enable row level security;

drop policy if exists "eac admin all" on public.enquete_actions_correctives;
create policy "eac admin all" on public.enquete_actions_correctives
  for all
  using (public.is_admin())
  with check (public.is_admin());
