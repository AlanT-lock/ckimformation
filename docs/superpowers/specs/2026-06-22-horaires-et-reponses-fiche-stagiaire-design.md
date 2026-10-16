# Design — Fix fuseau horaire global + Réponses aux tests sur la fiche stagiaire

**Date :** 2026-06-22
**Statut :** validé (design), à planifier

Deux chantiers indépendants, regroupés ici car demandés ensemble. Ils peuvent être implémentés et livrés séparément (deux phases).

---

## Partie 1 — Fix fuseau horaire (propre & global)

### Problème

Les horaires de signature (émargements) affichés dans les PDF apparaissent décalés de 1 h (hiver) ou 2 h (été) : ils montrent l'heure **UTC** au lieu de l'heure **Europe/Paris**.

### Cause racine (confirmée)

Le **stockage est correct** : les timestamps sont en `timestamptz` PostgreSQL (ex. `emargements.signed_at timestamptz not null default now()` — `supabase/init.sql:190`). L'instant UTC est donc bien enregistré.

Le bug est **uniquement à l'affichage** : aucun formatage de date du code ne précise `timeZone`. `Intl.DateTimeFormat('fr-FR', …)` et `toLocaleString('fr-FR')` utilisent alors le fuseau du **runtime** — **UTC sur Vercel** (et côté serveur lors du SSR). D'où le décalage.

C'est **systémique** : ~25 emplacements redéfinissent chacun leur formateur de date à la main, sans helper partagé.

### Solution

**Un seul module de formatage de dates : `lib/date.ts`.** Locale `fr-FR`, `timeZone: 'Europe/Paris'` **figé**. Tout l'affichage de date passe par lui.

Bénéfice secondaire : figer le fuseau supprime aussi les risques de **mismatch d'hydratation** Next.js (serveur UTC vs navigateur local) sur les composants client qui formatent des dates.

#### API de `lib/date.ts`

Module neutre (PAS `server-only` : utilisé aussi par des composants `'use client'`). Chaque fonction accepte `Date | string | number | null | undefined` et renvoie `''` si l'entrée est vide.

| Fonction | Sortie exemple | Usage |
|---|---|---|
| `formatDateTime(value)` | `22/06/2026 15:30` | signatures, complétions de test, logs mails, footers PDF |
| `formatDate(value)` | `22/06/2026` | dates de session, d'inscription |
| `formatTime(value)` | `15:30` | heure seule |
| `formatDateLong(value)` | `lundi 22 juin 2026` | en-têtes PDF / pages (variante longue existante) |

Implémentation : instances `Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', … })` réutilisées au niveau module. `formatDateTime` = `day/month/year 2-digit + hour/minute 2-digit`. `formatDateLong` = `weekday long, day numeric, month long, year numeric`.

#### Cas des colonnes `date` (jour seul)

Pour une colonne `date` (Supabase renvoie `'YYYY-MM-DD'`), `formatDate` reste correct : `Europe/Paris` étant **en avance** sur UTC, minuit UTC tombe le **même jour calendaire** à Paris → aucun décalage de jour. (Le piège n'existerait que pour des fuseaux négatifs type Amérique.)

#### Remplacement systématique (~25 emplacements)

Remplacer chaque `new Intl.DateTimeFormat(...)` / `toLocaleString('fr-FR')` / `toLocaleDateString('fr-FR')` / `toLocaleTimeString('fr-FR')` ad-hoc par l'appel au helper approprié, puis supprimer les définitions locales devenues inutiles.

**PDF (prioritaire) :**
- `lib/pdf/EmargementPdf.tsx` — `FR_DATE` (long, l.4-6) + `FR_DATETIME` (court, l.7-9) ; usage signatures `signedAt` (~l.144) + footer (~l.161). **C'est le bug que l'utilisateur a vu.**
- `lib/pdf/TestsResponsesPdf.tsx` — `FR_DATETIME` (l.4-8), complétions (~l.146), footer (~l.186).

**Pages admin :** `admin/demandes/[id]/page.tsx`, `admin/demandes/[id]/DemandeActions.tsx`, `admin/demandes/page.tsx`, `admin/sessions/[id]/participants/[participantId]/page.tsx`, `admin/sessions/[id]/page.tsx`, `admin/sessions/page.tsx`, `admin/qualite/page.tsx`, `admin/qualite/[completionId]/page.tsx`, `admin/tests/[id]/resultats/page.tsx`, `admin/stagiaires/page.tsx`, `admin/stagiaires/[id]/page.tsx`, `admin/formateurs/page.tsx`, `admin/analytics/enquetes/page.tsx`, `admin/analytics/user/[id]/page.tsx`.

**Pages formateur :** `formateur/page.tsx`, `formateur/sessions/page.tsx`, `formateur/sessions/[id]/TestsPanel.tsx`, `formateur/sessions/[id]/tests/[testId]/reponses/page.tsx`, `formateur/sessions/[id]/evaluations/[testId]/[participantId]/page.tsx`.

**Pages stagiaire :** `stagiaire/inscriptions/[id]/page.tsx`, `stagiaire/inscriptions/page.tsx`, `stagiaire/parcours/ParcoursClient.tsx`, `stagiaire/session-dediee/[sessionId]/SessionDedieeClient.tsx`.

**Emails cron :** `app/api/cron/enquete-froid/route.ts`, `app/api/cron/enquete-financeur/route.ts`.

> La liste exacte sera reconfirmée à l'implémentation par un grep (`Intl.DateTimeFormat`, `toLocale*`) pour ne rater aucun emplacement.

### Tests (garantie « jamais de décalage »)

Tests unitaires sur `lib/date.ts` avec des instants UTC connus, **été ET hiver** (frontière DST) :
- `formatDateTime('2026-06-22T15:30:00Z')` → `22/06/2026 17:30` (CEST, UTC+2)
- `formatDateTime('2026-01-22T15:30:00Z')` → `22/01/2026 16:30` (CET, UTC+1)
- entrée vide → `''`
- `formatDate` sur une `'YYYY-MM-DD'` → même jour (pas de décalage).

Vérifier la présence d'un runner de test (sinon script ponctuel). ICU complet dispo dans le runtime Node de Next 16 → `timeZone: 'Europe/Paris'` fonctionne côté serveur comme PDF.

### Hors périmètre

Pas de changement de schéma ni de logique de **capture** (`new Date().toISOString()` reste correct pour du `timestamptz`).

---

## Partie 2 — Réponses aux tests sur la fiche stagiaire

### Besoin

Depuis la fiche stagiaire, pouvoir consulter **les réponses réelles** du stagiaire à ses tests (toutes sessions confondues). Aujourd'hui les onglets `Tests`/`Enquêtes` n'affichent que **scores / %** ; les réponses détaillées (question → réponse) n'existent que sur les pages **par session** et en PDF.

### Décisions validées

- **Page :** `app/(app)/admin/stagiaires/[id]/page.tsx` (vue admin).
- **Forme :** **enrichir les onglets existants** `Tests` et `Enquêtes` (pas de nouvel onglet).
- **Détail :** sous chaque test/enquête complété, un **bloc dépliable** (replié par défaut) montrant **question → réponse exacte** du stagiaire, avec indicateur juste/faux pour les quiz.

### Architecture

**Composant partagé extrait — `components/app/TestAnswerDetails.tsx`.**

La logique d'affichage d'une réponse existe déjà : `renderAnswer(q, valeur, valeurJson)` dans `app/(app)/formateur/sessions/[id]/tests/[testId]/reponses/page.tsx:29-63` (fonction JSX pure, gère `qcm_unique` avec follow-up, `qcm_multiple`, `echelle`, `texte_libre`/`liste`). On l'**extrait** dans un module partagé pour avoir **une seule implémentation** :

- `renderAnswer(...)` → déplacé/exporté depuis le module partagé ; la page formateur l'importe désormais (suppression de la copie locale).
- Un composant `TestAnswerDetails` rend la liste `question → réponse` d'une complétion. Sa partie « dépliable » est un petit composant **client** (`'use client'`, état `open`), le rendu des réponses restant pur.

**Intégration fiche stagiaire :**
- Onglet `Tests` (quiz) : sous chaque ligne de complétion (déjà affichée avec score), ajouter le `TestAnswerDetails` dépliable.
- Onglet `Enquêtes` : idem (les enquêtes n'ont pas de notion juste/faux → pas d'indicateur de score par question).

### Données & accès

- La page charge **déjà** `test_completions` + `responses` + `questions` (chargement parallèle dans `admin/stagiaires/[id]/page.tsx`). Vérifier que la sélection inclut bien `responses(question_id, valeur, valeur_json)` et les champs question nécessaires (`libelle`, `type_reponse`, `options`, `ordre`, `bonne_reponse`) ; compléter la requête au besoin.
- **Aucun changement de schéma.** La RLS autorise déjà l'admin à lire toutes les réponses (`is_admin()` sur `responses`/`test_completions`).
- Réutiliser `computeScore` de `lib/scoring` (déjà employé) pour l'indicateur juste/faux par question sur les quiz, en cohérence avec la page formateur.

### Tests

- Vérif manuelle : ouvrir une fiche stagiaire ayant complété un quiz + une enquête → déplier → réponses correctes affichées, indicateur juste/faux cohérent avec le score déjà montré.
- Cas vides : test complété sans réponses, ou stagiaire sans complétion → pas de bloc / message neutre.

### Hors périmètre

- Pas de modification de la vue formateur autre que le remplacement de `renderAnswer` local par l'import partagé (comportement identique).
- Pas d'ajout de réponses sur les autres « fiches » (page participant par session conserve son affichage actuel).

---

## Ordre d'implémentation suggéré

1. **Partie 1** d'abord (helper `lib/date.ts` + tests), puis remplacement des emplacements — le helper est isolé et à fort impact (PDF légal).
2. **Partie 2** ensuite (extraction `renderAnswer` + `TestAnswerDetails` + intégration onglets).

Pas de déploiement ni de push automatique (préférence utilisateur : déploiement Vercel uniquement sur demande explicite).
