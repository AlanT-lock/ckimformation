-- =============================================================================
--  Documents : demande de docs par l'admin + envoi de docs par le payer
-- =============================================================================
--  - Nouveaux statuts : documents_demandes, documents_recus
--  - Table inscription_document_demandes : 1 ligne par doc demandé,
--    avec upload du payer ou décliné avec justification
--  - Table inscription_admin_documents : docs joints par l'admin lors de la
--    confirmation/refus
--  - Buckets Supabase Storage : 'inscription-docs-payer' et
--    'inscription-docs-admin' (privés, accès via service_role + URLs signées)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Nouveaux statuts
-- -----------------------------------------------------------------------------
alter type inscription_statut add value if not exists 'documents_demandes';
alter type inscription_statut add value if not exists 'documents_recus';

-- -----------------------------------------------------------------------------
-- 2. Documents demandés au payer
-- -----------------------------------------------------------------------------
create table if not exists public.inscription_document_demandes (
  id                uuid primary key default uuid_generate_v4(),
  inscription_id    uuid not null references public.inscriptions(id) on delete cascade,
  nom               text not null,
  ordre             int  not null default 0,
  -- Réponse du payer
  storage_path      text,
  file_name         text,
  file_size         int,
  mime_type         text,
  uploaded_at       timestamptz,
  declined          boolean not null default false,
  decline_reason    text,
  -- Métadonnées
  requested_by      uuid references public.profiles(id) on delete set null,
  requested_at      timestamptz not null default now()
);

create index if not exists idx_idd_inscription on public.inscription_document_demandes(inscription_id);

alter table public.inscription_document_demandes enable row level security;

-- Lecture : payer de l'inscription + admin + formateur de la session
drop policy if exists "idd read related" on public.inscription_document_demandes;
create policy "idd read related" on public.inscription_document_demandes
  for select using (
    public.is_admin()
    or public.uid_is_payer_of_inscription(inscription_id)
    or public.uid_is_formateur_of_inscription(inscription_id)
  );

-- Écriture (insert/update/delete) : admin uniquement via service_role en pratique
-- mais on autorise admin par RLS pour cohérence
drop policy if exists "idd write admin" on public.inscription_document_demandes;
create policy "idd write admin" on public.inscription_document_demandes
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. Documents envoyés par l'admin (lors de la confirmation ou du refus)
-- -----------------------------------------------------------------------------
create table if not exists public.inscription_admin_documents (
  id                uuid primary key default uuid_generate_v4(),
  inscription_id    uuid not null references public.inscriptions(id) on delete cascade,
  storage_path      text not null,
  file_name         text not null,
  file_size         int,
  mime_type         text,
  uploaded_by       uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index if not exists idx_iad_inscription on public.inscription_admin_documents(inscription_id);

alter table public.inscription_admin_documents enable row level security;

drop policy if exists "iad read related" on public.inscription_admin_documents;
create policy "iad read related" on public.inscription_admin_documents
  for select using (
    public.is_admin()
    or public.uid_is_payer_of_inscription(inscription_id)
    or public.uid_is_formateur_of_inscription(inscription_id)
  );

drop policy if exists "iad write admin" on public.inscription_admin_documents;
create policy "iad write admin" on public.inscription_admin_documents
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. Buckets Supabase Storage
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('inscription-docs-payer', 'inscription-docs-payer', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('inscription-docs-admin', 'inscription-docs-admin', false)
  on conflict (id) do nothing;

-- Tous les accès Storage passent par le serveur (admin client + URLs signées).
-- On ne crée pas de policies storage.objects publiques.
