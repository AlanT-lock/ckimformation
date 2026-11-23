-- =============================================================================
--  Documents de fin de formation : certificat de réalisation + attestation
-- =============================================================================
--  - fin_formation_documents : un PDF par stagiaire et par type de document,
--    généré et envoyé par l'admin depuis la page d'une session terminée.
--    Le fichier est conservé dans le bucket privé 'fin-formation-docs' ; un
--    nouvel envoi remplace le fichier mais garde le même numéro.
--  - fin_formation_compteurs + next_fin_formation_numero() : numérotation
--    continue par année et par type (CR-2026-0001, AFF-2026-0001…).
--  Écritures : server actions (service-role) après contrôle du rôle admin.
--  Lecture directe : admin + formateur de la session ; l'entreprise et le
--  stagiaire lisent côté serveur après vérification de leurs droits, et
--  téléchargent via /api/documents/download/fin-formation/[id].
--  À exécuter UNE FOIS dans le SQL Editor de Supabase. Idempotent.
-- =============================================================================

create table if not exists public.fin_formation_documents (
  id                          uuid primary key default uuid_generate_v4(),
  session_id                  uuid not null references public.sessions(id) on delete cascade,
  inscription_participant_id  uuid not null references public.inscription_participants(id) on delete cascade,
  kind                        text not null check (kind in ('certificat', 'attestation')),
  numero                      text not null unique,
  storage_path                text not null,
  file_name                   text not null,
  file_size                   int,
  date_edition                date not null,
  -- Dernier envoi : date, auteur et adresse du stagiaire (null = pas d'e-mail)
  sent_at                     timestamptz not null default now(),
  sent_by                     uuid references public.profiles(id) on delete set null,
  emailed_to                  text,
  created_at                  timestamptz not null default now(),
  unique (inscription_participant_id, kind)
);
create index if not exists idx_fin_formation_documents_session
  on public.fin_formation_documents(session_id);

create table if not exists public.fin_formation_compteurs (
  annee    int  not null,
  kind     text not null check (kind in ('certificat', 'attestation')),
  dernier  int  not null default 0,
  primary key (annee, kind)
);

-- Numéro suivant (atomique) pour une année et un type de document.
create or replace function public.next_fin_formation_numero(p_kind text, p_annee int)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.fin_formation_compteurs (annee, kind, dernier)
  values (p_annee, p_kind, 1)
  on conflict (annee, kind) do update set dernier = public.fin_formation_compteurs.dernier + 1
  returning dernier;
$$;
revoke all on function public.next_fin_formation_numero(text, int) from public, anon, authenticated;
grant execute on function public.next_fin_formation_numero(text, int) to service_role;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.fin_formation_documents enable row level security;
alter table public.fin_formation_compteurs enable row level security;

drop policy if exists "fin_formation_documents read admin or formateur" on public.fin_formation_documents;
create policy "fin_formation_documents read admin or formateur" on public.fin_formation_documents
  for select using (
    public.is_admin()
    or exists (select 1 from public.sessions s where s.id = session_id and s.formateur_id = auth.uid())
  );
-- Insert / update / delete : service-role uniquement (server actions).
-- fin_formation_compteurs : aucune policy, service-role uniquement.

-- -----------------------------------------------------------------------------
-- Bucket Supabase Storage (privé, accès via service_role + URLs signées)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('fin-formation-docs', 'fin-formation-docs', false)
  on conflict (id) do nothing;
