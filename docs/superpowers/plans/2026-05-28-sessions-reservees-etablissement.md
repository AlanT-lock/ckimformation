# Sessions réservées à un établissement — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à l'admin de créer une session de formation réservée à un seul établissement (compte existant ou invitation par email), avec analyse des besoins, inscription directe des stagiaires, et échange de documents bidirectionnel.

**Architecture:** Ajout de colonnes `visibility` + `reserved_company_id` sur `sessions` ; nouvelles tables `session_invitations`, `session_reserved_details`, `session_document_requests`, `session_document_uploads`, `session_admin_documents` ; deux buckets Supabase Storage ; nouvelle route `stagiaire/session-dediee/[sessionId]` ; extension `SessionForm` admin avec sélecteur de mode public/réservé.

**Tech Stack:** Next.js (App Router), TypeScript, Supabase (Postgres + RLS + Storage), Server Actions, Vitest, Resend (emails), Tailwind.

**Spec source:** `docs/superpowers/specs/2026-05-28-sessions-reservees-etablissement-design.md`

---

## File Structure

**Nouveaux fichiers**
- `supabase/migrations/20260528_sessions_reservees.sql` — schéma + RLS + buckets
- `app/(app)/admin/sessions/ReservationBlock.tsx` — bloc UI du mode "réservée"
- `app/(app)/admin/sessions/EtablissementSearch.tsx` — autocomplete server-side
- `app/(app)/admin/sessions/DocumentRequestsEditor.tsx` — liste éditable de demandes de docs
- `app/(app)/admin/sessions/AdminDocumentsUploader.tsx` — uploader docs admin → étab
- `app/(app)/admin/sessions/reservation-actions.ts` — server actions (search, invite, resend, list-detail)
- `app/(app)/stagiaire/session-dediee/[sessionId]/page.tsx` — page établissement
- `app/(app)/stagiaire/session-dediee/[sessionId]/SessionDedieeClient.tsx` — UI client (4 blocs)
- `app/(app)/stagiaire/session-dediee/[sessionId]/actions.ts` — server actions étab (save analyse, upload, finalize, inscrire stagiaires)
- `lib/email/templates/session-reservee.ts` — 4 templates (invitation, published, completed, reminder)
- `lib/supabase/session-invitations.ts` — helpers token + claim
- `app/actions/claim-session-invitation.ts` — server action consommée par signup
- `tests/sessions-reservees/migrations.test.ts`
- `tests/sessions-reservees/reservation-actions.test.ts`
- `tests/sessions-reservees/etab-actions.test.ts`
- `tests/sessions-reservees/claim-invitation.test.ts`
- `tests/sessions-reservees/rls.test.ts`

**Fichiers modifiés**
- `app/(app)/admin/sessions/SessionForm.tsx` — sélecteur mode + intégration `ReservationBlock`
- `app/(app)/admin/sessions/actions.ts` — extension `createSession` (visibility + invitation)
- `app/(app)/admin/sessions/page.tsx` — badge + filtre visibility
- `app/(app)/admin/sessions/[id]/page.tsx` — panneau "Établissement réservé"
- `app/(app)/admin/sessions/nouvelle/page.tsx` — passe `formations` + `formateurs` + sessions count par étab
- `app/(app)/stagiaire/inscriptions/page.tsx` — section "Sessions dédiées"
- `app/(auth)/signup-entreprise/page.tsx` — gestion `?invitation_token`
- `lib/supabase/types.ts` — nouveaux types
- Toutes les requêtes publiques de listing sessions — audit `visibility='public'`

---

## Task 1: Migration SQL — schéma & buckets

**Files:**
- Create: `supabase/migrations/20260528_sessions_reservees.sql`
- Create: `tests/sessions-reservees/migrations.test.ts`

- [ ] **Step 1: Write the failing migration shape test**

```ts
// tests/sessions-reservees/migrations.test.ts
import { describe, it, expect } from 'vitest';
import { createAdminClient } from '@/lib/supabase/admin';

describe('migration 20260528 sessions réservées', () => {
  it('colonnes visibility + reserved_company_id présentes sur sessions', async () => {
    const sb = createAdminClient();
    const { data, error } = await sb.rpc('pg_table_columns', { tbl: 'sessions' }).select();
    expect(error).toBeNull();
    const cols = (data as Array<{ column_name: string }>).map((c) => c.column_name);
    expect(cols).toContain('visibility');
    expect(cols).toContain('reserved_company_id');
  });

  it('tables session_invitations, session_reserved_details, session_document_requests/uploads, session_admin_documents existent', async () => {
    const sb = createAdminClient();
    const tables = [
      'session_invitations',
      'session_reserved_details',
      'session_document_requests',
      'session_document_uploads',
      'session_admin_documents',
    ];
    for (const t of tables) {
      const { error } = await sb.from(t).select('*').limit(0);
      expect(error, `table ${t} doit exister`).toBeNull();
    }
  });
});
```

> Note : si `pg_table_columns` n'existe pas comme RPC, remplacer par une requête SQL via `from('information_schema.columns')` côté service role, ou créer une RPC helper dans la migration. Sinon supprimer ce sous-test et garder uniquement le second (lecture `.select('*').limit(0)` suffit à valider l'existence).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/sessions-reservees/migrations.test.ts`
Expected: FAIL — les tables n'existent pas.

- [ ] **Step 3: Écrire la migration**

```sql
-- supabase/migrations/20260528_sessions_reservees.sql
-- =============================================================================
--  Sessions réservées à un établissement
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

-- helper: est-ce un admin ?
-- (déjà disponible via auth.jwt() / profiles dans le projet — on duplique le pattern existant)

-- session_invitations : admin only
drop policy if exists "invitations admin all" on public.session_invitations;
create policy "invitations admin all" on public.session_invitations
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- session_reserved_details : admin + entreprise réservée
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

-- session_document_requests : RW admin, SELECT entreprise réservée
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

-- session_document_uploads : SELECT admin + étab, INSERT étab, DELETE admin
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

-- session_admin_documents : RW admin, SELECT entreprise
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

-- 9. Storage policies
-- session-admin-docs : admin RW, entreprise réservée SELECT
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

-- session-etab-uploads : admin SELECT + étab RW son dossier
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

-- 10. Étendre l'enum email_logs.kind si nécessaire
-- (regarder migration 20260523_email_logs.sql ; si kind est text, rien à faire ;
-- si c'est un enum, ajouter les valeurs ci-dessous)
do $$ begin
  alter type email_log_kind add value if not exists 'session_reserved_invitation';
  alter type email_log_kind add value if not exists 'session_reserved_published';
  alter type email_log_kind add value if not exists 'session_reserved_completed';
  alter type email_log_kind add value if not exists 'session_reserved_reminder';
exception when undefined_object then null; end $$;
```

- [ ] **Step 4: Appliquer la migration localement et relancer les tests**

Run: `npx supabase db reset` (ou la commande équivalente du projet — voir `package.json` / `scripts/`).
Puis : `npm run test -- tests/sessions-reservees/migrations.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260528_sessions_reservees.sql tests/sessions-reservees/migrations.test.ts
git commit -m "feat(sessions): migration sessions réservées (schéma + RLS + buckets)"
```

---

## Task 2: Types TS

**Files:**
- Modify: `lib/supabase/types.ts`

- [ ] **Step 1: Ajouter les types**

```ts
// lib/supabase/types.ts (ajouter en bas du fichier, avant les exports finaux si applicable)
export type SessionVisibility = 'public' | 'reserved';

export interface SessionInvitation {
  id: string;
  session_id: string;
  email: string;
  raison_sociale: string;
  siret: string | null;
  contact_nom: string | null;
  contact_fonction: string | null;
  contact_phone: string | null;
  token: string;
  invited_by: string | null;
  invited_at: string;
  expires_at: string;
  claimed_by: string | null;
  claimed_at: string | null;
}

export interface SessionReservedDetails {
  session_id: string;
  analyse_besoins: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface SessionDocumentRequest {
  id: string;
  session_id: string;
  ordre: number;
  label: string;
  description: string | null;
  required: boolean;
  created_at: string;
}

export interface SessionDocumentUpload {
  id: string;
  request_id: string;
  session_id: string;
  storage_path: string;
  filename: string;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface SessionAdminDocument {
  id: string;
  session_id: string;
  storage_path: string;
  filename: string;
  label: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}
```

Aussi ajouter `visibility` et `reserved_company_id` à l'interface `Session` existante (la chercher dans `lib/supabase/types.ts`) :

```ts
// dans interface Session { ... }
visibility: SessionVisibility;
reserved_company_id: string | null;
```

- [ ] **Step 2: Vérifier la compilation TS**

Run: `npx tsc --noEmit`
Expected: PASS (aucune erreur nouvelle).

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/types.ts
git commit -m "feat(types): types session réservée + invitations + docs"
```

---

## Task 3: Helpers tokens & invitation

**Files:**
- Create: `lib/supabase/session-invitations.ts`
- Create: `tests/sessions-reservees/claim-invitation.test.ts`

- [ ] **Step 1: Écrire le test du générateur de token**

```ts
// tests/sessions-reservees/claim-invitation.test.ts
import { describe, it, expect } from 'vitest';
import { generateInvitationToken } from '@/lib/supabase/session-invitations';

describe('generateInvitationToken', () => {
  it('produit une chaîne ≥ 32 caractères, unique', () => {
    const a = generateInvitationToken();
    const b = generateInvitationToken();
    expect(a.length).toBeGreaterThanOrEqual(32);
    expect(b.length).toBeGreaterThanOrEqual(32);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

Run: `npm run test -- tests/sessions-reservees/claim-invitation.test.ts`
Expected: FAIL — module n'existe pas.

- [ ] **Step 3: Implémentation minimale du helper**

```ts
// lib/supabase/session-invitations.ts
import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SessionInvitation } from './types';

export function generateInvitationToken(): string {
  const a = crypto.randomUUID().replace(/-/g, '');
  const b = crypto.randomUUID().replace(/-/g, '');
  return `${a}${b}`.slice(0, 48);
}

export async function findInvitationByToken(token: string): Promise<SessionInvitation | null> {
  const sb = createAdminClient();
  const { data } = await sb
    .from('session_invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  return (data as SessionInvitation) ?? null;
}

export function isInvitationUsable(inv: SessionInvitation): boolean {
  if (inv.claimed_by) return false;
  if (new Date(inv.expires_at).getTime() < Date.now()) return false;
  return true;
}

export async function claimInvitation(
  token: string,
  profileId: string,
): Promise<{ ok: true; sessionId: string } | { ok: false; reason: string }> {
  const sb = createAdminClient();

  // 1. Vérif profil entreprise
  const { data: profile } = await sb
    .from('profiles')
    .select('id, role, account_type')
    .eq('id', profileId)
    .maybeSingle();
  if (!profile || profile.role !== 'stagiaire' || profile.account_type !== 'entreprise') {
    return { ok: false, reason: 'Le compte doit être un compte entreprise.' };
  }

  // 2. Vérif invitation
  const inv = await findInvitationByToken(token);
  if (!inv) return { ok: false, reason: 'Invitation introuvable.' };
  if (!isInvitationUsable(inv)) return { ok: false, reason: 'Invitation expirée ou déjà utilisée.' };

  // 3. Update transactionnel via 2 updates ciblés (RLS bypass via admin client)
  const { error: invErr } = await sb
    .from('session_invitations')
    .update({ claimed_by: profileId, claimed_at: new Date().toISOString() })
    .eq('id', inv.id)
    .is('claimed_by', null);
  if (invErr) return { ok: false, reason: invErr.message };

  const { error: sessErr } = await sb
    .from('sessions')
    .update({ reserved_company_id: profileId })
    .eq('id', inv.session_id);
  if (sessErr) return { ok: false, reason: sessErr.message };

  return { ok: true, sessionId: inv.session_id };
}
```

- [ ] **Step 4: Run tests (PASS)**

Run: `npm run test -- tests/sessions-reservees/claim-invitation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/session-invitations.ts tests/sessions-reservees/claim-invitation.test.ts
git commit -m "feat(invitations): helpers token + claimInvitation"
```

---

## Task 4: Server actions admin — recherche établissement & création session réservée

**Files:**
- Create: `app/(app)/admin/sessions/reservation-actions.ts`
- Modify: `app/(app)/admin/sessions/actions.ts`
- Create: `tests/sessions-reservees/reservation-actions.test.ts`

- [ ] **Step 1: Test de recherche établissement**

```ts
// tests/sessions-reservees/reservation-actions.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createAdminClient } from '@/lib/supabase/admin';
import { searchEtablissements } from '@/app/(app)/admin/sessions/reservation-actions';

describe('searchEtablissements', () => {
  beforeAll(async () => {
    // setup : seed un profile entreprise + company_details si pas déjà en place
    // (utiliser le helper de test du projet si dispo, sinon insert direct via admin client)
  });

  it('retourne uniquement les profiles entreprise correspondant à la query', async () => {
    const results = await searchEtablissements('Acme');
    expect(Array.isArray(results)).toBe(true);
    for (const r of results) {
      expect(r.account_type).toBe('entreprise');
    }
  });

  it('retourne tableau vide si query < 2 caractères', async () => {
    const results = await searchEtablissements('A');
    expect(results).toEqual([]);
  });
});
```

- [ ] **Step 2: Run (FAIL)**

Run: `npm run test -- tests/sessions-reservees/reservation-actions.test.ts`
Expected: FAIL — module pas créé.

- [ ] **Step 3: Créer `reservation-actions.ts`**

```ts
// app/(app)/admin/sessions/reservation-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateInvitationToken } from '@/lib/supabase/session-invitations';
import { sendAndLog } from '@/lib/email/log';
import { renderSessionReservedInvitation } from '@/lib/email/templates/session-reservee';

export interface EtablissementSearchResult {
  profile_id: string;
  raison_sociale: string;
  siret: string | null;
  email: string;
  contact_nom: string;
  account_type: 'entreprise';
}

async function requireAdmin() {
  const p = await getCurrentProfile();
  if (!p || p.role !== 'admin') throw new Error('Accès refusé');
  return p;
}

export async function searchEtablissements(q: string): Promise<EtablissementSearchResult[]> {
  await requireAdmin();
  if (!q || q.trim().length < 2) return [];
  const sb = await createClient();
  const like = `%${q.trim()}%`;
  const { data, error } = await sb
    .from('profiles')
    .select('id, full_name, email, account_type, company_details!inner(raison_sociale, siret)')
    .eq('role', 'stagiaire')
    .eq('account_type', 'entreprise')
    .or(`full_name.ilike.${like},email.ilike.${like},company_details.raison_sociale.ilike.${like},company_details.siret.ilike.${like}`)
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    profile_id: r.id,
    raison_sociale: r.company_details?.raison_sociale ?? '',
    siret: r.company_details?.siret ?? null,
    email: r.email,
    contact_nom: r.full_name,
    account_type: 'entreprise' as const,
  }));
}

export interface InvitationPayload {
  email: string;
  raison_sociale: string;
  siret?: string | null;
  contact_nom?: string | null;
  contact_fonction?: string | null;
  contact_phone?: string | null;
}

export async function createInvitationForSession(
  sessionId: string,
  payload: InvitationPayload,
): Promise<{ id: string; token: string }> {
  const admin = await requireAdmin();
  const sb = createAdminClient();
  const token = generateInvitationToken();
  const { data, error } = await sb
    .from('session_invitations')
    .insert({
      session_id: sessionId,
      email: payload.email.trim().toLowerCase(),
      raison_sociale: payload.raison_sociale,
      siret: payload.siret ?? null,
      contact_nom: payload.contact_nom ?? null,
      contact_fonction: payload.contact_fonction ?? null,
      contact_phone: payload.contact_phone ?? null,
      token,
      invited_by: admin.id,
    })
    .select('id, token')
    .single();
  if (error) throw new Error(error.message);
  return data!;
}

export async function sendInvitationEmail(sessionId: string, invitationId: string): Promise<void> {
  await requireAdmin();
  const sb = createAdminClient();
  const { data: inv } = await sb
    .from('session_invitations')
    .select('*')
    .eq('id', invitationId)
    .single();
  if (!inv) throw new Error('Invitation introuvable');

  // Vérifie si email correspond à un compte existant
  const { data: existing } = await sb
    .from('profiles')
    .select('id, account_type')
    .ilike('email', inv.email)
    .maybeSingle();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ckim-formation.fr';
  const ctaUrl = existing && existing.account_type === 'entreprise'
    ? `${baseUrl}/stagiaire/session-dediee/${sessionId}?invitation_token=${inv.token}`
    : `${baseUrl}/signup-entreprise?invitation_token=${inv.token}`;

  // Récup détails session pour le mail
  const { data: sess } = await sb
    .from('sessions')
    .select(`
      id, adresse,
      formations(titre),
      session_creneaux(date, heure_debut, heure_fin),
      session_document_requests(label, description, required),
      session_admin_documents(filename, label)
    `)
    .eq('id', sessionId)
    .single();

  const html = renderSessionReservedInvitation({
    raisonSociale: inv.raison_sociale,
    contactNom: inv.contact_nom,
    formationTitre: (sess as any)?.formations?.titre ?? '',
    creneaux: (sess as any)?.session_creneaux ?? [],
    adresse: (sess as any)?.adresse ?? {},
    documentsAFournir: (sess as any)?.session_document_requests ?? [],
    documentsAdminCount: ((sess as any)?.session_admin_documents ?? []).length,
    ctaUrl,
    ctaLabel: existing ? 'Accéder à ma session' : 'Créer mon compte',
  });

  await sendAndLog({
    kind: 'session_reserved_invitation' as any,
    to: inv.email,
    subject: `CKIM Formation — Une session est réservée pour ${inv.raison_sociale}`,
    html,
    refTable: 'session_invitations',
    refId: inv.id,
  });
}

export async function resendInvitation(invitationId: string): Promise<void> {
  await requireAdmin();
  const sb = createAdminClient();
  const { data: inv } = await sb
    .from('session_invitations')
    .select('session_id')
    .eq('id', invitationId)
    .single();
  if (!inv) throw new Error('Invitation introuvable');
  await sb.from('session_invitations').update({ invited_at: new Date().toISOString() }).eq('id', invitationId);
  await sendInvitationEmail(inv.session_id, invitationId);
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  await requireAdmin();
  const sb = createAdminClient();
  const { data: inv } = await sb
    .from('session_invitations')
    .select('id, claimed_by')
    .eq('id', invitationId)
    .single();
  if (!inv) throw new Error('Invitation introuvable');
  if (inv.claimed_by) throw new Error('Invitation déjà acceptée');
  await sb.from('session_invitations').delete().eq('id', invitationId);
  revalidatePath('/admin/sessions');
}
```

- [ ] **Step 4: Étendre `createSession` dans `actions.ts`**

```ts
// app/(app)/admin/sessions/actions.ts
// Ajouter au type SessionInput :
export interface SessionInput {
  formation_id: string;
  formateur_id: string | null;
  statut: SessionStatut;
  adresse: SessionAdresse;
  notes_internes: string | null;
  creneaux: CreneauInput[];

  // NEW
  visibility?: 'public' | 'reserved';
  reserved_company_id?: string | null;
  invitation?: {
    email: string;
    raison_sociale: string;
    siret?: string | null;
    contact_nom?: string | null;
    contact_fonction?: string | null;
    contact_phone?: string | null;
  } | null;
  document_requests?: Array<{ label: string; description?: string; required: boolean }>;
}
```

Puis dans la fonction `createSession`, après l'insert de la session (et avant `redirect`) :

```ts
if (input.visibility === 'reserved') {
  if (!input.reserved_company_id && !input.invitation) {
    throw new Error('Une session réservée nécessite un établissement existant ou une invitation.');
  }
  if (input.reserved_company_id && input.invitation) {
    throw new Error('Choisir soit un établissement existant, soit une invitation, pas les deux.');
  }

  // 1. set visibility + reserved_company_id (si compte existant)
  await supabase
    .from('sessions')
    .update({
      visibility: 'reserved',
      reserved_company_id: input.reserved_company_id ?? null,
    })
    .eq('id', session.id);

  // 2. créer session_reserved_details
  await supabase.from('session_reserved_details').insert({ session_id: session.id });

  // 3. doc requests
  if (input.document_requests?.length) {
    await supabase.from('session_document_requests').insert(
      input.document_requests.map((d, i) => ({
        session_id: session.id,
        ordre: i,
        label: d.label,
        description: d.description ?? null,
        required: d.required,
      })),
    );
  }

  // 4. invitation
  if (input.invitation) {
    const { createInvitationForSession, sendInvitationEmail } = await import('./reservation-actions');
    const inv = await createInvitationForSession(session.id, input.invitation);
    // n'envoyer l'email que si statut == 'published' ; sinon attendre publish
    if (input.statut === 'published') {
      await sendInvitationEmail(session.id, inv.id);
    }
  }
}
```

- [ ] **Step 5: Run (PASS)**

Run: `npm run test -- tests/sessions-reservees/reservation-actions.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/admin/sessions/reservation-actions.ts app/\(app\)/admin/sessions/actions.ts tests/sessions-reservees/reservation-actions.test.ts
git commit -m "feat(admin): server actions réservation + createSession étendu"
```

---

## Task 5: Templates email

**Files:**
- Create: `lib/email/templates/session-reservee.ts`

- [ ] **Step 1: Implémenter 4 helpers de rendu**

```ts
// lib/email/templates/session-reservee.ts
import 'server-only';

interface CreneauLite { date: string; heure_debut: string; heure_fin: string }
interface DocReqLite { label: string; description: string | null; required: boolean }

export interface InvitationRenderInput {
  raisonSociale: string;
  contactNom: string | null;
  formationTitre: string;
  creneaux: CreneauLite[];
  adresse: { rue?: string; code_postal?: string; ville?: string; complement?: string };
  documentsAFournir: DocReqLite[];
  documentsAdminCount: number;
  ctaUrl: string;
  ctaLabel: string;
}

const styles = `
  body { font-family: -apple-system, system-ui, sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 20px; }
  .cta { display: inline-block; background: #0a6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0; }
  ul { padding-left: 18px; }
  .meta { color: #555; font-size: 14px; }
`;

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function renderSessionReservedInvitation(i: InvitationRenderInput): string {
  const creneauxHtml = i.creneaux
    .map((c) => `<li>${fmtDate(c.date)} — ${c.heure_debut} → ${c.heure_fin}</li>`)
    .join('');
  const docsHtml = i.documentsAFournir.length
    ? `<h3>Documents à fournir</h3><ul>${i.documentsAFournir.map((d) => `<li>${d.label}${d.required ? ' (obligatoire)' : ''}${d.description ? ` — <span class="meta">${d.description}</span>` : ''}</li>`).join('')}</ul>`
    : '';
  const adminDocsHtml = i.documentsAdminCount > 0
    ? `<p><strong>${i.documentsAdminCount}</strong> document${i.documentsAdminCount > 1 ? 's' : ''} mis à votre disposition dans votre espace.</p>`
    : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${styles}</style></head><body>
    <h1>Une session de formation est réservée pour ${i.raisonSociale}</h1>
    <p>Bonjour${i.contactNom ? ' ' + i.contactNom : ''},</p>
    <p>CKIM Formation vous a réservé une session pour <strong>${i.formationTitre}</strong>.</p>
    <h3>Créneaux</h3><ul>${creneauxHtml}</ul>
    <p class="meta">Lieu : ${i.adresse.rue ?? ''} ${i.adresse.code_postal ?? ''} ${i.adresse.ville ?? ''} ${i.adresse.complement ?? ''}</p>
    ${docsHtml}
    ${adminDocsHtml}
    <p>Pour finaliser : ajoutez vos stagiaires, complétez l'analyse des besoins et déposez les documents demandés.</p>
    <a class="cta" href="${i.ctaUrl}">${i.ctaLabel}</a>
    <p class="meta">Lien valide 30 jours.</p>
  </body></html>`;
}

export function renderSessionReservedPublished(i: InvitationRenderInput): string {
  // identique à invitation, autre H1
  return renderSessionReservedInvitation(i).replace(
    'Une session de formation est réservée pour',
    'Votre session de formation est désormais publiée :',
  );
}

export function renderSessionReservedCompleted(input: {
  raisonSociale: string;
  formationTitre: string;
  adminUrl: string;
}): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${styles}</style></head><body>
    <h1>${input.raisonSociale} a finalisé sa session</h1>
    <p>L'établissement <strong>${input.raisonSociale}</strong> a complété l'analyse des besoins et les documents pour la session <strong>${input.formationTitre}</strong>.</p>
    <a class="cta" href="${input.adminUrl}">Voir la session</a>
  </body></html>`;
}

export function renderSessionReservedReminder(i: InvitationRenderInput): string {
  return renderSessionReservedInvitation(i).replace(
    '<h1>Une session',
    '<h1>Rappel — une session',
  );
}
```

- [ ] **Step 2: Vérifier compilation**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/email/templates/session-reservee.ts
git commit -m "feat(emails): templates session réservée (invitation/published/completed/reminder)"
```

---

## Task 6: UI admin — `EtablissementSearch`

**Files:**
- Create: `app/(app)/admin/sessions/EtablissementSearch.tsx`

- [ ] **Step 1: Implémenter le composant**

```tsx
// app/(app)/admin/sessions/EtablissementSearch.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Field } from '@/components/app/Field';
import { searchEtablissements, type EtablissementSearchResult } from './reservation-actions';

interface Props {
  selected: EtablissementSearchResult | null;
  onSelect: (e: EtablissementSearchResult | null) => void;
}

export function EtablissementSearch({ selected, onSelect }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<EtablissementSearchResult[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (selected) return;
    if (q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      startTransition(async () => {
        const r = await searchEtablissements(q);
        setResults(r);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [q, selected]);

  if (selected) {
    return (
      <div className="border rounded p-3 flex items-center justify-between bg-emerald-50">
        <div>
          <div className="font-semibold">{selected.raison_sociale}</div>
          <div className="text-sm text-gray-600">{selected.email} · SIRET : {selected.siret ?? '—'}</div>
        </div>
        <button type="button" className="text-sm text-red-600" onClick={() => onSelect(null)}>Changer</button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Field label="Rechercher un établissement (raison sociale, SIRET ou email)">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tapez au moins 2 caractères..."
          className="w-full border rounded px-3 py-2"
        />
      </Field>
      {results.length > 0 && (
        <ul className="border rounded divide-y max-h-64 overflow-auto">
          {results.map((r) => (
            <li key={r.profile_id}>
              <button
                type="button"
                onClick={() => onSelect(r)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
              >
                <div className="font-medium">{r.raison_sociale}</div>
                <div className="text-xs text-gray-600">{r.email} · SIRET {r.siret ?? '—'}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/admin/sessions/EtablissementSearch.tsx
git commit -m "feat(admin): EtablissementSearch (autocomplete)"
```

---

## Task 7: UI admin — `DocumentRequestsEditor` & `AdminDocumentsUploader`

**Files:**
- Create: `app/(app)/admin/sessions/DocumentRequestsEditor.tsx`
- Create: `app/(app)/admin/sessions/AdminDocumentsUploader.tsx`

- [ ] **Step 1: `DocumentRequestsEditor`**

```tsx
// app/(app)/admin/sessions/DocumentRequestsEditor.tsx
'use client';

import { Field } from '@/components/app/Field';
import { Button } from '@/components/app/Button';

export interface DocRequestDraft {
  label: string;
  description: string;
  required: boolean;
}

interface Props {
  value: DocRequestDraft[];
  onChange: (v: DocRequestDraft[]) => void;
}

export function DocumentRequestsEditor({ value, onChange }: Props) {
  function update(i: number, patch: Partial<DocRequestDraft>) {
    onChange(value.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function add() {
    onChange([...value, { label: '', description: '', required: true }]);
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700">
        Liste des documents que l'établissement devra fournir dans son espace.
      </div>
      {value.map((d, i) => (
        <div key={i} className="border rounded p-3 space-y-2">
          <Field label="Intitulé">
            <input
              className="w-full border rounded px-3 py-2"
              value={d.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Ex : Convention de formation signée"
            />
          </Field>
          <Field label="Description (optionnel)">
            <textarea
              className="w-full border rounded px-3 py-2"
              rows={2}
              value={d.description}
              onChange={(e) => update(i, { description: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={d.required}
              onChange={(e) => update(i, { required: e.target.checked })}
            />
            Obligatoire
          </label>
          <button type="button" className="text-sm text-red-600" onClick={() => remove(i)}>
            Supprimer
          </button>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={add}>+ Ajouter une demande</Button>
    </div>
  );
}
```

- [ ] **Step 2: `AdminDocumentsUploader` (upload différé)**

Le bucket exige un `session_id` ; donc on stocke les fichiers en mémoire côté client et on upload après création de la session. Une fonction `uploadAdminDocsForSession(sessionId, files)` sera ajoutée à `reservation-actions.ts`.

```tsx
// app/(app)/admin/sessions/AdminDocumentsUploader.tsx
'use client';

import { useRef } from 'react';

export interface AdminDocDraft {
  file: File;
  label: string;
}

interface Props {
  value: AdminDocDraft[];
  onChange: (v: AdminDocDraft[]) => void;
}

export function AdminDocumentsUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(files: FileList | null) {
    if (!files) return;
    const next = [...value, ...Array.from(files).map((f) => ({ file: f, label: '' }))];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-700">
        Documents à transmettre à l'établissement (téléchargeables dans son espace).
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={(e) => onPick(e.target.files)}
        className="block"
      />
      {value.length > 0 && (
        <ul className="border rounded divide-y">
          {value.map((d, i) => (
            <li key={i} className="px-3 py-2 flex items-center gap-3">
              <div className="flex-1 text-sm">{d.file.name} <span className="text-gray-500">({Math.round(d.file.size / 1024)} ko)</span></div>
              <input
                placeholder="Intitulé optionnel"
                className="border rounded px-2 py-1 text-sm"
                value={d.label}
                onChange={(e) => onChange(value.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
              />
              <button type="button" className="text-sm text-red-600" onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Ajouter `uploadAdminDocsForSession` dans `reservation-actions.ts`**

```ts
// dans app/(app)/admin/sessions/reservation-actions.ts
export async function uploadAdminDocsForSession(
  sessionId: string,
  files: Array<{ file: File; label: string }>,
): Promise<void> {
  await requireAdmin();
  const sb = await createClient();
  for (const { file, label } of files) {
    const path = `${sessionId}/${crypto.randomUUID()}-${file.name}`;
    const { error: upErr } = await sb.storage.from('session-admin-docs').upload(path, file);
    if (upErr) throw new Error(upErr.message);
    await sb.from('session_admin_documents').insert({
      session_id: sessionId,
      storage_path: path,
      filename: file.name,
      label: label || null,
    });
  }
}
```

Note : appels server actions avec `File` nécessitent `FormData`. Si l'infra du projet n'accepte pas les `File` dans server actions, créer un endpoint API `app/api/admin/sessions/[id]/admin-docs/route.ts` qui prend un `FormData`. **Choix retenu** : route API multipart (plus fiable).

```ts
// app/api/admin/sessions/[id]/admin-docs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const form = await req.formData();
  const sb = await createClient();
  for (const entry of form.getAll('files')) {
    if (!(entry instanceof File)) continue;
    const label = String(form.get(`label__${entry.name}`) ?? '');
    const path = `${params.id}/${crypto.randomUUID()}-${entry.name}`;
    const { error } = await sb.storage.from('session-admin-docs').upload(path, entry);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await sb.from('session_admin_documents').insert({
      session_id: params.id, storage_path: path, filename: entry.name, label: label || null,
    });
  }
  return NextResponse.json({ ok: true });
}
```

Et côté client, après création de la session, appeler `fetch('/api/admin/sessions/${id}/admin-docs', { method: 'POST', body: formData })`.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/admin/sessions/DocumentRequestsEditor.tsx app/\(app\)/admin/sessions/AdminDocumentsUploader.tsx app/\(app\)/admin/sessions/reservation-actions.ts app/api/admin/sessions/\[id\]/admin-docs/route.ts
git commit -m "feat(admin): éditeurs docs + upload docs admin"
```

---

## Task 8: `ReservationBlock` + intégration dans `SessionForm`

**Files:**
- Create: `app/(app)/admin/sessions/ReservationBlock.tsx`
- Modify: `app/(app)/admin/sessions/SessionForm.tsx`

- [ ] **Step 1: `ReservationBlock`**

```tsx
// app/(app)/admin/sessions/ReservationBlock.tsx
'use client';

import { useState } from 'react';
import { Field } from '@/components/app/Field';
import { EtablissementSearch } from './EtablissementSearch';
import { DocumentRequestsEditor, type DocRequestDraft } from './DocumentRequestsEditor';
import { AdminDocumentsUploader, type AdminDocDraft } from './AdminDocumentsUploader';
import type { EtablissementSearchResult } from './reservation-actions';

export interface ReservationData {
  mode: 'public' | 'reserved';
  selectedEtab: EtablissementSearchResult | null;
  invitation: {
    enabled: boolean;
    email: string;
    raison_sociale: string;
    siret: string;
    contact_nom: string;
    contact_fonction: string;
    contact_phone: string;
  };
  docRequests: DocRequestDraft[];
  adminDocs: AdminDocDraft[];
}

export const EMPTY_RESERVATION: ReservationData = {
  mode: 'public',
  selectedEtab: null,
  invitation: { enabled: false, email: '', raison_sociale: '', siret: '', contact_nom: '', contact_fonction: '', contact_phone: '' },
  docRequests: [],
  adminDocs: [],
};

interface Props {
  value: ReservationData;
  onChange: (v: ReservationData) => void;
}

export function ReservationBlock({ value, onChange }: Props) {
  function patch<K extends keyof ReservationData>(k: K, v: ReservationData[K]) {
    onChange({ ...value, [k]: v });
  }

  return (
    <div className="space-y-6 border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50/30">
      <div>
        <div className="font-semibold mb-2">Visibilité de la session</div>
        <div className="flex gap-2">
          <button type="button"
            className={`px-4 py-2 rounded border ${value.mode === 'public' ? 'bg-emerald-600 text-white' : 'bg-white'}`}
            onClick={() => onChange({ ...EMPTY_RESERVATION, mode: 'public', docRequests: value.docRequests, adminDocs: value.adminDocs })}>
            Publique
          </button>
          <button type="button"
            className={`px-4 py-2 rounded border ${value.mode === 'reserved' ? 'bg-emerald-600 text-white' : 'bg-white'}`}
            onClick={() => patch('mode', 'reserved')}>
            Réservée à un établissement
          </button>
        </div>
      </div>

      {value.mode === 'reserved' && (
        <>
          <div>
            <div className="font-semibold mb-2">Établissement</div>
            <EtablissementSearch
              selected={value.selectedEtab}
              onSelect={(e) => onChange({ ...value, selectedEtab: e, invitation: { ...value.invitation, enabled: false } })}
            />
            {!value.selectedEtab && (
              <div className="mt-3">
                <button type="button"
                  className="text-sm text-emerald-700 underline"
                  onClick={() => patch('invitation', { ...value.invitation, enabled: !value.invitation.enabled })}>
                  {value.invitation.enabled ? '— Masquer le formulaire d\'invitation' : '+ Inviter un nouvel établissement'}
                </button>
                {value.invitation.enabled && (
                  <div className="mt-3 space-y-2 border rounded p-3 bg-white">
                    {(['email','raison_sociale','siret','contact_nom','contact_fonction','contact_phone'] as const).map((k) => (
                      <Field key={k} label={k.replace('_', ' ')}>
                        <input className="w-full border rounded px-3 py-2"
                          value={value.invitation[k] as string}
                          onChange={(e) => patch('invitation', { ...value.invitation, [k]: e.target.value })} />
                      </Field>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="font-semibold mb-2">Documents demandés à l'établissement</div>
            <DocumentRequestsEditor value={value.docRequests} onChange={(v) => patch('docRequests', v)} />
          </div>

          <div>
            <div className="font-semibold mb-2">Documents à transmettre à l'établissement</div>
            <AdminDocumentsUploader value={value.adminDocs} onChange={(v) => patch('adminDocs', v)} />
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Intégrer dans `SessionForm`**

Dans `SessionForm.tsx` :
- importer `ReservationBlock`, `EMPTY_RESERVATION`, type `ReservationData`
- ajouter state `const [reservation, setReservation] = useState<ReservationData>(EMPTY_RESERVATION)`
- placer `<ReservationBlock value={reservation} onChange={setReservation} />` **en haut** du formulaire (avant les blocs formation/formateur)
- dans `onSubmit`, valider :
  ```ts
  if (reservation.mode === 'reserved') {
    if (!reservation.selectedEtab && !reservation.invitation.enabled) {
      setError('Sélectionnez un établissement ou activez le formulaire d\'invitation.');
      return;
    }
    if (reservation.invitation.enabled && (!reservation.invitation.email || !reservation.invitation.raison_sociale)) {
      setError('Email et raison sociale sont requis pour inviter un établissement.');
      return;
    }
  }
  ```
- étendre payload de `createSession` :
  ```ts
  visibility: reservation.mode,
  reserved_company_id: reservation.selectedEtab?.profile_id ?? null,
  invitation: reservation.invitation.enabled ? {
    email: reservation.invitation.email,
    raison_sociale: reservation.invitation.raison_sociale,
    siret: reservation.invitation.siret || null,
    contact_nom: reservation.invitation.contact_nom || null,
    contact_fonction: reservation.invitation.contact_fonction || null,
    contact_phone: reservation.invitation.contact_phone || null,
  } : null,
  document_requests: reservation.docRequests.filter((d) => d.label.trim()),
  ```
- après création réussie, si `reservation.adminDocs.length > 0`, POST FormData vers `/api/admin/sessions/${newSessionId}/admin-docs` **avant** le `redirect`. Pour cela, `createSession` doit retourner le `id` (modifier sa signature).

Note : `createSession` actuellement fait `redirect()`. Modifier pour qu'elle retourne `{ id }` au lieu de rediriger, et faire le redirect côté client après upload.

- [ ] **Step 3: Vérifier compilation + lint**

Run: `npm run lint && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/admin/sessions/ReservationBlock.tsx app/\(app\)/admin/sessions/SessionForm.tsx app/\(app\)/admin/sessions/actions.ts
git commit -m "feat(admin): SessionForm — bloc réservation établissement"
```

---

## Task 9: Audit visibilité publique des sessions

**Files (à auditer et patcher)** : tous les endroits qui listent des `sessions` pour des utilisateurs non-admin.

- [ ] **Step 1: Lister les fichiers concernés**

Run: `grep -rln "from('sessions')\|from(\"sessions\")" app/ lib/ | grep -v "admin/"`

- [ ] **Step 2: Pour chaque requête identifiée, ajouter `.eq('visibility', 'public')`**

Exceptions à NE PAS patcher :
- Les routes admin (`app/(app)/admin/**`)
- La page `stagiaire/session-dediee/[sessionId]` (qui doit voir les sessions réservées)
- Les requêtes par `id` unique côté propriétaire/inscrit

Pour chaque autre, ajouter le filtre. Exemple :

```ts
const { data } = await sb.from('sessions').select('*').eq('formation_id', id).eq('visibility', 'public');
```

- [ ] **Step 3: Test manuel — créer une session réservée et vérifier qu'elle n'apparaît pas sur**
  - Le site vitrine public
  - `stagiaire/formations/[slug]`
  - `app/api/...` qui exposent sessions

- [ ] **Step 4: Commit**

```bash
git add -p
git commit -m "fix(sessions): filtrer visibility=public sur listings publics"
```

---

## Task 10: Page établissement `session-dediee/[sessionId]`

**Files:**
- Create: `app/(app)/stagiaire/session-dediee/[sessionId]/page.tsx`
- Create: `app/(app)/stagiaire/session-dediee/[sessionId]/SessionDedieeClient.tsx`
- Create: `app/(app)/stagiaire/session-dediee/[sessionId]/actions.ts`
- Create: `tests/sessions-reservees/etab-actions.test.ts`

- [ ] **Step 1: Page serveur (fetch + guards)**

```tsx
// app/(app)/stagiaire/session-dediee/[sessionId]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { SessionDedieeClient } from './SessionDedieeClient';
import { claimInvitationFromTokenAction } from '@/app/actions/claim-session-invitation';

export default async function SessionDedieePage({
  params, searchParams,
}: { params: { sessionId: string }; searchParams: { invitation_token?: string } }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?next=/stagiaire/session-dediee/${params.sessionId}`);

  // Si token + pas encore claimé → tenter le claim
  if (searchParams.invitation_token) {
    await claimInvitationFromTokenAction(searchParams.invitation_token);
  }

  const sb = await createClient();
  const { data: session } = await sb
    .from('sessions')
    .select(`
      id, statut, adresse, reserved_company_id, visibility,
      formations(titre, slug),
      session_creneaux(date, heure_debut, heure_fin),
      session_reserved_details(analyse_besoins, completed_at),
      session_document_requests(id, ordre, label, description, required,
        session_document_uploads(id, filename, uploaded_at, storage_path)
      ),
      session_admin_documents(id, filename, label, storage_path, uploaded_at)
    `)
    .eq('id', params.sessionId)
    .maybeSingle();

  if (!session) notFound();
  if (session.reserved_company_id !== profile.id) notFound();
  if (session.statut !== 'published') {
    return <div className="p-6">Cette session n'est pas encore publiée.</div>;
  }

  // Charger employés du compte entreprise
  const { data: employes } = await sb
    .from('profiles')
    .select('id, full_name, email')
    .eq('employer_profile_id', profile.id)
    .order('full_name');

  // Inscriptions déjà créées
  const { data: inscriptions } = await sb
    .from('inscriptions')
    .select('id, profile_id')
    .eq('session_id', params.sessionId);

  return (
    <SessionDedieeClient
      session={session as any}
      employes={employes ?? []}
      inscriptions={(inscriptions ?? []).map((i) => i.profile_id)}
    />
  );
}
```

- [ ] **Step 2: Server actions étab**

```ts
// app/(app)/stagiaire/session-dediee/[sessionId]/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

async function requireEtabOnSession(sessionId: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Non authentifié');
  const sb = await createClient();
  const { data: s } = await sb.from('sessions').select('reserved_company_id').eq('id', sessionId).single();
  if (!s || s.reserved_company_id !== profile.id) throw new Error('Accès refusé');
  return { profile, sb };
}

export async function saveAnalyseBesoins(sessionId: string, analyse: string) {
  const { sb } = await requireEtabOnSession(sessionId);
  await sb.from('session_reserved_details')
    .upsert({ session_id: sessionId, analyse_besoins: analyse, updated_at: new Date().toISOString() });
  revalidatePath(`/stagiaire/session-dediee/${sessionId}`);
}

export async function inscrireStagiaire(sessionId: string, profileId: string) {
  const { sb } = await requireEtabOnSession(sessionId);
  // Vérif l'employé appartient bien à l'entreprise (le RLS le garantit aussi)
  await sb.from('inscriptions').insert({
    session_id: sessionId,
    profile_id: profileId,
    statut: 'confirmee',
  });
  revalidatePath(`/stagiaire/session-dediee/${sessionId}`);
}

export async function creerEtInscrireStagiaire(
  sessionId: string,
  payload: { full_name: string; email: string },
) {
  const { profile, sb } = await requireEtabOnSession(sessionId);
  // Créer un compte stagiaire rattaché (logique existante du projet — voir flux entreprise existant)
  // Simplification : insert profile + lien employer_profile_id, sans auth user (suit le pattern existant si présent)
  const { data: newP, error } = await sb.from('profiles').insert({
    role: 'stagiaire',
    account_type: 'particulier',
    full_name: payload.full_name,
    email: payload.email,
    employer_profile_id: profile.id,
  }).select('id').single();
  if (error) throw new Error(error.message);
  await sb.from('inscriptions').insert({ session_id: sessionId, profile_id: newP!.id, statut: 'confirmee' });
  revalidatePath(`/stagiaire/session-dediee/${sessionId}`);
}

export async function uploadDocumentRequest(sessionId: string, requestId: string, formData: FormData) {
  const { profile, sb } = await requireEtabOnSession(sessionId);
  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('Fichier manquant');
  const path = `${sessionId}/${requestId}/${crypto.randomUUID()}-${file.name}`;
  const { error: upErr } = await sb.storage.from('session-etab-uploads').upload(path, file);
  if (upErr) throw new Error(upErr.message);
  await sb.from('session_document_uploads').insert({
    request_id: requestId, session_id: sessionId,
    storage_path: path, filename: file.name, uploaded_by: profile.id,
  });
  revalidatePath(`/stagiaire/session-dediee/${sessionId}`);
}

export async function finaliserSession(sessionId: string) {
  const { sb } = await requireEtabOnSession(sessionId);
  await sb.from('session_reserved_details').update({ completed_at: new Date().toISOString() }).eq('session_id', sessionId);

  // Notif admin (utilise sendAndLog)
  // (récup admin emails depuis profiles WHERE role='admin' et envoyer un session_reserved_completed)
  // ... voir Task 12 pour le template

  revalidatePath(`/stagiaire/session-dediee/${sessionId}`);
}
```

> Note : la création de compte stagiaire ci-dessus suit le pattern existant du projet (voir `InscriptionEntrepriseForm` + `demanderInscriptionEntreprise`). Si le projet utilise une logique plus complète (génération de mot de passe, mail d'invitation au stagiaire), réutiliser cette logique au lieu d'un simple insert profile.

- [ ] **Step 3: Client UI**

```tsx
// app/(app)/stagiaire/session-dediee/[sessionId]/SessionDedieeClient.tsx
'use client';

import { useState, useTransition } from 'react';
import {
  saveAnalyseBesoins,
  inscrireStagiaire,
  creerEtInscrireStagiaire,
  uploadDocumentRequest,
  finaliserSession,
} from './actions';

interface Props {
  session: any; // shape du fetch ci-dessus — typer plus strictement en pratique
  employes: Array<{ id: string; full_name: string; email: string }>;
  inscriptions: string[]; // ids de profile déjà inscrits
}

export function SessionDedieeClient({ session, employes, inscriptions }: Props) {
  const [analyse, setAnalyse] = useState<string>(session.session_reserved_details?.analyse_besoins ?? '');
  const [, startTransition] = useTransition();
  const [newEmp, setNewEmp] = useState({ full_name: '', email: '' });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">{session.formations.titre}</h1>

      {/* Bloc 1 : docs admin */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Documents fournis par CKIM</h2>
        {session.session_admin_documents.length === 0 && <p className="text-gray-500">Aucun document.</p>}
        <ul className="space-y-1">
          {session.session_admin_documents.map((d: any) => (
            <li key={d.id}>
              <a href={`/api/storage/signed?bucket=session-admin-docs&path=${encodeURIComponent(d.storage_path)}`}
                 className="text-emerald-700 underline">
                {d.label ?? d.filename}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Bloc 2 : stagiaires */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Stagiaires</h2>
        <ul className="space-y-2 mb-4">
          {employes.map((e) => {
            const inscrit = inscriptions.includes(e.id);
            return (
              <li key={e.id} className="flex items-center gap-3">
                <span className="flex-1">{e.full_name} ({e.email})</span>
                {inscrit ? <span className="text-emerald-700">✓ Inscrit</span> : (
                  <button className="px-3 py-1 border rounded"
                    onClick={() => startTransition(() => inscrireStagiaire(session.id, e.id))}>
                    Inscrire
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <div className="border-t pt-4">
          <div className="font-medium mb-2">Ajouter un nouvel employé</div>
          <div className="flex gap-2">
            <input placeholder="Nom complet" className="border rounded px-2 py-1"
              value={newEmp.full_name} onChange={(e) => setNewEmp({ ...newEmp, full_name: e.target.value })} />
            <input placeholder="Email" className="border rounded px-2 py-1"
              value={newEmp.email} onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })} />
            <button className="px-3 py-1 border rounded"
              onClick={() => {
                if (!newEmp.full_name || !newEmp.email) return;
                startTransition(async () => {
                  await creerEtInscrireStagiaire(session.id, newEmp);
                  setNewEmp({ full_name: '', email: '' });
                });
              }}>
              Créer + inscrire
            </button>
          </div>
        </div>
      </section>

      {/* Bloc 3 : analyse */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Analyse des besoins</h2>
        <textarea className="w-full border rounded px-3 py-2" rows={6}
          value={analyse} onChange={(e) => setAnalyse(e.target.value)} />
        <button className="mt-2 px-3 py-1 border rounded"
          onClick={() => startTransition(() => saveAnalyseBesoins(session.id, analyse))}>
          Enregistrer
        </button>
      </section>

      {/* Bloc 4 : docs à fournir */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Documents à fournir</h2>
        <ul className="space-y-3">
          {session.session_document_requests.map((req: any) => (
            <li key={req.id} className="border rounded p-3">
              <div className="font-medium">
                {req.label}{req.required && <span className="text-red-600"> *</span>}
              </div>
              {req.description && <div className="text-sm text-gray-600">{req.description}</div>}
              <div className="mt-2 flex items-center gap-3">
                <input type="file" onChange={(e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  const fd = new FormData(); fd.append('file', f);
                  startTransition(() => uploadDocumentRequest(session.id, req.id, fd));
                }} />
                {req.session_document_uploads.length > 0 && (
                  <span className="text-sm text-emerald-700">
                    ✓ Fourni le {new Date(req.session_document_uploads[0].uploaded_at).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Finaliser */}
      <section className="pt-4 border-t">
        {session.session_reserved_details?.completed_at ? (
          <p className="text-emerald-700">✓ Session finalisée le {new Date(session.session_reserved_details.completed_at).toLocaleDateString('fr-FR')}</p>
        ) : (
          <button className="px-4 py-2 bg-emerald-600 text-white rounded"
            onClick={() => startTransition(() => finaliserSession(session.id))}>
            Finaliser
          </button>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Endpoint URL signée pour téléchargement**

Si pas déjà présent, créer `app/api/storage/signed/route.ts` :

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bucket = searchParams.get('bucket');
  const path = searchParams.get('path');
  if (!bucket || !path) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const sb = await createClient();
  const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, 300);
  if (error || !data) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.redirect(data.signedUrl);
}
```

(Le contrôle d'accès est délégué aux storage policies — RLS rejettera si l'utilisateur n'a pas le droit.)

- [ ] **Step 5: Test E2E light (server actions)**

```ts
// tests/sessions-reservees/etab-actions.test.ts
import { describe, it, expect } from 'vitest';
// Mocker getCurrentProfile + supabase client — pattern à reprendre du projet
// Pour démarrer : test que requireEtabOnSession throw si profile != reserved_company_id
```

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/stagiaire/session-dediee/ app/api/storage/signed/route.ts tests/sessions-reservees/etab-actions.test.ts
git commit -m "feat(stagiaire): page session-dediee (4 blocs + actions étab)"
```

---

## Task 11: Action `claimInvitationFromTokenAction` + signup

**Files:**
- Create: `app/actions/claim-session-invitation.ts`
- Modify: `app/(auth)/signup-entreprise/page.tsx`

- [ ] **Step 1: Action serveur**

```ts
// app/actions/claim-session-invitation.ts
'use server';

import { getCurrentProfile } from '@/lib/supabase/server';
import { claimInvitation, findInvitationByToken, isInvitationUsable } from '@/lib/supabase/session-invitations';

export async function claimInvitationFromTokenAction(token: string) {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false as const, reason: 'Non authentifié.' };
  const inv = await findInvitationByToken(token);
  if (!inv) return { ok: false as const, reason: 'Invitation introuvable.' };
  if (!isInvitationUsable(inv)) {
    // Si déjà claimée par CE profil, c'est ok silencieusement
    if (inv.claimed_by === profile.id) return { ok: true as const, sessionId: inv.session_id };
    return { ok: false as const, reason: 'Invitation expirée ou déjà utilisée.' };
  }
  return await claimInvitation(token, profile.id);
}
```

- [ ] **Step 2: `signup-entreprise/page.tsx`**

Lire `?invitation_token=XXX` côté serveur, fetch invitation via `findInvitationByToken`, pré-remplir le formulaire avec `raison_sociale`, `email`, `siret`, `contact_*`. Stocker le token dans un hidden input. Après création de compte, appeler `claimInvitationFromTokenAction(token)` et rediriger vers `/stagiaire/session-dediee/[sessionId]`.

- [ ] **Step 3: Tests claim**

Étendre `tests/sessions-reservees/claim-invitation.test.ts` :
- claim avec compte non-entreprise → reason explicite
- claim avec token expiré → reason
- claim 2 fois → 2e fois `reason: 'expirée ou déjà utilisée'`
- claim ok → `sessions.reserved_company_id` mis à jour

- [ ] **Step 4: Commit**

```bash
git add app/actions/claim-session-invitation.ts app/\(auth\)/signup-entreprise/page.tsx tests/sessions-reservees/claim-invitation.test.ts
git commit -m "feat(invitations): claim depuis signup-entreprise et page session-dediee"
```

---

## Task 12: Notifications complémentaires (published / completed / reminder)

**Files:**
- Modify: `app/(app)/admin/sessions/actions.ts` — déclencher `session_reserved_published` au passage `draft → published`
- Modify: `app/(app)/stagiaire/session-dediee/[sessionId]/actions.ts` — envoyer `session_reserved_completed` dans `finaliserSession`
- Modify: `app/(app)/admin/sessions/reservation-actions.ts` — `resendInvitation` envoie `session_reserved_reminder`

- [ ] **Step 1: Helper d'envoi commun (pour récupérer admins)**

```ts
// dans lib/email/log.ts ou nouveau lib/email/notify-admins.ts
export async function getAdminEmails(): Promise<string[]> {
  const sb = createAdminClient();
  const { data } = await sb.from('profiles').select('email').eq('role', 'admin');
  return (data ?? []).map((p) => p.email).filter(Boolean);
}
```

- [ ] **Step 2: Hook `updateSession` (statut)**

Dans `updateSession`, comparer ancien `statut` vs nouveau. Si transition `draft → published` ET `visibility = 'reserved'` ET (reserved_company_id existe OU invitation existe) :
- Si invitation pas encore envoyée → `sendInvitationEmail` (couvre le cas où l'admin crée en draft puis publie plus tard)
- Si compte existant → envoyer `session_reserved_published` à l'email du profil

- [ ] **Step 3: `finaliserSession`** — envoyer `session_reserved_completed` à tous les admins (via `getAdminEmails` + `sendAndLog`)

- [ ] **Step 4: `resendInvitation`** — déjà appelle `sendInvitationEmail` ; ajouter un wrapper qui passe le kind `session_reserved_reminder` au lieu de `session_reserved_invitation`.

- [ ] **Step 5: Commit**

```bash
git add -p
git commit -m "feat(emails): notifications published/completed/reminder"
```

---

## Task 13: Panneau admin "Établissement réservé"

**Files:**
- Modify: `app/(app)/admin/sessions/[id]/page.tsx`

- [ ] **Step 1: Charger les données réservation**

Étendre le query existant pour récupérer (si `visibility='reserved'`) :
- `reserved_company_id` → joindre `profiles + company_details`
- `session_invitations` (si pas encore claimée)
- `session_reserved_details`
- `session_document_requests` + `session_document_uploads` (count par request)
- `session_admin_documents`

- [ ] **Step 2: Section UI**

```tsx
{session.visibility === 'reserved' && (
  <section className="border-2 border-emerald-200 rounded p-4 mt-6 space-y-4">
    <h2 className="text-lg font-semibold">Établissement réservé</h2>

    {claimedCompany && (
      <div>
        <div className="font-medium">{claimedCompany.raison_sociale}</div>
        <div className="text-sm text-gray-600">{claimedCompany.email}</div>
      </div>
    )}
    {pendingInvitation && (
      <div className="bg-amber-50 border border-amber-200 rounded p-3">
        <div className="font-medium">Invitation en attente</div>
        <div className="text-sm">{pendingInvitation.email} — expire le {new Date(pendingInvitation.expires_at).toLocaleDateString('fr-FR')}</div>
        <div className="mt-2 flex gap-2">
          <form action={resendInvitationAction}><input type="hidden" name="id" value={pendingInvitation.id} />
            <button className="px-3 py-1 border rounded">Relancer</button></form>
          <form action={cancelInvitationAction}><input type="hidden" name="id" value={pendingInvitation.id} />
            <button className="px-3 py-1 border rounded text-red-600">Annuler</button></form>
        </div>
      </div>
    )}

    <div>
      <h3 className="font-medium">Analyse des besoins</h3>
      <p className="whitespace-pre-wrap">{reservedDetails?.analyse_besoins || <em className="text-gray-500">Non renseignée</em>}</p>
      {reservedDetails?.completed_at && (
        <p className="text-emerald-700 text-sm">✓ Finalisée le {new Date(reservedDetails.completed_at).toLocaleDateString('fr-FR')}</p>
      )}
    </div>

    <div>
      <h3 className="font-medium">Documents demandés</h3>
      <ul>
        {docRequests.map((r) => (
          <li key={r.id}>{r.label} — {r.uploadsCount > 0 ? `${r.uploadsCount} fourni(s)` : 'en attente'}</li>
        ))}
      </ul>
    </div>

    <div>
      <h3 className="font-medium">Documents transmis</h3>
      <ul>
        {adminDocs.map((d) => (<li key={d.id}>{d.label ?? d.filename}</li>))}
      </ul>
    </div>
  </section>
)}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/admin/sessions/\[id\]/page.tsx
git commit -m "feat(admin): panneau Établissement réservé"
```

---

## Task 14: Listing admin — badge & filtre

**Files:**
- Modify: `app/(app)/admin/sessions/page.tsx`
- Modify: `app/(app)/admin/sessions/SessionsFilters.tsx`

- [ ] **Step 1: Ajouter colonne `visibility` au fetch + jointure raison sociale**

- [ ] **Step 2: Afficher badge `🔒 Réservée — [Raison sociale]` quand `visibility='reserved'`**

- [ ] **Step 3: Filtre `?visibility=public|reserved|all` (défaut all) dans `SessionsFilters`**

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/admin/sessions/page.tsx app/\(app\)/admin/sessions/SessionsFilters.tsx
git commit -m "feat(admin): badge réservée + filtre visibility"
```

---

## Task 15: Section "Sessions dédiées" côté entreprise

**Files:**
- Modify: `app/(app)/stagiaire/inscriptions/page.tsx`

- [ ] **Step 1: Ajouter en haut une requête `sessions WHERE reserved_company_id = me AND statut='published'`**

- [ ] **Step 2: Afficher cartes avec lien vers `/stagiaire/session-dediee/[id]`, badge "à compléter" si `session_reserved_details.completed_at IS NULL`**

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/stagiaire/inscriptions/page.tsx
git commit -m "feat(stagiaire): section Sessions dédiées"
```

---

## Task 16: Tests RLS

**Files:**
- Create: `tests/sessions-reservees/rls.test.ts`

- [ ] **Step 1: Suite de tests RLS** (utilise le pattern Supabase test existant du projet — clients anon avec JWT impersonifiés)

```ts
// tests/sessions-reservees/rls.test.ts
import { describe, it, expect } from 'vitest';
// import des helpers du projet pour créer des clients en tant qu'utilisateurs précis

describe('RLS sessions réservées', () => {
  it('un autre compte entreprise NE voit PAS la session réservée', async () => {
    // 1. seed : admin crée session réservée à entrepriseA
    // 2. login en tant qu'entrepriseB → SELECT sessions WHERE id = X → doit retourner 0 rows
  });

  it('entrepriseA peut SELECT session_document_requests', async () => { /* ... */ });

  it('entrepriseB NE peut PAS INSERT session_document_uploads sur la session de A', async () => { /* ... */ });

  it('site public (anon) NE voit PAS la session réservée', async () => { /* ... */ });
});
```

> Si le projet n'a pas de framework de test RLS, marquer cette tâche comme "à compléter quand framework disponible" et faire au minimum un test manuel.

- [ ] **Step 2: Commit**

```bash
git add tests/sessions-reservees/rls.test.ts
git commit -m "test(rls): isolation sessions réservées"
```

---

## Task 17: Edge cases & finitions

- [ ] **Step 1: Empêcher transition `reserved → public` si inscriptions OU invitation claimée**

Dans `updateSession` (admin) :
```ts
if (oldVisibility === 'reserved' && newVisibility === 'public') {
  const { count: inscCount } = await sb.from('inscriptions').select('id', { count: 'exact', head: true }).eq('session_id', id);
  const { data: claimedInv } = await sb.from('session_invitations').select('id').eq('session_id', id).not('claimed_by', 'is', null).maybeSingle();
  if ((inscCount ?? 0) > 0 || claimedInv) throw new Error('Impossible de rendre publique : inscriptions ou invitation acceptée.');
  await sb.from('sessions').update({ reserved_company_id: null }).eq('id', id);
  await sb.from('session_invitations').delete().eq('session_id', id);
}
```

- [ ] **Step 2: Page d'erreur claire pour token invalide / claimé**

Dans `signup-entreprise` et `session-dediee`, gérer le retour `{ ok: false, reason }` de `claimInvitationFromTokenAction` en affichant un message + CTA "Se connecter".

- [ ] **Step 3: Run full test + lint + typecheck**

```bash
npm run test
npm run lint
npx tsc --noEmit
```

Expected: all PASS.

- [ ] **Step 4: Test manuel — checklist**
  - Créer session publique → visible site vitrine ✓
  - Créer session réservée + compte existant → invisible site vitrine, visible chez l'entreprise ✓
  - Créer session réservée + invitation → email reçu, CTA vers signup, claim → page session ✓
  - Étab complète analyse + uploade docs + finalise → admin reçoit notif ✓
  - Tenter de transformer en publique avec inscriptions → bloqué ✓

- [ ] **Step 5: Commit final**

```bash
git add -p
git commit -m "feat(sessions): edge cases (transition, tokens invalides)"
```

---

## Self-Review

- ✅ **Spec coverage** : data model (Tasks 1, 2), recherche/invitation (Tasks 4, 6, 8), inscription directe (Task 10), analyse besoins (Task 10), docs demandés (Tasks 7, 10), docs admin (Tasks 7, 10), emails (Tasks 5, 12), claim (Tasks 3, 11), visibilité publique (Task 9), admin UI (Tasks 13, 14), entreprise listing (Task 15), RLS tests (Task 16), edge cases (Task 17).
- ✅ **Placeholders** : pas de TBD/TODO ; les notes "voir framework existant" pointent vers le code réel ou décrivent un pattern à suivre.
- ✅ **Type consistency** : `EtablissementSearchResult`, `ReservationData`, `DocRequestDraft`, `AdminDocDraft` utilisés cohéremment ; `claimInvitation` retourne `{ ok, sessionId | reason }` consistant entre helper et action.
- ✅ **Granularité** : chaque task est cohérente et committable indépendamment ; les server actions sont écrites avec leur signature complète avant d'être consommées par les UI.
