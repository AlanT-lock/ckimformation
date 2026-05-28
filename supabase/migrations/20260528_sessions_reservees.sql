-- =============================================================================
--  Sessions réservées à un établissement
-- =============================================================================
--  - Permet de réserver une session à un seul établissement (visibility=reserved)
--  - Workflow d'invitation (token), analyse des besoins, documents échangés
--  - Buckets Storage privés pour les pièces jointes admin et établissement
-- =============================================================================

-- 1. Type enum visibility
do $$ begin
  create type session_visibility as enum ('public', 'reserved');
exception when duplicate_object then null; end $$;

-- 2. Colonnes sur sessions
alter table public.sessions
  add column if not exists visibility session_visibility not null default 'public',
  add column if not exists reserved_company_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_sessions_visibility on public.sessions(visibility);
create index if not exists idx_sessions_reserved_company
  on public.sessions(reserved_company_id)
  where reserved_company_id is not null;

-- 3. Invitations
create table if not exists public.session_invitations (
  id               uuid primary key default uuid_generate_v4(),
  session_id       uuid not null references public.sessions(id) on delete cascade,
  email            text not null,
  raison_sociale   text not null,
  siret            text,
  contact_nom      text,
  contact_fonction text,
  contact_phone    text,
  token            text not null unique,
  invited_by       uuid references public.profiles(id) on delete set null,
  invited_at       timestamptz not null default now(),
  expires_at       timestamptz not null default (now() + interval '30 days'),
  claimed_by       uuid references public.profiles(id) on delete set null,
  claimed_at       timestamptz,
  unique (session_id)
);
create index if not exists idx_session_invitations_email on public.session_invitations(lower(email));

-- 4. Détails session réservée
create table if not exists public.session_reserved_details (
  session_id      uuid primary key references public.sessions(id) on delete cascade,
  analyse_besoins text,
  completed_at    timestamptz,
  updated_at      timestamptz not null default now()
);

-- 5. Documents demandés à l'établissement
create table if not exists public.session_document_requests (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  ordre       int not null default 0,
  label       text not null,
  description text,
  required    boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_sdr_session on public.session_document_requests(session_id);

create table if not exists public.session_document_uploads (
  id           uuid primary key default uuid_generate_v4(),
  request_id   uuid not null references public.session_document_requests(id) on delete cascade,
  session_id   uuid not null references public.sessions(id) on delete cascade,
  storage_path text not null,
  filename     text not null,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  uploaded_at  timestamptz not null default now()
);
create index if not exists idx_sdu_request on public.session_document_uploads(request_id);

-- 6. Documents fournis par l'admin
create table if not exists public.session_admin_documents (
  id           uuid primary key default uuid_generate_v4(),
  session_id   uuid not null references public.sessions(id) on delete cascade,
  storage_path text not null,
  filename     text not null,
  label        text,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  uploaded_at  timestamptz not null default now()
);
create index if not exists idx_sad_session on public.session_admin_documents(session_id);

-- 7. Buckets Storage (privés)
insert into storage.buckets (id, name, public)
values ('session-admin-docs', 'session-admin-docs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('session-etab-uploads', 'session-etab-uploads', false)
on conflict (id) do nothing;

-- 8. RLS — enable
alter table public.session_invitations         enable row level security;
alter table public.session_reserved_details    enable row level security;
alter table public.session_document_requests   enable row level security;
alter table public.session_document_uploads    enable row level security;
alter table public.session_admin_documents     enable row level security;

drop policy if exists "invitations admin all" on public.session_invitations;
create policy "invitations admin all" on public.session_invitations
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "srd read" on public.session_reserved_details;
create policy "srd read" on public.session_reserved_details
  for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or exists (
      select 1 from public.sessions s
      where s.id = session_reserved_details.session_id
        and s.reserved_company_id = auth.uid()
    )
  );

drop policy if exists "srd write" on public.session_reserved_details;
create policy "srd write" on public.session_reserved_details
  for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or exists (
      select 1 from public.sessions s
      where s.id = session_reserved_details.session_id
        and s.reserved_company_id = auth.uid()
    )
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or exists (
      select 1 from public.sessions s
      where s.id = session_reserved_details.session_id
        and s.reserved_company_id = auth.uid()
    )
  );

drop policy if exists "sdr read" on public.session_document_requests;
create policy "sdr read" on public.session_document_requests
  for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or exists (
      select 1 from public.sessions s
      where s.id = session_document_requests.session_id
        and s.reserved_company_id = auth.uid()
    )
  );

drop policy if exists "sdr write admin" on public.session_document_requests;
create policy "sdr write admin" on public.session_document_requests
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "sdu read" on public.session_document_uploads;
create policy "sdu read" on public.session_document_uploads
  for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or exists (
      select 1 from public.sessions s
      where s.id = session_document_uploads.session_id
        and s.reserved_company_id = auth.uid()
    )
  );

drop policy if exists "sdu insert etab" on public.session_document_uploads;
create policy "sdu insert etab" on public.session_document_uploads
  for insert to authenticated
  with check (
    exists (
      select 1 from public.sessions s
      where s.id = session_document_uploads.session_id
        and s.reserved_company_id = auth.uid()
    )
    and uploaded_by = auth.uid()
  );

drop policy if exists "sdu delete admin" on public.session_document_uploads;
create policy "sdu delete admin" on public.session_document_uploads
  for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "sad read" on public.session_admin_documents;
create policy "sad read" on public.session_admin_documents
  for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or exists (
      select 1 from public.sessions s
      where s.id = session_admin_documents.session_id
        and s.reserved_company_id = auth.uid()
    )
  );

drop policy if exists "sad write admin" on public.session_admin_documents;
create policy "sad write admin" on public.session_admin_documents
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- 9. RLS storage.objects
drop policy if exists "sad bucket read" on storage.objects;
create policy "sad bucket read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'session-admin-docs'
    and (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
      or exists (
        select 1 from public.sessions s
        where s.id::text = (storage.foldername(name))[1]
          and s.reserved_company_id = auth.uid()
      )
    )
  );

drop policy if exists "sad bucket write admin" on storage.objects;
create policy "sad bucket write admin" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'session-admin-docs'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    bucket_id = 'session-admin-docs'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "seu bucket read" on storage.objects;
create policy "seu bucket read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'session-etab-uploads'
    and (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
      or exists (
        select 1 from public.sessions s
        where s.id::text = (storage.foldername(name))[1]
          and s.reserved_company_id = auth.uid()
      )
    )
  );

drop policy if exists "seu bucket insert etab" on storage.objects;
create policy "seu bucket insert etab" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'session-etab-uploads'
    and exists (
      select 1 from public.sessions s
      where s.id::text = (storage.foldername(name))[1]
        and s.reserved_company_id = auth.uid()
    )
  );

-- Note : email_logs.kind est de type TEXT (cf. 20260523_email_logs.sql),
-- donc aucune extension d'enum n'est nécessaire pour les nouveaux kinds :
-- 'session_reserved_invitation', 'session_reserved_published',
-- 'session_reserved_completed', 'session_reserved_reminder'.
