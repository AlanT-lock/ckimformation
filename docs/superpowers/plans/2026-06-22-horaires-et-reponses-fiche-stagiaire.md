# Fix fuseau horaire global + Réponses aux tests sur la fiche stagiaire — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher tous les horaires en `Europe/Paris` sans décalage (PDF + web + emails) via un helper centralisé, et rendre les réponses détaillées des stagiaires aux tests consultables depuis la fiche stagiaire.

**Architecture :** Deux phases indépendantes. Phase 1 : un module unique `lib/date.ts` (locale `fr-FR`, `timeZone: 'Europe/Paris'` figé) remplace ~25 formatages ad-hoc. Phase 2 : extraction de la logique de rendu des réponses dans un composant partagé `TestAnswerList`, intégré en blocs dépliables (`<details>`) dans les onglets Tests/Enquêtes de la fiche stagiaire. Aucun changement de schéma DB.

**Tech Stack :** Next.js 16.2.4 (App Router, React 19), TypeScript, Supabase (`timestamptz`), `@react-pdf/renderer`, Vitest (+ Testing Library), Tailwind v4.

## Global Constraints

- **Next.js modifié** : AGENTS.md impose de lire le guide pertinent dans `node_modules/next/dist/docs/` avant d'écrire du code Next inhabituel. Ici on reste sur des patterns déjà présents dans le repo (Server Components, `import` de fonctions, `<details>` natif) — pas d'API Next nouvelle requise.
- **Fuseau figé** : `timeZone: 'Europe/Paris'`, locale `'fr-FR'`. Jamais de formatage de date sans passer par `lib/date.ts`.
- **Pas de déploiement ni de push automatiques** (préférence utilisateur : Vercel redéploie au push). Commits locaux uniquement.
- **Tests** : `npx vitest run <fichier>` ; tests dans `tests/`, style `import { describe, it, expect } from 'vitest'`, alias `@/`.
- **Vérifs** : `npx tsc --noEmit` (typecheck), `npx eslint <fichiers>` (lint).
- **Pas de changement de schéma** ni de RLS (l'admin lit déjà toutes les réponses).

---

# PHASE 1 — Fix fuseau horaire

## Task 1: Module de date centralisé `lib/date.ts` (TDD)

**Files:**
- Create: `lib/date.ts`
- Test: `tests/date.test.ts`

**Interfaces:**
- Produces:
  - `formatDateTime(value: Date|string|number|null|undefined): string` → `"22/06/2026 17:30"`
  - `formatDate(value: …): string` → `"22/06/2026"`
  - `formatTime(value: …): string` → `"17:30"`
  - `formatDateLong(value: …): string` → `"lundi 22 juin 2026"`
  - Entrée vide/invalide → `""`.

- [ ] **Step 1: Écrire le test qui échoue**

Create `tests/date.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatDateTime, formatDate, formatTime, formatDateLong } from '@/lib/date';

describe('lib/date — fuseau Europe/Paris figé', () => {
  it('formatDateTime applique CEST (UTC+2) en été', () => {
    const out = formatDateTime('2026-06-22T15:30:00Z');
    expect(out).toContain('22/06/2026');
    expect(out).toContain('17:30'); // 15:30 UTC + 2h
  });

  it('formatDateTime applique CET (UTC+1) en hiver', () => {
    const out = formatDateTime('2026-01-22T15:30:00Z');
    expect(out).toContain('22/01/2026');
    expect(out).toContain('16:30'); // 15:30 UTC + 1h
  });

  it('formatTime renvoie l’heure Paris', () => {
    expect(formatTime('2026-06-22T15:30:00Z')).toContain('17:30');
  });

  it('formatDate sur une date seule ne décale pas le jour', () => {
    expect(formatDate('2026-06-22')).toContain('22/06/2026');
  });

  it('formatDateLong renvoie le format long fr', () => {
    const out = formatDateLong('2026-06-22T10:00:00Z');
    expect(out).toContain('juin');
    expect(out).toContain('2026');
  });

  it('entrée vide → chaîne vide', () => {
    expect(formatDateTime(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatTime('')).toBe('');
    expect(formatDateTime('pas-une-date')).toBe('');
  });
});
```

- [ ] **Step 2: Lancer le test (doit échouer)**

Run: `npx vitest run tests/date.test.ts`
Expected: FAIL — `Cannot find module '@/lib/date'` (ou export manquant).

- [ ] **Step 3: Implémenter `lib/date.ts`**

Create `lib/date.ts`:

```ts
// Formatage de dates centralisé de l'application.
// Locale fr-FR + timeZone Europe/Paris FIGÉ : seule source de formatage de dates
// (web, PDF, emails). NE PAS marquer 'server-only' — utilisé aussi côté client.

const LOCALE = 'fr-FR';
const TZ = 'Europe/Paris';

const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});
const dateFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  day: '2-digit', month: '2-digit', year: 'numeric',
});
const timeFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  hour: '2-digit', minute: '2-digit',
});
const dateLongFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

type DateInput = Date | string | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(value: DateInput): string {
  const d = toDate(value);
  return d ? dateTimeFmt.format(d) : '';
}

export function formatDate(value: DateInput): string {
  const d = toDate(value);
  return d ? dateFmt.format(d) : '';
}

export function formatTime(value: DateInput): string {
  const d = toDate(value);
  return d ? timeFmt.format(d) : '';
}

export function formatDateLong(value: DateInput): string {
  const d = toDate(value);
  return d ? dateLongFmt.format(d) : '';
}
```

- [ ] **Step 4: Lancer le test (doit passer)**

Run: `npx vitest run tests/date.test.ts`
Expected: PASS (6 tests).

> Si le test sur `17:30` échoue en montrant `15:30`, le runtime n'a pas d'ICU complet — vérifier la version Node (≥ 18 a `full-icu` par défaut). Ne PAS retirer l'assertion : c'est la garantie anti-décalage.

- [ ] **Step 5: Commit**

```bash
git add lib/date.ts tests/date.test.ts
git commit -m "feat(date): helper de formatage centralisé Europe/Paris"
```

---

## Task 2: Remplacer les formatages dans les PDF (priorité — bug légal)

**Files:**
- Modify: `lib/pdf/EmargementPdf.tsx`
- Modify: `lib/pdf/TestsResponsesPdf.tsx`

**Interfaces:**
- Consumes: `formatDate`, `formatDateTime`, `formatDateLong` de `@/lib/date` (Task 1).

**Recette (identique pour les deux fichiers) :** supprimer les constantes locales `Intl.DateTimeFormat` ; importer depuis `@/lib/date` ; remplacer chaque `FR_*.format(new Date(x))` par l'appel au helper qui passe directement `x`.

⚠️ **Ne PAS toucher** `creneau.heureDebut` / `creneau.heureFin` ni le helper `trimTime` : ce sont des chaînes `time` (`"09:00:00"`), pas des timestamps.

- [ ] **Step 1: `lib/pdf/EmargementPdf.tsx`**

Supprimer les définitions locales (l.4-9) `FR_DATE` et `FR_DATETIME`. Garder `trimTime`. Ajouter en haut :

```ts
import { formatDate, formatDateTime, formatDateLong } from '@/lib/date';
```

Remplacements :
- En-tête / ligne de créneau utilisant `FR_DATE.format(new Date(creneau.date))` → `formatDateLong(creneau.date)`.
- Signature `FR_DATETIME.format(new Date(c.signedAt))` → `formatDateTime(c.signedAt)` (gère déjà le cas `null` → `""`).
- Footer `FR_DATETIME.format(new Date())` → `formatDateTime(new Date())`.

(Repérer les usages exacts : `grep -n "FR_DATE\|FR_DATETIME" lib/pdf/EmargementPdf.tsx`.)

- [ ] **Step 2: `lib/pdf/TestsResponsesPdf.tsx`**

Même recette. Supprimer le `FR_DATETIME` local (l.4-8), importer `formatDateTime` (et `formatDateLong` si un format long est utilisé), remplacer :
- complétions `FR_DATETIME.format(new Date(...))` → `formatDateTime(...)`,
- footer → `formatDateTime(new Date())`.

(`grep -n "FR_DATE\|FR_DATETIME\|Intl.DateTimeFormat" lib/pdf/TestsResponsesPdf.tsx`.)

- [ ] **Step 3: Vérifier typecheck + absence de formateur résiduel dans les PDF**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `grep -rnE "Intl\.DateTimeFormat|toLocale(Date|Time)?String" lib/pdf`
Expected: aucune sortie.

- [ ] **Step 4: Commit**

```bash
git add lib/pdf/EmargementPdf.tsx lib/pdf/TestsResponsesPdf.tsx
git commit -m "fix(pdf): horaires émargements/réponses en Europe/Paris"
```

---

## Task 3: Remplacer les formatages dans les pages admin

**Files (modify):**
- `app/(app)/admin/demandes/[id]/page.tsx`
- `app/(app)/admin/demandes/[id]/DemandeActions.tsx`
- `app/(app)/admin/demandes/page.tsx`
- `app/(app)/admin/sessions/[id]/participants/[participantId]/page.tsx`
- `app/(app)/admin/sessions/[id]/page.tsx`
- `app/(app)/admin/sessions/page.tsx`
- `app/(app)/admin/qualite/page.tsx`
- `app/(app)/admin/qualite/[completionId]/page.tsx`
- `app/(app)/admin/tests/[id]/resultats/page.tsx`
- `app/(app)/admin/stagiaires/page.tsx`
- `app/(app)/admin/stagiaires/[id]/page.tsx`
- `app/(app)/admin/formateurs/page.tsx`
- `app/(app)/admin/analytics/enquetes/page.tsx`
- `app/(app)/admin/analytics/user/[id]/page.tsx`

**Recette par fichier :**
1. Ajouter l'import : `import { formatDate, formatDateTime } from '@/lib/date';` (n'importer que ce qui est utilisé).
2. Supprimer toute constante locale `const FR_* = new Intl.DateTimeFormat('fr-FR', …)`.
3. Remplacer les appels :
   - `FR_DATETIME.format(new Date(x))` **ou** `new Date(x).toLocaleString('fr-FR')` → `formatDateTime(x)`
   - `FR_DATE.format(new Date(x))` **ou** `new Date(x).toLocaleDateString('fr-FR')` → `formatDate(x)`
   - `new Date(x).toLocaleTimeString('fr-FR')` → `formatTime(x)` (ajouter `formatTime` à l'import si besoin)

**Exemple concret** (avant → après) :

```tsx
// AVANT
const FR_DATETIME = new Intl.DateTimeFormat('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
// …
<p>Complété le {FR_DATETIME.format(new Date(c.completed_at))}</p>

// APRÈS
import { formatDateTime } from '@/lib/date';
// …
<p>Complété le {formatDateTime(c.completed_at)}</p>
```

> Conserver les gardes existantes (`{c.completed_at && …}`) telles quelles ; `formatDateTime` gère aussi `null` → `""` mais on ne change pas le JSX conditionnel pour limiter le diff.

- [ ] **Step 1: Localiser tous les usages dans le périmètre admin**

Run: `grep -rnE "Intl\.DateTimeFormat|toLocale(Date|Time)?String\('fr-FR'" "app/(app)/admin"`
Traiter chaque ligne listée selon la recette.

- [ ] **Step 2: Appliquer la recette fichier par fichier** (liste ci-dessus).

- [ ] **Step 3: Vérifier**

Run: `grep -rnE "Intl\.DateTimeFormat|toLocale(Date|Time)?String\('fr-FR'" "app/(app)/admin"`
Expected: aucune sortie.

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/admin"
git commit -m "fix(admin): affichage des dates en Europe/Paris via lib/date"
```

---

## Task 4: Remplacer les formatages dans les pages formateur

**Files (modify):**
- `app/(app)/formateur/page.tsx`
- `app/(app)/formateur/sessions/page.tsx`
- `app/(app)/formateur/sessions/[id]/TestsPanel.tsx`
- `app/(app)/formateur/sessions/[id]/tests/[testId]/reponses/page.tsx`
- `app/(app)/formateur/sessions/[id]/evaluations/[testId]/[participantId]/page.tsx`

**Recette :** identique à Task 3.

> Note : `…/tests/[testId]/reponses/page.tsx` contient aussi `renderAnswer` (intouché ici — il sera extrait en Phase 2). Ne traiter dans cette task QUE son `FR_DATETIME`.

- [ ] **Step 1: Localiser**

Run: `grep -rnE "Intl\.DateTimeFormat|toLocale(Date|Time)?String\('fr-FR'" "app/(app)/formateur"`

- [ ] **Step 2: Appliquer la recette** (import `@/lib/date`, supprimer les `FR_*` locaux, remplacer les appels).

- [ ] **Step 3: Vérifier**

Run: `grep -rnE "Intl\.DateTimeFormat|toLocale(Date|Time)?String\('fr-FR'" "app/(app)/formateur"`
Expected: aucune sortie.

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/formateur"
git commit -m "fix(formateur): affichage des dates en Europe/Paris via lib/date"
```

---

## Task 5: Remplacer les formatages stagiaire + emails cron, puis vérif globale

**Files (modify):**
- `app/(app)/stagiaire/inscriptions/[id]/page.tsx`
- `app/(app)/stagiaire/inscriptions/page.tsx`
- `app/(app)/stagiaire/parcours/ParcoursClient.tsx`
- `app/(app)/stagiaire/session-dediee/[sessionId]/SessionDedieeClient.tsx`
- `app/api/cron/enquete-froid/route.ts`
- `app/api/cron/enquete-financeur/route.ts`

**Recette :** identique à Task 3. `ParcoursClient.tsx` et `SessionDedieeClient.tsx` sont des composants `'use client'` — l'import de `@/lib/date` y est valide (le module n'utilise que `Intl`).

- [ ] **Step 1: Localiser (stagiaire + cron)**

Run: `grep -rnE "Intl\.DateTimeFormat|toLocale(Date|Time)?String\('fr-FR'" "app/(app)/stagiaire" "app/api/cron"`

- [ ] **Step 2: Appliquer la recette** sur les fichiers listés.

- [ ] **Step 3: Vérification GLOBALE de complétude (gate Phase 1)**

Run: `grep -rnE "Intl\.DateTimeFormat|toLocale(Date|Time)?String\('fr-FR'" app lib | grep -v "lib/date.ts"`
Expected: **aucune sortie** — plus aucun formatage de date hors `lib/date.ts` dans tout le code.

Run: `npx tsc --noEmit` → exit 0
Run: `npx vitest run tests/date.test.ts` → PASS
Run: `npx eslint "app/(app)/stagiaire" "app/api/cron" lib/date.ts` → exit 0

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/stagiaire" "app/api/cron"
git commit -m "fix(stagiaire,cron): affichage des dates en Europe/Paris via lib/date"
```

---

# PHASE 2 — Réponses aux tests sur la fiche stagiaire

## Task 6: Verdict par question dans `lib/scoring` (TDD)

**Files:**
- Modify: `lib/scoring.ts`
- Test: `tests/scoring.test.ts`

**Interfaces:**
- Produces: `evaluateQuestion(q: ScoringQuestion, r: ScoringResponse | undefined): 'correct' | 'incorrect' | null` (`null` = question non évaluable : ni QCM, ou pas de `bonne_reponse`).
- `computeScore` est refactorée pour s'appuyer sur `evaluateQuestion` (comportement inchangé).

- [ ] **Step 1: Écrire les tests qui échouent**

Create `tests/scoring.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { evaluateQuestion, computeScore, type ScoringQuestion } from '@/lib/scoring';

const qUnique: ScoringQuestion = { id: 'q1', type_reponse: 'qcm_unique', bonne_reponse: 'A', options: ['A', 'B'] };
const qMulti: ScoringQuestion = { id: 'q2', type_reponse: 'qcm_multiple', bonne_reponse: ['A', 'B'], options: ['A', 'B', 'C'] };
const qText: ScoringQuestion = { id: 'q3', type_reponse: 'texte_libre', bonne_reponse: null, options: [] };

describe('evaluateQuestion', () => {
  it('qcm_unique correct', () => {
    expect(evaluateQuestion(qUnique, { question_id: 'q1', valeur: null, valeur_json: { value: 'A' } })).toBe('correct');
  });
  it('qcm_unique incorrect', () => {
    expect(evaluateQuestion(qUnique, { question_id: 'q1', valeur: null, valeur_json: { value: 'B' } })).toBe('incorrect');
  });
  it('réponse absente → incorrect', () => {
    expect(evaluateQuestion(qUnique, undefined)).toBe('incorrect');
  });
  it('qcm_multiple exact → correct', () => {
    expect(evaluateQuestion(qMulti, { question_id: 'q2', valeur: null, valeur_json: { values: ['A', 'B'] } })).toBe('correct');
  });
  it('qcm_multiple partiel → incorrect', () => {
    expect(evaluateQuestion(qMulti, { question_id: 'q2', valeur: null, valeur_json: { values: ['A'] } })).toBe('incorrect');
  });
  it('question non QCM → null', () => {
    expect(evaluateQuestion(qText, { question_id: 'q3', valeur: 'blabla', valeur_json: null })).toBeNull();
  });
});

describe('computeScore (comportement préservé)', () => {
  it('compte les évaluables et les bonnes réponses', () => {
    const r = computeScore(
      [qUnique, qMulti, qText],
      [
        { question_id: 'q1', valeur: null, valeur_json: { value: 'A' } },
        { question_id: 'q2', valeur: null, valeur_json: { values: ['A'] } },
      ],
    );
    expect(r.totalEvaluable).toBe(2);
    expect(r.correct).toBe(1);
    expect(r.scorePct).toBe(50);
  });
  it('aucun évaluable → scorePct null', () => {
    expect(computeScore([qText], []).scorePct).toBeNull();
  });
});
```

- [ ] **Step 2: Lancer (doit échouer)**

Run: `npx vitest run tests/scoring.test.ts`
Expected: FAIL — `evaluateQuestion` non exporté.

- [ ] **Step 3: Ajouter `evaluateQuestion` et refactorer `computeScore`**

Dans `lib/scoring.ts`, ajouter après les helpers `asSet`/`asScalar` :

```ts
export type QuestionVerdict = 'correct' | 'incorrect' | null; // null = non évaluable

/** Verdict d'une question pour une réponse donnée. null si la question n'est pas notable. */
export function evaluateQuestion(q: ScoringQuestion, r: ScoringResponse | undefined): QuestionVerdict {
  if (q.type_reponse !== 'qcm_unique' && q.type_reponse !== 'qcm_multiple') return null;
  if (q.bonne_reponse === null || q.bonne_reponse === undefined) return null;
  if (!r) return 'incorrect';

  if (q.type_reponse === 'qcm_unique') {
    const userAnswer = asScalar(r.valeur_json) ?? r.valeur ?? null;
    const correctAnswer = typeof q.bonne_reponse === 'string' ? q.bonne_reponse : null;
    return userAnswer && correctAnswer && userAnswer === correctAnswer ? 'correct' : 'incorrect';
  }

  const userAnswers = asSet(r.valeur_json);
  const correctAnswers = asSet(q.bonne_reponse);
  const ok = userAnswers.size === correctAnswers.size && [...userAnswers].every((a) => correctAnswers.has(a));
  return ok ? 'correct' : 'incorrect';
}
```

Puis remplacer le corps de `computeScore` par une version qui réutilise `evaluateQuestion` (comportement identique) :

```ts
export function computeScore(
  questions: ScoringQuestion[],
  responses: ScoringResponse[],
): ScoringResult {
  const byQ = new Map(responses.map((r) => [r.question_id, r]));
  let totalEvaluable = 0;
  let correct = 0;

  for (const q of questions) {
    const verdict = evaluateQuestion(q, byQ.get(q.id));
    if (verdict === null) continue;
    totalEvaluable++;
    if (verdict === 'correct') correct++;
  }

  const scorePct = totalEvaluable === 0 ? null : Math.round((correct / totalEvaluable) * 100);
  return { totalEvaluable, correct, scorePct };
}
```

- [ ] **Step 4: Lancer (doit passer)**

Run: `npx vitest run tests/scoring.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/scoring.ts tests/scoring.test.ts
git commit -m "feat(scoring): evaluateQuestion (verdict par question) + computeScore DRY"
```

---

## Task 7: Composant partagé `TestAnswerList` + dédup `renderAnswer`

**Files:**
- Create: `components/app/TestAnswerList.tsx`
- Modify: `app/(app)/formateur/sessions/[id]/tests/[testId]/reponses/page.tsx`

**Interfaces:**
- Consumes: `evaluateQuestion`, `ScoringResponse` de `@/lib/scoring` (Task 6).
- Produces:
  - `renderAnswer(q: { type_reponse: QuestionType; options: string[] }, valeur: string | null, valeurJson: unknown): React.ReactNode`
  - `AnswerListQuestion = { id: string; libelle: string; type_reponse: QuestionType; options: string[]; bonne_reponse: unknown }`
  - `TestAnswerList({ questions: AnswerListQuestion[]; responses: ScoringResponse[]; showCorrectness?: boolean }): JSX`

- [ ] **Step 1: Créer `components/app/TestAnswerList.tsx`**

`renderAnswer` est la copie **verbatim** de la fonction actuelle de `…/reponses/page.tsx:29-63` (mêmes classes, même logique). Pas de directive `'use client'` (rendu pur, utilisable serveur et client).

```tsx
import type { QuestionType } from '@/lib/supabase/types';
import { evaluateQuestion, type ScoringResponse } from '@/lib/scoring';

export function renderAnswer(
  q: { type_reponse: QuestionType; options: string[] },
  valeur: string | null,
  valeurJson: unknown,
): React.ReactNode {
  switch (q.type_reponse) {
    case 'qcm_unique': {
      const json = (valeurJson ?? {}) as { value?: string | null; followup?: string };
      const value = json.value ?? valeur ?? null;
      if (!value) return <span>—</span>;
      return (
        <div>
          <span>{value}</span>
          {json.followup && (
            <p className="mt-1 text-xs text-dark/60 italic whitespace-pre-wrap">
              Précision : {json.followup}
            </p>
          )}
        </div>
      );
    }
    case 'qcm_multiple': {
      const json = (valeurJson ?? {}) as { values?: string[] };
      const arr = Array.isArray(json.values)
        ? json.values
        : Array.isArray(valeurJson)
          ? (valeurJson as string[])
          : [];
      if (arr.length === 0) return <span>—</span>;
      return <ul className="list-disc list-inside">{arr.map((v, i) => <li key={i}>{v}</li>)}</ul>;
    }
    case 'echelle':
      return <span>{valeur ?? '—'}</span>;
    case 'texte_libre':
    case 'liste':
    default:
      return <span className="whitespace-pre-wrap">{valeur || '—'}</span>;
  }
}

export interface AnswerListQuestion {
  id: string;
  libelle: string;
  type_reponse: QuestionType;
  options: string[];
  bonne_reponse: unknown;
}

export function TestAnswerList({
  questions,
  responses,
  showCorrectness = false,
}: {
  questions: AnswerListQuestion[];
  responses: ScoringResponse[];
  showCorrectness?: boolean;
}) {
  const byQ = new Map(responses.map((r) => [r.question_id, r]));
  if (questions.length === 0) {
    return <p className="text-sm text-dark/50">Aucune question.</p>;
  }
  return (
    <ol className="mt-3 space-y-3">
      {questions.map((q, i) => {
        const r = byQ.get(q.id);
        const verdict = showCorrectness
          ? evaluateQuestion(
              { id: q.id, type_reponse: q.type_reponse, bonne_reponse: q.bonne_reponse, options: q.options },
              r,
            )
          : null;
        return (
          <li key={q.id} className="text-sm">
            <p className="font-medium flex items-start gap-2">
              <span className="text-dark/40">{i + 1}.</span>
              <span className="flex-1">{q.libelle}</span>
              {verdict === 'correct' && <span className="text-teal text-xs whitespace-nowrap">✓ juste</span>}
              {verdict === 'incorrect' && <span className="text-orange text-xs whitespace-nowrap">✗ faux</span>}
            </p>
            <div className="mt-1 pl-5 text-dark/80">
              {renderAnswer({ type_reponse: q.type_reponse, options: q.options }, r?.valeur ?? null, r?.valeur_json ?? null)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 2: Dédupliquer dans la page formateur**

Dans `app/(app)/formateur/sessions/[id]/tests/[testId]/reponses/page.tsx` :
- Supprimer la fonction locale `renderAnswer` (l.29-63).
- Ajouter l'import : `import { renderAnswer } from '@/components/app/TestAnswerList';`
- Ne rien changer d'autre (la page continue d'appeler `renderAnswer(...)` avec la même signature).

- [ ] **Step 3: Vérifier**

Run: `npx tsc --noEmit` → exit 0
Run: `grep -n "function renderAnswer" "app/(app)/formateur/sessions/[id]/tests/[testId]/reponses/page.tsx"`
Expected: aucune sortie (la copie locale a bien disparu).

- [ ] **Step 4: Commit**

```bash
git add components/app/TestAnswerList.tsx "app/(app)/formateur/sessions/[id]/tests/[testId]/reponses/page.tsx"
git commit -m "refactor(tests): TestAnswerList partagé + renderAnswer dédupliqué"
```

---

## Task 8: Intégrer les réponses dépliables dans la fiche stagiaire

**Files:**
- Modify: `app/(app)/admin/stagiaires/[id]/page.tsx`

**Interfaces:**
- Consumes: `TestAnswerList`, `AnswerListQuestion` de `@/components/app/TestAnswerList` (Task 7).

> Ce fichier utilise déjà `formatDateTime` (Task 3) au lieu de `FR_DATETIME`.

- [ ] **Step 1: Charger `libelle` + `ordre` et construire les questions ordonnées par test**

Dans la requête `questions` (≈ l.128-131), ajouter `libelle, ordre` au `select` et ordonner :

```ts
testIds.length === 0 ? Promise.resolve({ data: [] }) : supabase
  .from('questions')
  .select('id, test_id, libelle, ordre, type_reponse, echelle_max, bonne_reponse, options')
  .in('test_id', testIds)
  .order('ordre', { ascending: true }),
```

Après la construction de `qById` (≈ l.150), ajouter une map des questions ordonnées par test, pour `TestAnswerList` :

```ts
const questionsByTest = new Map<string, AnswerListQuestion[]>();
for (const q of (questions ?? []) as Array<{
  id: string; test_id: string; libelle: string; type_reponse: QuestionType;
  options: unknown; bonne_reponse: unknown;
}>) {
  const arr = questionsByTest.get(q.test_id) ?? [];
  arr.push({
    id: q.id,
    libelle: q.libelle,
    type_reponse: q.type_reponse,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
    bonne_reponse: q.bonne_reponse,
  });
  questionsByTest.set(q.test_id, arr);
}
```

Ajouter l'import en haut du fichier :

```ts
import { TestAnswerList, type AnswerListQuestion } from '@/components/app/TestAnswerList';
```

- [ ] **Step 2: Passer `questionsByTest` aux deux sections**

Là où `<TestsSection … />` et `<EnquetesSection … />` sont rendus, ajouter la prop `questionsByTest={questionsByTest}`. Étendre la signature des deux composants pour l'accepter :

```ts
// dans la signature de TestsSection ET EnquetesSection :
questionsByTest,
}: {
  completions: CompletionLite[];
  qById: Map<string, ScaleQ & { test_id: string; bonne_reponse: unknown; options: unknown }>;
  respsByCompletion: Map<string, Array<{ question_id: string; valeur: string | null; valeur_json: unknown }>>;
  questionsByTest: Map<string, AnswerListQuestion[]>;
}) {
```

- [ ] **Step 3: Bloc dépliable dans `TestsSection`**

Dans le `<li>` de `TestsSection`, juste après la `<div className="flex items-start justify-between …">…</div>` (donc avant la fermeture du `<li>`), insérer :

```tsx
{(() => {
  const qs = questionsByTest.get(c.test_id) ?? [];
  if (qs.length === 0) return null;
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-teal hover:underline">
        Voir les réponses
      </summary>
      <TestAnswerList questions={qs} responses={resps} showCorrectness />
    </details>
  );
})()}
```

- [ ] **Step 4: Bloc dépliable dans `EnquetesSection`**

Même insertion dans le `<li>` de `EnquetesSection`, mais **sans** indicateur juste/faux :

```tsx
{(() => {
  const qs = questionsByTest.get(c.test_id) ?? [];
  if (qs.length === 0) return null;
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-teal hover:underline">
        Voir les réponses
      </summary>
      <TestAnswerList questions={qs} responses={resps} />
    </details>
  );
})()}
```

- [ ] **Step 5: Vérifier**

Run: `npx tsc --noEmit` → exit 0
Run: `npx eslint "app/(app)/admin/stagiaires/[id]/page.tsx" components/app/TestAnswerList.tsx` → exit 0

- [ ] **Step 6: Vérification manuelle**

Lancer `npm run dev`, ouvrir `/admin/stagiaires/<id d'un stagiaire ayant complété un quiz ET une enquête>` :
- Onglet **Tests** : sous un quiz, « Voir les réponses » déplie la liste question → réponse, avec ✓ juste / ✗ faux cohérents avec le score affiché.
- Onglet **Enquêtes** : « Voir les réponses » déplie les réponses, **sans** juste/faux.
- Un test sans questions → pas de bloc « Voir les réponses ».

- [ ] **Step 7: Commit**

```bash
git add "app/(app)/admin/stagiaires/[id]/page.tsx"
git commit -m "feat(fiche-stagiaire): réponses détaillées dépliables dans Tests et Enquêtes"
```

---

## Notes de fin

- **Aucun push / déploiement** automatique (préférence utilisateur).
- Format harmonisé : les rares endroits qui affichaient `month: 'short'` (« 22 juin ») passent en numérique (« 22/06/2026 ») via `formatDateTime`. Changement cosmétique assumé au profit d'une source unique. Le PDF d'émargement conserve son format numérique d'origine (seul le fuseau change).
- Duplication restante connue, hors périmètre : `quizScore`/`completionScorePct` locaux à `admin/stagiaires/[id]/page.tsx` (calcul du badge de score) — non touchés pour limiter le risque ; pourront être ramenés sur `lib/scoring` ultérieurement.
