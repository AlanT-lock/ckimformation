# Design — Rubrique « Entreprises » dans l'espace admin

**Date :** 2026-09-28
**Statut :** validé (design), à planifier

Cinq fonctionnalités liées, toutes côté admin :

1. Rubrique **Entreprises** : liste + fiche entreprise (infos, salariés, sessions).
2. **Création d'une entreprise par l'admin** + mail d'invitation (définition du mot de passe).
3. **Ajout de salariés par l'admin** depuis la fiche entreprise + mail d'invitation.
4. **Inscription d'un ou plusieurs salariés à une session** depuis la fiche entreprise.
5. **Conversion d'un compte particulier en compte entreprise** depuis la fiche stagiaire.

Plus un correctif : **perte de `secteur_activite` à l'inscription entreprise** (bug existant).

---

## Contexte — modèle existant (inchangé)

- Une entreprise = un `profiles` avec `role = 'stagiaire'`, `account_type = 'entreprise'` + une ligne `company_details` (1:1, `profile_id`) : `raison_sociale`, `siret`, `tva_intra`, `contact_fonction`, `billing_address` (jsonb `{rue, code_postal, ville, pays}`). Le contact référent est porté par le profil (`full_name`, `email`, `phone`, `secteur_activite`).
- Salariés = table `employees` (`employer_profile_id`, `profile_id` nullable, `prenom`, `nom`, `email`). Rattachement d'un compte existant via `employee_invitations` (`lib/employees/invitations.ts`, `lib/employees/upsert.ts`).
- Inscriptions = `inscriptions` (`payer_profile_id`, `statut`) + `inscription_participants` (polymorphe `employee_id` XOR `participant_profile_id`).
- Sessions réservées : `sessions.visibility = 'reserved'` + `sessions.reserved_company_id`.
- Invitation d'un compte : `admin.auth.admin.generateLink({ type: 'invite' })` (crée l'auth user sans mail Supabase) + mail branded via Resend → `/callback` → `/setup-password`. Renvoi : `generateLink({ type: 'recovery' })`.

**Aucune nouvelle table.** Pas de table `companies` séparée.

---

## Correctif — `secteur_activite` perdu à l'inscription

**Cause :** `20260510_recommendations_system.sql` ajoute `secteur_activite` au trigger `handle_new_user`, mais `20260512_en_formation.sql` redéfinit ensuite ce trigger (ajout du lien `employee_id`) **sans** `secteur_activite`. Depuis, le secteur saisi au signup entreprise n'est plus enregistré.

**Fix :** nouvelle migration `supabase/migrations/20260928_entreprises_admin.sql` qui redéfinit `handle_new_user` en fusionnant les deux versions : insertion de `secteur_activite` dans `profiles` **et** liaison `employees.profile_id` via `employee_id`. Le reste du trigger est inchangé.

Les comptes entreprise créés par l'admin (flux 2) passent aussi par ce trigger, donc profitent du fix.

---

## Composant partagé — `CompanyFormFields`

Extraction depuis `app/(auth)/signup-entreprise/SignupEntrepriseForm.tsx` des champs **Société / Adresse / Contact** :

- `components/forms/CompanyFormFields.tsx` : composant contrôlé (`value`, `onChange`, `secteurs`, `emailReadOnly?`). Champs : raison sociale, SIRET, TVA intra, secteur, rue, code postal, ville, nom/prénom du contact, fonction, email, téléphone.
- `lib/validation/company.ts` : type `CompanyInput`, `validateCompanyInput(input, { requireEmail })` (règles actuelles du signup : raison sociale, adresse complète, contact, fonction, email valide, téléphone obligatoires), `toBillingAddress(input)`, `toCompanyMetadata(input)` (métadonnées pour `generateLink` / `signUp`).

Utilisé par :
- le signup public (étapes 1 à 3 du wizard ; l'étape 4 mot de passe reste propre au signup) — comportement inchangé ;
- la création admin (flux 2) ;
- la conversion (flux 5, email en lecture seule).

---

## 1. Rubrique Entreprises

**Menu :** `components/app/AppShell.tsx`, `NAV_ADMIN` : ajout de `{ href: '/admin/entreprises', label: 'Entreprises' }` entre « Stagiaires » et « Formateurs ».

### `/admin/entreprises` (liste)

- Chargement serveur via `createAdminClient()`, garde `requireAdmin()`.
- Colonnes : raison sociale, SIRET, contact (nom), email, nb de salariés, statut du compte.
- **Statut :** « Actif » si l'auth user a un `last_sign_in_at`, sinon « Invitation en attente ». Récupéré via `admin.auth.admin.listUsers` (parcours paginé, `perPage: 1000`), indexé par id, puis croisé avec les entreprises affichées. Helper partagé `lib/companies/auth-status.ts` (réutilisé par la fiche entreprise et le bloc Salariés).
- Recherche texte (raison sociale, SIRET, contact, email) insensible aux accents et à l'ordre des mots — réutiliser la normalisation de `lib/sessions/stagiaire-search.ts`.
- Bouton **« Ajouter une entreprise »** → `/admin/entreprises/nouvelle`.
- Clic sur une ligne → `/admin/entreprises/[id]`.

### `/admin/entreprises/[id]` (fiche)

404 si le profil n'existe pas ou n'est pas `account_type = 'entreprise'`.

**Bloc Infos :** société (raison sociale, SIRET, TVA, secteur), adresse de facturation, contact (nom, fonction, email, téléphone), date de création, statut du compte. Bouton **« Renvoyer l'invitation »** tant que le compte n'est pas activé.

**Bloc Salariés :** liste des `employees` de l'entreprise — nom, email, statut :
- « Compte actif » : `profile_id` renseigné et auth user connecté au moins une fois ;
- « Invité » : `profile_id` renseigné, jamais connecté ;
- « Rattachement en attente » : invitation `employee_invitations` non réclamée ;
- « Sans accès » : ni profil ni invitation (cas legacy).

Clic sur un salarié avec profil → `/admin/stagiaires/[profile_id]`. Actions : **« Ajouter un salarié »** (flux 3), **« Renvoyer l'invitation »** par ligne.

**Bloc Sessions :** union dédupliquée de
- sessions où `reserved_company_id = entreprise` ;
- sessions d'une inscription dont `payer_profile_id = entreprise` ;
- sessions où un participant est un `employee_id` de l'entreprise.

Colonnes : formation, dates (via `lib/date.ts`), statut, visibilité (publique / réservée), participants de l'entreprise (noms). Tri : date de début décroissante. Clic → `/admin/sessions/[id]`. Bouton **« Inscrire des salariés »** (flux 4).

---

## 2. Création d'une entreprise par l'admin

**Page :** `/admin/entreprises/nouvelle` avec `CompanyFormFields` (sans mot de passe, sans case RGPD — la validation de la politique reste à la charge du signup public ; l'entreprise l'acceptera implicitement en activant son compte).

**Action serveur** `createCompanyByAdmin(input)` (`app/(app)/admin/entreprises/actions.ts`) :

1. `requireAdmin()`, `validateCompanyInput`.
2. Si un profil existe déjà avec cet email (`findProfileByEmail`) → erreur. S'il s'agit d'un stagiaire particulier convertible, l'erreur contient l'id pour afficher un lien « Convertir ce compte en entreprise » vers sa fiche.
3. `generateLink({ type: 'invite', email, options: { data: { role: 'stagiaire', account_type: 'entreprise', full_name, phone, secteur_activite, raison_sociale, siret, tva_intra, contact_fonction, billing_address }, redirectTo: `${siteUrl}/callback?redirect=/stagiaire` } })`. Le trigger crée `profiles` + `company_details`.
4. Envoi du mail Resend — nouveau template `lib/email/templates/company-invitation.ts` (« C-KIM Formation a créé l'espace de [raison sociale] — définissez votre mot de passe »), variante `isResend`. Log dans `email_logs` (`kind = 'company_invitation'`).
5. Si le mail échoue : le compte existe, l'action renvoie ok avec avertissement ; le renvoi reste possible depuis la fiche.
6. Redirection vers `/admin/entreprises/[id]`.

**Renvoi** `resendCompanyInvitation(companyId)` : `generateLink({ type: 'recovery' })` + même template en `isResend`.

---

## 3. Ajout de salariés par l'admin

**UI :** formulaire (prénom, nom, email) dans le bloc Salariés — calqué sur `app/(app)/stagiaire/employes/AddEmployeeForm.tsx`.

**Action** `addEmployeeByAdmin(companyId, input)` :

1. `requireAdmin()`, vérifie que `companyId` est une entreprise.
2. `upsertEmployeeForEmployer(admin, companyId, input, adminId)` — gère déjà le cas « email = compte existant rattachable » (invitation de rattachement).
3. Si la fiche n'a pas de `profile_id` et qu'aucune invitation de rattachement n'a été envoyée (aucun compte existant) → envoi immédiat de l'invitation de création de compte.

**Refactor :** la logique de `sendInvitationToEmployee` (`app/(app)/formateur/sessions/[id]/stagiaires/actions.ts`) est extraite dans `lib/employees/account-invitation.ts` :

```ts
sendEmployeeAccountInvitation(employeeId, actorId, { formationTitre?: string })
  → { ok: true; resent: boolean; mode: 'create' | 'recovery' | 'link' } | { ok: false; error }
```

Le flux formateur l'appelle avec le titre de formation (comportement inchangé). Le flux admin l'appelle sans formation : le template `invitation.ts` gagne une variante sans formation (« [Entreprise] vous a créé un accès à l'espace C-KIM Formation »). Métadonnées `generateLink` identiques à l'existant (`account_type: 'particulier'`, `employer_profile_id`, `employee_id`).

**Renvoi** par ligne : `resendEmployeeInvitationByAdmin(employeeId)` → même helper.

---

## 4. Inscription de salariés à une session

**UI :** modal « Inscrire des salariés » sur la fiche entreprise :
- sélecteur de session : sessions `statut = 'published'`, date de début ≥ aujourd'hui, et (`visibility = 'public'` **ou** `reserved_company_id = entreprise`) ; libellé « Formation — dates (réservée) » ;
- liste de cases à cocher des salariés ; ceux déjà occupants de la session sont désactivés avec la mention « déjà inscrit ».

**Action** `enrollEmployeesByAdmin(companyId, sessionId, employeeIds[])` :

1. `requireAdmin()` ; vérifie entreprise, session éligible (mêmes règles que le sélecteur), et que chaque `employeeId` appartient à l'entreprise.
2. Filtre les salariés déjà occupants via `loadSessionOccupants` (par `employee_id` et par `profile_id` lié). Si plus personne → erreur « Tous les salariés sélectionnés sont déjà inscrits ».
3. Insère une `inscriptions` : `session_id`, `payer_profile_id = companyId`, `participant_profile_id = null`, `statut = 'confirmee'`, `confirmed_at = now()`.
4. Insère une ligne `inscription_participants` (`employee_id`) par salarié. En cas d'échec → suppression de l'inscription (rollback manuel, comme `addProfileToSession`).
5. `revalidatePath` fiche entreprise + fiche session + pages formateur/stagiaire (cf. `revalidateSession`).

Pas de mail automatique : les convocations restent envoyées depuis la fiche session (`ConvocationsPanel`).

**Logique pure testable** dans `lib/companies/enrollment.ts` : `isSessionEligibleForCompany(session, companyId, now)`, `partitionEmployeesByOccupancy(employees, occupants)`.

---

## 5. Conversion particulier → entreprise

**Éligibilité** (`lib/companies/conversion.ts`, fonction pure `canConvertToCompany(profile, linkedEmployeeCount)`) :
- `role = 'stagiaire'`, `account_type = 'particulier'` (ou null) ;
- `employer_profile_id` null ;
- aucune fiche `employees` avec `profile_id` = ce profil.

**UI :** sur `/admin/stagiaires/[id]`, bouton **« Transformer en compte entreprise »** affiché uniquement si éligible. Ouvre `CompanyFormFields` pré-rempli (`full_name`, `phone`, `secteur_activite`, email en lecture seule = email du compte).

**Action** `convertToCompany(profileId, input)` :

1. `requireAdmin()`, re-vérifie l'éligibilité côté serveur, `validateCompanyInput(input, { requireEmail: false })`.
2. Insère `company_details` (si une ligne existe déjà pour ce profil — cas incohérent — la mettre à jour).
3. Met à jour `profiles` : `account_type = 'entreprise'`, `full_name`, `phone`, `secteur_activite`, `updated_at`. Si cette étape échoue après l'insert → suppression du `company_details` inséré.
4. Pas de mail. Le mot de passe et l'historique (inscriptions, tests, émargements comme participant) sont conservés. Au prochain chargement, le menu stagiaire devient celui d'une entreprise (logique existante de `navFor`).
5. Redirection vers `/admin/entreprises/[id]`.

---

## Sécurité

- Toutes les pages et actions : `requireAdmin()` + `createAdminClient()` (service role), comme le reste de l'espace admin. Aucune nouvelle policy RLS nécessaire.
- Les ids reçus des clients (companyId, employeeIds, sessionId) sont systématiquement revérifiés côté serveur (appartenance, type de compte, éligibilité).

## Fichiers

**Nouveaux**
- `supabase/migrations/20260928_entreprises_admin.sql` (trigger `handle_new_user` corrigé)
- `components/forms/CompanyFormFields.tsx`
- `lib/validation/company.ts`
- `lib/companies/enrollment.ts`, `lib/companies/conversion.ts`
- `lib/employees/account-invitation.ts`
- `lib/email/templates/company-invitation.ts`
- `app/(app)/admin/entreprises/page.tsx`, `nouvelle/page.tsx`, `[id]/page.tsx`, `actions.ts` + composants client (formulaire, ajout salarié, modal inscription, boutons de renvoi)
- `app/(app)/admin/stagiaires/[id]/ConvertToCompany.tsx` + action

**Modifiés**
- `components/app/AppShell.tsx` (menu)
- `app/(auth)/signup-entreprise/SignupEntrepriseForm.tsx` (utilise `CompanyFormFields` + `lib/validation/company.ts`)
- `app/(app)/formateur/sessions/[id]/stagiaires/actions.ts` (utilise `sendEmployeeAccountInvitation`)
- `lib/email/templates/invitation.ts` (variante sans formation)
- `app/(app)/admin/stagiaires/[id]/page.tsx` (bouton de conversion)

## Tests (vitest)

- `lib/validation/company.ts` : champs obligatoires, email, construction `billing_address` / métadonnées.
- `lib/companies/conversion.ts` : éligibilité (particulier ok ; entreprise, salarié rattaché, formateur, admin refusés).
- `lib/companies/enrollment.ts` : éligibilité des sessions (publique, réservée à l'entreprise, réservée à une autre, passée, non publiée) ; partition des salariés déjà inscrits.
- Template `company-invitation` : échappement HTML, variante renvoi.
- Vérification manuelle en local : création entreprise → mail → setup password → connexion ; ajout salarié → mail ; inscription multi-salariés ; conversion ; signup public avec secteur enregistré.

## Hors périmètre

- Modification / suppression d'une entreprise depuis l'admin.
- Mail automatique à l'entreprise lors d'une inscription faite par l'admin.
- Fusion de comptes (entreprise existante + particulier).
