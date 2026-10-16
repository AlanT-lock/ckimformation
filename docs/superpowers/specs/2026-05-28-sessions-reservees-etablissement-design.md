# Sessions réservées à un établissement — Design

**Date :** 2026-05-28
**Statut :** Validé (en attente de plan d'implémentation)

## 1. Contexte & objectif

Aujourd'hui, toutes les sessions de formation créées par l'admin sont publiques (visibles sur le site vitrine et accessibles à l'inscription par tout particulier ou entreprise).

On veut permettre à l'admin de créer une **session réservée à un seul établissement** : invisible publiquement, pré-attribuée à un compte entreprise existant **ou** à un établissement non encore inscrit (via invitation par email). L'établissement complète ensuite la session depuis son espace : ajout des stagiaires, analyse des besoins, upload des documents demandés, téléchargement des documents fournis par l'admin.

## 2. Décisions de conception

| Décision | Choix |
|---|---|
| Réservation | **Exclusive à 1 seul établissement** par session |
| Sélection établissement | **Recherche unifiée** (raison sociale / SIRET / email) avec fallback "Inviter par email" |
| Inscription des stagiaires sur session dédiée | **Directe** (pas de circuit de validation admin via `inscriptions_demandes`) |
| Documents demandés à l'établissement | **Liste libre** définie par l'admin (label + description + required) |
| Documents fournis par l'admin | **Upload multi-fichiers** dans la session, téléchargeables par l'établissement |
| Visibilité côté entreprise | La session apparaît uniquement quand `statut = 'published'` |
| Email d'invitation | **Ne joint pas** les fichiers — CTA vers l'espace |

## 3. Modèle de données

### 3.1 Modifications de `sessions`

```sql
create type session_visibility as enum ('public', 'reserved');

alter table public.sessions
  add column visibility session_visibility not null default 'public',
  add column reserved_company_id uuid references public.profiles(id) on delete set null;

create index idx_sessions_reserved_company on public.sessions(reserved_company_id)
  where reserved_company_id is not null;
```

### 3.2 Table `session_invitations`

Utilisée uniquement quand l'établissement n'a pas encore de compte. Une fois claimée, `sessions.reserved_company_id` est renseigné et l'invitation devient un historique.

```sql
create table public.session_invitations (
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
```

### 3.3 Table `session_reserved_details`

Données spécifiques au flux dédié, séparées de `sessions` pour ne pas polluer.

```sql
create table public.session_reserved_details (
  session_id      uuid primary key references public.sessions(id) on delete cascade,
  analyse_besoins text,
  completed_at    timestamptz,
  updated_at      timestamptz not null default now()
);
```

### 3.4 Documents demandés à l'établissement

```sql
create table public.session_document_requests (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  ordre       int not null default 0,
  label       text not null,
  description text,
  required    boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.session_document_uploads (
  id           uuid primary key default uuid_generate_v4(),
  request_id   uuid not null references public.session_document_requests(id) on delete cascade,
  session_id   uuid not null references public.sessions(id) on delete cascade,
  storage_path text not null,
  filename     text not null,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  uploaded_at  timestamptz not null default now()
);
```

### 3.5 Documents fournis par l'admin

```sql
create table public.session_admin_documents (
  id           uuid primary key default uuid_generate_v4(),
  session_id   uuid not null references public.sessions(id) on delete cascade,
  storage_path text not null,
  filename     text not null,
  label        text,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  uploaded_at  timestamptz not null default now()
);
create index idx_sad_session on public.session_admin_documents(session_id);
```

### 3.6 Storage buckets

- `session-admin-docs` (privé) — fichiers fournis par l'admin. Path : `{session_id}/{uuid}-{filename}`
- `session-etab-uploads` (privé) — fichiers uploadés par l'établissement. Path : `{session_id}/{request_id}/{uuid}-{filename}`

### 3.7 RLS — règles principales

- **`sessions` SELECT public** : ajouter `AND visibility = 'public'` aux policies existantes pour le site vitrine et les routes publiques.
- **`sessions`** lecture entreprise réservée : `reserved_company_id = auth.uid()`.
- **`session_invitations`** : INSERT/UPDATE/DELETE/SELECT admin uniquement. Lecture par token uniquement via server action (pas de RLS publique).
- **`session_reserved_details`** : INSERT/UPDATE/SELECT admin + entreprise dont `sessions.reserved_company_id = auth.uid()`.
- **`session_document_requests`** : RW admin, SELECT admin + entreprise réservée.
- **`session_document_uploads`** : INSERT entreprise réservée (sur ses propres requests), SELECT admin + entreprise réservée, DELETE admin.
- **`session_admin_documents`** : RW admin, SELECT admin + entreprise réservée.
- **Storage policies** : symétriques aux tables (entreprise lit `session-admin-docs/{session_id}/*` si elle est `reserved_company_id`).

## 4. Flux admin — création / édition

### 4.1 Sélecteur de mode

Sur `app/(app)/admin/sessions/nouvelle/page.tsx`, en haut du formulaire : segmented control `Publique | Réservée à un établissement`. Le choix conditionne l'affichage du bloc `ReservationBlock`.

### 4.2 Bloc `ReservationBlock` (mode "Réservée")

1. **Recherche unifiée d'établissement**
   - Champ unique avec autocomplete server-side (debounce 250 ms).
   - Requête sur `profiles` (role=stagiaire, account_type=entreprise) join `company_details` : match ILIKE sur `raison_sociale`, `siret`, `email`, `full_name` (contact).
   - Résultat : raison sociale, SIRET, email contact. Click → `reserved_company_id` set.

2. **Fallback "Inviter un nouvel établissement"** (formulaire replié)
   - Champs : email (requis), raison sociale (requis), SIRET, contact nom, fonction, téléphone.
   - À la soumission de la session → crée `session_invitations` + envoie email.

3. **`DocumentRequestsEditor`** — Documents à fournir par l'établissement
   - Liste éditable : `+ Ajouter`, `label` (requis), `description`, checkbox `required`.

4. **`AdminDocumentsUploader`** — Documents à transmettre à l'établissement
   - Dropzone multi-fichiers avec label optionnel par fichier.
   - Upload immédiat sur `session-admin-docs` (au moins après création de la session pour avoir `session_id`).

Tous les champs existants (`formation_id`, `formateur_id`, créneaux, adresse, notes_internes) restent présents et requis comme en mode public.

### 4.3 Validation server action `createSession`

- Si `visibility = 'reserved'` : exiger **soit** `reserved_company_id` **soit** `invitation_payload` (mutuellement exclusifs, l'un des deux requis).
- Si invitation : créer la ligne `session_invitations` dans la même transaction.
- Toujours créer `session_reserved_details(session_id)` (analyse_besoins vide).

### 4.4 Liste admin

`app/(app)/admin/sessions/page.tsx` : badge `🔒 Réservée — [Raison sociale]` et filtre `visibility`.

### 4.5 Page détail admin

`admin/sessions/[id]` : nouveau panneau "Établissement réservé" :
- Identité établissement (compte ou invitation pending)
- Analyse des besoins remplie
- Statut des `session_document_requests` (uploads reçus / manquants)
- Liste des stagiaires inscrits
- Boutons : "Relancer par email", "Annuler l'invitation"

## 5. Flux établissement (compte existant)

### 5.1 Espace stagiaire entreprise

Sur `stagiaire/inscriptions/page.tsx` (ou un nouvel onglet) : section en haut **"Sessions dédiées à mon établissement"** listant les sessions où `reserved_company_id = me` et `statut = 'published'`. Badge "🆕 Nouvelle" tant que non visitée.

### 5.2 Page session dédiée

Route : `app/(app)/stagiaire/session-dediee/[sessionId]/page.tsx`

Quatre blocs :

1. **Documents fournis par CKIM** — liste `session_admin_documents` avec liens signés Supabase Storage.
2. **Stagiaires** — réutilise UX de `InscriptionEntrepriseForm` (cocher employés existants + ajouter de nouveaux employés). Bouton "Inscrire" → crée directement les `inscriptions` (statut équivalent à confirmé, sans `inscriptions_demandes`).
3. **Analyse des besoins** — textarea → persiste sur `session_reserved_details.analyse_besoins`.
4. **Documents à fournir** — pour chaque `session_document_requests`, dropzone uploadant dans `session-etab-uploads`. Statut visuel : "À fournir / Fourni le JJ/MM".

Bouton **"Finaliser"** : set `session_reserved_details.completed_at`, notifie l'admin (`session_reserved_completed`).

## 6. Flux invitation (établissement non inscrit)

### 6.1 Création de l'invitation

À la création de la session en mode invitation :
- Insert `session_invitations` avec `token = crypto.randomUUID() + suffix random` (≥ 32 chars utiles), `expires_at = now() + 30 days`.
- Email envoyé via le système `email_logs` existant.

### 6.2 Email

- Sujet : "CKIM Formation — Une session est réservée pour [Raison sociale]"
- Corps : récap formation, créneaux, lieu, analyse des besoins attendue, liste textuelle des documents à fournir, mention "N documents sont disponibles dans votre espace" si `session_admin_documents` existent.
- **CTA conditionnel selon l'email** :
  - **Inconnu** dans `auth.users` → `/(auth)/signup-entreprise?invitation_token=XXX` (pré-rempli).
  - **Déjà inscrit comme entreprise** → `/stagiaire/session-dediee/[sessionId]?invitation_token=XXX` (login wall si nécessaire).

### 6.3 Page signup avec token

`app/(auth)/signup-entreprise/page.tsx` détecte `?invitation_token=XXX` :
- Fetch invitation server-side, vérifie validité, pré-remplit champs.
- À la fin du signup, server action `claimInvitation(token, new_profile_id)` :
  - Vérifie token valide + non claimé + non expiré.
  - Set `session_invitations.claimed_by` + `claimed_at`.
  - Set `sessions.reserved_company_id = new_profile_id`.
  - Redirige vers `/stagiaire/session-dediee/[sessionId]`.

### 6.4 Relance

Bouton admin sur `admin/sessions/[id]` → renvoie le même mail (et bump `invited_at`).

## 7. Visibilité publique — audit RLS

Ajouter `AND visibility = 'public'` partout où on liste les sessions publiquement :
- `app/(public)/**` (site vitrine si listing)
- `app/(app)/stagiaire/formations/[slug]` (liste sessions inscriptibles)
- Routes API publiques `app/api/**` exposant des sessions
- Tout endpoint de recherche / map

## 8. Edge cases

| Cas | Comportement |
|---|---|
| Admin change `reserved → public` avec inscriptions ou invitation claimée | **Interdit**. Sinon nettoie `reserved_company_id` et supprime l'invitation non claimée. |
| Établissement ignore l'invitation | Expire à 30 j. Admin peut relancer ou annuler. |
| Token déjà utilisé | Page d'erreur claire + lien "Se connecter". |
| Email d'invitation = compte non-entreprise (particulier) | `claimInvitation` bloque avec message explicite. |
| Session `draft` | Pas visible côté entreprise réservée, pas d'email envoyé tant que `published`. |
| Email d'invitation déjà claimé sur une autre session | Indépendant — chaque invitation est rattachée à 1 session. |

## 9. Sécurité

- Tokens : `crypto.randomUUID()` + suffix random, single-use.
- Server actions vérifient role admin ou ownership entreprise via Supabase auth (`getUser`).
- Pas de leak : `session_invitations.email` jamais exposé côté client public.
- Storage : URLs signées (TTL court) pour les téléchargements.

## 10. Notifications email

Nouveaux types dans `email_logs.kind` :
- `session_reserved_invitation` — envoi initial
- `session_reserved_published` — déclenché si la session passe `draft → published` alors qu'elle est déjà claimée
- `session_reserved_completed` — l'établissement clique "Finaliser"
- `session_reserved_reminder` — relance manuelle admin

## 11. Tests

- **Unit** : `claimInvitation`, validation `createSession` mode réservée, génération de tokens.
- **Integration (server actions)** : recherche établissement, création session réservée (compte existant + invitation), claim flow, upload docs.
- **RLS** : un autre compte entreprise ne voit ni la session ni les détails ; un particulier ne voit rien.
- **E2E** (si infra dispo) : flux complet invitation → signup → complétion.

## 12. Fichiers impactés (vue d'ensemble)

**Nouveaux**
- `supabase/migrations/2026MMDD_sessions_reservees.sql`
- `app/(app)/admin/sessions/ReservationBlock.tsx`
- `app/(app)/admin/sessions/EtablissementSearch.tsx`
- `app/(app)/admin/sessions/DocumentRequestsEditor.tsx`
- `app/(app)/admin/sessions/AdminDocumentsUploader.tsx`
- `app/(app)/stagiaire/session-dediee/[sessionId]/page.tsx` (+ composants)
- `app/actions/session-invitations.ts` (claimInvitation, resendInvitation)
- `lib/email/templates/session-reserved-*.ts`

**Modifiés**
- `app/(app)/admin/sessions/SessionForm.tsx` — ajout sélecteur de mode + `ReservationBlock`
- `app/(app)/admin/sessions/actions.ts` — `createSession` + nouvelles actions (search, invite, upload, RW docs)
- `app/(app)/admin/sessions/page.tsx` — badge + filtre visibility
- `app/(app)/admin/sessions/[id]/page.tsx` — panneau "Établissement réservé"
- `app/(app)/stagiaire/inscriptions/page.tsx` — section "Sessions dédiées"
- `app/(auth)/signup-entreprise/page.tsx` — gestion `invitation_token`
- Toutes les requêtes publiques de listing de sessions — ajout `visibility = 'public'`
- `lib/supabase/types.ts` — types générés
