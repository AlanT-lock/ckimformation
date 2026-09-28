# Rubrique « Entreprises » (admin) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une rubrique admin « Entreprises » (liste + fiche), la création d'entreprises et de salariés par l'admin avec invitation par email, l'inscription de salariés à une session, la conversion particulier → entreprise, et corriger la perte de `secteur_activite` au signup.

**Architecture:** Aucune nouvelle table : une entreprise reste un `profiles` (`account_type = 'entreprise'`) + `company_details`. La logique pure (validation, éligibilité, statuts, tri) vit dans `lib/validation/company.ts` et `lib/companies/*.ts` et est testée avec vitest ; les accès base passent par `createAdminClient()` dans des modules `server-only` et des Server Actions protégées par `requireAdmin()`. Le formulaire entreprise est extrait dans `components/forms/CompanyFormFields.tsx` et partagé entre le signup public, la création admin et la conversion.

**Tech Stack:** Next.js 16.2 (App Router, Server Actions), React 19, Supabase (`@supabase/supabase-js`, auth admin `generateLink`), Resend (`sendAndLog`), Tailwind, Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-09-28-rubrique-entreprises-admin-design.md`

## Global Constraints

- **Pas de `git commit` ni `git push`** (préférence utilisateur : chaque push redéploie Vercel). Chaque tâche se termine par une vérification, pas par un commit.
- **Pas de déploiement Vercel.**
- Next.js 16 : suivre les patterns déjà présents dans le repo (`params`/`searchParams` sont des `Promise`, `'use server'` en tête des fichiers d'actions). Avant d'utiliser une API Next absente du repo, lire `node_modules/next/dist/docs/`.
- Toute date affichée passe par `lib/date.ts` (Europe/Paris figé) — jamais de `toLocale*` ni d'`Intl` ad-hoc hors de ce module.
- Emails : Resend via `sendAndLog` (`lib/email/log.ts`), jamais d'email automatique Supabase (`generateLink` et non `inviteUserByEmail`).
- Pages et actions admin : `getCurrentProfile()` + `role === 'admin'` puis `createAdminClient()` ; tout id reçu du client est revérifié côté serveur.
- Textes UI en français, style Tailwind existant (`bg-white rounded-lg border border-dark/10`, `text-teal`, `text-orange` pour les erreurs).
- Commandes de vérification : `npx vitest run <fichier>`, `npx tsc --noEmit`, `npm run lint`.

## Review Focus

1. **Email déjà utilisé à la création d'une entreprise** → refus clair, aucun utilisateur auth créé ; si c'est un particulier convertible, lien vers sa fiche. (Test : Task 8, `tests/entreprises/company-invitation.test.ts`.)
2. **Code secteur vide ou inconnu dans les métadonnées** → le trigger ne doit pas faire échouer la création du compte (FK `secteurs_activite`). (Test : Task 1, vérification du `select code from public.secteurs_activite` dans la migration.)
3. **Salarié déjà inscrit à la session (par sa fiche `employees` ou par son profil lié)** → ignoré, pas de doublon ; si tous le sont → erreur. (Test : Task 6, `partitionEmployeesByOccupancy`.)
4. **Session réservée à une autre entreprise, passée ou non publiée, avec un id forgé** → refus serveur. (Test : Task 6, `isSessionEligibleForCompany`.)
5. **Conversion d'un compte salarié, entreprise, formateur ou admin via appel direct de l'action** → refus serveur. (Test : Task 6, `canConvertToCompany`.)

---

## File Structure

**Nouveaux**
| Fichier | Responsabilité |
|---|---|
| `supabase/migrations/20260928_entreprises_admin.sql` | Trigger `handle_new_user` corrigé (secteur + employee_id) |
| `lib/validation/company.ts` | Type `CompanyInput`, validation par section, métadonnées auth, ligne `company_details` |
| `components/forms/CompanyFormFields.tsx` | Champs Société / Adresse / Contact, thèmes `dark` (auth) et `light` (admin) |
| `lib/email/templates/company-invitation.ts` | Mail d'invitation d'une entreprise créée par l'admin |
| `lib/employees/account-invitation.ts` | Invitation de création de compte d'un salarié (extrait du flux formateur) |
| `lib/companies/conversion.ts` | `canConvertToCompany` (pur) |
| `lib/companies/enrollment.ts` | Éligibilité session, partition des salariés déjà inscrits (pur) |
| `lib/companies/status.ts` | Statut de compte d'un salarié (pur) |
| `lib/companies/sessions.ts` | Construction/tri des lignes « sessions de l'entreprise » (pur) |
| `lib/companies/search.ts` | Recherche texte sur la liste des entreprises (pur) |
| `lib/companies/auth-status.ts` | Ids des comptes déjà connectés (`listUsers`) — server-only |
| `lib/companies/queries.ts` | Chargements base (liste, fiche, sessions éligibles) — server-only |
| `lib/companies/invitation.ts` | Création d'entreprise + (re)envoi de l'invitation — server-only |
| `app/(app)/admin/entreprises/page.tsx` | Liste |
| `app/(app)/admin/entreprises/actions.ts` | Server actions entreprise / salariés / inscriptions |
| `app/(app)/admin/entreprises/nouvelle/page.tsx` + `NewCompanyForm.tsx` | Création |
| `app/(app)/admin/entreprises/[id]/page.tsx` | Fiche |
| `app/(app)/admin/entreprises/[id]/ResendCompanyInvitationButton.tsx` | Renvoi invitation entreprise |
| `app/(app)/admin/entreprises/[id]/AddCompanyEmployeeForm.tsx` | Ajout salarié |
| `app/(app)/admin/entreprises/[id]/ResendEmployeeInvitationButton.tsx` | Renvoi invitation salarié |
| `app/(app)/admin/entreprises/[id]/EnrollEmployeesDialog.tsx` | Inscription de salariés |
| `app/(app)/admin/stagiaires/[id]/ConvertToCompany.tsx` + `convert-actions.ts` | Conversion |
| `tests/entreprises/*.test.ts(x)` | Tests |

**Modifiés**
- `components/app/AppShell.tsx` (menu)
- `app/(app)/admin/stagiaires/SearchInput.tsx` (props `basePath` / `placeholder`)
- `app/(auth)/signup-entreprise/SignupEntrepriseForm.tsx` (utilise `CompanyFormFields`)
- `app/(app)/formateur/sessions/[id]/stagiaires/actions.ts` (utilise `sendEmployeeAccountInvitation`)
- `lib/email/templates/invitation.ts` (variante sans formation)
- `lib/email/log.ts` (nouveaux `EmailLogKind`)
- `lib/employees/invitations.ts` (export `getEntrepriseLabel`)
- `lib/sessions/stagiaire-search.ts` + `lib/sessions/search-stagiaires-query.ts` (`employeeId` sur les occupants)
- `lib/date.ts` (`todayIsoParis`)
- `app/(app)/admin/stagiaires/[id]/page.tsx` (bouton de conversion)

---

### Task 1: Migration — trigger `handle_new_user` (fix secteur)

**Files:**
- Create: `supabase/migrations/20260928_entreprises_admin.sql`
- Test: `tests/entreprises/migration-handle-new-user.test.ts`

**Interfaces:**
- Produces: le trigger lit `raw_user_meta_data.secteur_activite` (ignoré si code inconnu) et `employee_id`. Utilisé par Task 3 (signup) et Task 8 (création admin).

- [ ] **Step 1: Écrire le test (échoue : fichier absent)**

```ts
// tests/entreprises/migration-handle-new-user.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const sql = readFileSync(
  path.resolve(__dirname, '../../supabase/migrations/20260928_entreprises_admin.sql'),
  'utf8',
);

describe('migration 20260928 handle_new_user', () => {
  it('redéfinit le trigger', () => {
    expect(sql).toMatch(/create or replace function public\.handle_new_user\(\)/);
  });
  it('insère secteur_activite dans profiles', () => {
    expect(sql).toMatch(/insert into public\.profiles \([^)]*secteur_activite[^)]*\)/);
  });
  it('ne garde le secteur que s’il existe (évite la violation de FK)', () => {
    expect(sql).toMatch(/select code into v_secteur\s+from public\.secteurs_activite/);
  });
  it('conserve la liaison employees.profile_id via employee_id', () => {
    expect(sql).toMatch(/update public\.employees\s+set profile_id = new\.id/);
  });
  it('conserve la création de company_details', () => {
    expect(sql).toMatch(/insert into public\.company_details/);
  });
});
```

- [ ] **Step 2: Lancer le test**

Run: `npx vitest run tests/entreprises/migration-handle-new-user.test.ts`
Expected: FAIL (`ENOENT ... 20260928_entreprises_admin.sql`)

- [ ] **Step 3: Écrire la migration**

```sql
-- supabase/migrations/20260928_entreprises_admin.sql
-- =============================================================================
--  Rubrique Entreprises (admin) — correctif handle_new_user
-- =============================================================================
--  20260510 avait ajouté secteur_activite au trigger ; 20260512 l'a redéfini
--  (liaison employee_id) SANS secteur_activite → le secteur saisi au signup
--  entreprise n'était plus enregistré. On fusionne les deux versions.
--  Un code secteur inconnu est ignoré (sinon la FK ferait échouer la création
--  de l'utilisateur auth).
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role         user_role;
  v_account_type account_type;
  v_employee_id  uuid;
  v_secteur      text;
begin
  v_role := coalesce(nullif(new.raw_user_meta_data->>'role',''), 'stagiaire')::user_role;
  v_account_type := nullif(new.raw_user_meta_data->>'account_type','')::account_type;
  v_employee_id := nullif(new.raw_user_meta_data->>'employee_id','')::uuid;

  select code into v_secteur
    from public.secteurs_activite
   where code = nullif(new.raw_user_meta_data->>'secteur_activite','');

  insert into public.profiles (id, role, account_type, full_name, phone, email, employer_profile_id, secteur_activite)
  values (
    new.id,
    v_role,
    v_account_type,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    new.email,
    nullif(new.raw_user_meta_data->>'employer_profile_id','')::uuid,
    v_secteur
  );

  if v_account_type = 'entreprise' then
    insert into public.company_details (profile_id, raison_sociale, siret, tva_intra, contact_fonction, billing_address)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'raison_sociale', ''),
      nullif(new.raw_user_meta_data->>'siret', ''),
      nullif(new.raw_user_meta_data->>'tva_intra', ''),
      new.raw_user_meta_data->>'contact_fonction',
      coalesce((new.raw_user_meta_data->>'billing_address')::jsonb, '{}'::jsonb)
    );
  end if;

  -- Salarié invité : on lie sa fiche employee à son profile.
  if v_employee_id is not null then
    update public.employees
       set profile_id = new.id, updated_at = now()
     where id = v_employee_id;
  end if;

  return new;
end;
$$;

-- Le trigger on_auth_user_created existe déjà (init) — pas besoin de le recréer.
```

- [ ] **Step 4: Relancer le test**

Run: `npx vitest run tests/entreprises/migration-handle-new-user.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Application en base**

La migration doit être appliquée sur le projet Supabase. **Demander à l'utilisateur** s'il l'applique lui-même (SQL editor) ou s'il autorise l'application via le MCP Supabase. Ne pas l'appliquer sans accord.

---

### Task 2: Validation entreprise partagée

**Files:**
- Create: `lib/validation/company.ts`
- Test: `tests/entreprises/company-validation.test.ts`

**Interfaces:**
- Produces:
  - `interface CompanyInput { raison_sociale; siret; tva_intra; secteur_activite; addr_rue; addr_cp; addr_ville; full_name; contact_fonction; email; phone }` (tous `string`)
  - `EMPTY_COMPANY_INPUT: CompanyInput`
  - `type CompanySection = 'societe' | 'adresse' | 'contact'`, `COMPANY_SECTIONS: CompanySection[]`
  - `validateCompanySection(section: CompanySection, f: CompanyInput): string | null`
  - `validateCompanyInput(f: CompanyInput): string | null`
  - `normalizeCompanyInput(f: CompanyInput): CompanyInput`
  - `toBillingAddress(f): { rue; code_postal; ville; pays }`
  - `toCompanyAuthMetadata(f): Record<string, string>`
  - `toCompanyDetailsRow(profileId: string, f): { profile_id; raison_sociale; siret: string|null; tva_intra: string|null; contact_fonction: string; billing_address }`

- [ ] **Step 1: Écrire les tests**

```ts
// tests/entreprises/company-validation.test.ts
import { describe, it, expect } from 'vitest';
import {
  EMPTY_COMPANY_INPUT,
  normalizeCompanyInput,
  toBillingAddress,
  toCompanyAuthMetadata,
  toCompanyDetailsRow,
  validateCompanyInput,
  validateCompanySection,
  type CompanyInput,
} from '@/lib/validation/company';

const VALID: CompanyInput = {
  raison_sociale: 'ACME SARL',
  siret: '12345678900011',
  tva_intra: '',
  secteur_activite: 'btp',
  addr_rue: '1 rue de la Paix',
  addr_cp: '75002',
  addr_ville: 'Paris',
  full_name: 'Jeanne Martin',
  contact_fonction: 'DRH',
  email: 'rh@acme.fr',
  phone: '0102030405',
};

describe('validateCompanySection', () => {
  it('société : raison sociale obligatoire', () => {
    expect(validateCompanySection('societe', { ...VALID, raison_sociale: '  ' }))
      .toBe('La raison sociale est obligatoire.');
  });
  it('adresse : rue, CP, ville obligatoires', () => {
    expect(validateCompanySection('adresse', { ...VALID, addr_rue: '' })).toBe("L'adresse (rue) est obligatoire.");
    expect(validateCompanySection('adresse', { ...VALID, addr_cp: '' })).toBe('Le code postal est obligatoire.');
    expect(validateCompanySection('adresse', { ...VALID, addr_ville: '' })).toBe('La ville est obligatoire.');
  });
  it('contact : email valide et téléphone obligatoires', () => {
    expect(validateCompanySection('contact', { ...VALID, email: 'pas-un-email' })).toBe('Email invalide.');
    expect(validateCompanySection('contact', { ...VALID, phone: '' })).toBe('Le téléphone du contact est obligatoire.');
    expect(validateCompanySection('contact', { ...VALID, contact_fonction: '' })).toBe('La fonction du contact est obligatoire.');
  });
});

describe('validateCompanyInput', () => {
  it('accepte une saisie complète', () => {
    expect(validateCompanyInput(VALID)).toBeNull();
  });
  it('renvoie la première erreur rencontrée', () => {
    expect(validateCompanyInput(EMPTY_COMPANY_INPUT)).toBe('La raison sociale est obligatoire.');
  });
});

describe('normalizeCompanyInput', () => {
  it('trim tout et met l’email en minuscules', () => {
    const n = normalizeCompanyInput({ ...VALID, raison_sociale: '  ACME ', email: ' RH@Acme.FR ' });
    expect(n.raison_sociale).toBe('ACME');
    expect(n.email).toBe('rh@acme.fr');
  });
});

describe('conversions', () => {
  it('toBillingAddress', () => {
    expect(toBillingAddress(VALID)).toEqual({ rue: '1 rue de la Paix', code_postal: '75002', ville: 'Paris', pays: 'France' });
  });
  it('toCompanyAuthMetadata sérialise billing_address et fixe le type de compte', () => {
    const m = toCompanyAuthMetadata(VALID);
    expect(m.role).toBe('stagiaire');
    expect(m.account_type).toBe('entreprise');
    expect(m.secteur_activite).toBe('btp');
    expect(JSON.parse(m.billing_address)).toEqual(toBillingAddress(VALID));
  });
  it('toCompanyDetailsRow met les champs optionnels vides à null', () => {
    const row = toCompanyDetailsRow('p1', VALID);
    expect(row).toMatchObject({ profile_id: 'p1', raison_sociale: 'ACME SARL', siret: '12345678900011', tva_intra: null, contact_fonction: 'DRH' });
  });
});
```

- [ ] **Step 2: Lancer les tests**

Run: `npx vitest run tests/entreprises/company-validation.test.ts`
Expected: FAIL (module introuvable)

- [ ] **Step 3: Implémenter**

```ts
// lib/validation/company.ts
// Validation et mise en forme des informations entreprise, partagées entre
// le signup public, la création par l'admin et la conversion d'un particulier.

export interface CompanyInput {
  raison_sociale: string;
  siret: string;
  tva_intra: string;
  secteur_activite: string;
  addr_rue: string;
  addr_cp: string;
  addr_ville: string;
  full_name: string;
  contact_fonction: string;
  email: string;
  phone: string;
}

export const EMPTY_COMPANY_INPUT: CompanyInput = {
  raison_sociale: '',
  siret: '',
  tva_intra: '',
  secteur_activite: '',
  addr_rue: '',
  addr_cp: '',
  addr_ville: '',
  full_name: '',
  contact_fonction: '',
  email: '',
  phone: '',
};

export type CompanySection = 'societe' | 'adresse' | 'contact';
export const COMPANY_SECTIONS: CompanySection[] = ['societe', 'adresse', 'contact'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCompanySection(section: CompanySection, f: CompanyInput): string | null {
  if (section === 'societe') {
    if (!f.raison_sociale.trim()) return 'La raison sociale est obligatoire.';
  }
  if (section === 'adresse') {
    if (!f.addr_rue.trim()) return "L'adresse (rue) est obligatoire.";
    if (!f.addr_cp.trim()) return 'Le code postal est obligatoire.';
    if (!f.addr_ville.trim()) return 'La ville est obligatoire.';
  }
  if (section === 'contact') {
    if (!f.full_name.trim()) return 'Le nom et prénom du contact sont obligatoires.';
    if (!f.contact_fonction.trim()) return 'La fonction du contact est obligatoire.';
    if (!f.email.trim()) return "L'email du contact est obligatoire.";
    if (!EMAIL_RE.test(f.email.trim())) return 'Email invalide.';
    if (!f.phone.trim()) return 'Le téléphone du contact est obligatoire.';
  }
  return null;
}

export function validateCompanyInput(f: CompanyInput): string | null {
  for (const section of COMPANY_SECTIONS) {
    const err = validateCompanySection(section, f);
    if (err) return err;
  }
  return null;
}

export function normalizeCompanyInput(f: CompanyInput): CompanyInput {
  return {
    raison_sociale: f.raison_sociale.trim(),
    siret: f.siret.trim(),
    tva_intra: f.tva_intra.trim(),
    secteur_activite: f.secteur_activite.trim(),
    addr_rue: f.addr_rue.trim(),
    addr_cp: f.addr_cp.trim(),
    addr_ville: f.addr_ville.trim(),
    full_name: f.full_name.trim(),
    contact_fonction: f.contact_fonction.trim(),
    email: f.email.trim().toLowerCase(),
    phone: f.phone.trim(),
  };
}

export function toBillingAddress(f: CompanyInput) {
  return {
    rue: f.addr_rue.trim(),
    code_postal: f.addr_cp.trim(),
    ville: f.addr_ville.trim(),
    pays: 'France',
  };
}

/** Métadonnées lues par le trigger handle_new_user (signUp et generateLink). */
export function toCompanyAuthMetadata(f: CompanyInput): Record<string, string> {
  return {
    role: 'stagiaire',
    account_type: 'entreprise',
    full_name: f.full_name.trim(),
    phone: f.phone.trim(),
    raison_sociale: f.raison_sociale.trim(),
    siret: f.siret.trim(),
    tva_intra: f.tva_intra.trim(),
    contact_fonction: f.contact_fonction.trim(),
    secteur_activite: f.secteur_activite.trim(),
    billing_address: JSON.stringify(toBillingAddress(f)),
  };
}

export function toCompanyDetailsRow(profileId: string, f: CompanyInput) {
  return {
    profile_id: profileId,
    raison_sociale: f.raison_sociale.trim(),
    siret: f.siret.trim() || null,
    tva_intra: f.tva_intra.trim() || null,
    contact_fonction: f.contact_fonction.trim(),
    billing_address: toBillingAddress(f),
  };
}
```

- [ ] **Step 4: Relancer les tests**

Run: `npx vitest run tests/entreprises/company-validation.test.ts`
Expected: PASS

---

### Task 3: `CompanyFormFields` + refactor du signup entreprise

**Files:**
- Create: `components/forms/CompanyFormFields.tsx`
- Modify: `app/(auth)/signup-entreprise/SignupEntrepriseForm.tsx`
- Test: `tests/entreprises/company-form-fields.test.tsx`

**Interfaces:**
- Consumes: `CompanyInput`, `CompanySection`, `validateCompanySection`, `toCompanyAuthMetadata` (Task 2) ; `Secteur` (`lib/db/secteurs.ts`).
- Produces: `CompanyFormFields({ value, onChange, secteurs, sections?, theme?, headings?, emailReadOnly? })` — `onChange(next: CompanyInput)`.

- [ ] **Step 1: Écrire le test**

```tsx
// tests/entreprises/company-form-fields.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompanyFormFields } from '@/components/forms/CompanyFormFields';
import { EMPTY_COMPANY_INPUT } from '@/lib/validation/company';

const secteurs = [{ code: 'btp', label: 'BTP', ordre: 1, actif: true }];

describe('CompanyFormFields', () => {
  it('affiche toutes les sections par défaut', () => {
    render(<CompanyFormFields value={EMPTY_COMPANY_INPUT} onChange={() => {}} secteurs={secteurs} />);
    expect(screen.getByLabelText(/Raison sociale/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Code postal/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fonction/)).toBeInTheDocument();
  });

  it('n’affiche que les sections demandées', () => {
    render(<CompanyFormFields value={EMPTY_COMPANY_INPUT} onChange={() => {}} secteurs={secteurs} sections={['adresse']} />);
    expect(screen.queryByLabelText(/Raison sociale/)).toBeNull();
    expect(screen.getByLabelText(/Ville/)).toBeInTheDocument();
  });

  it('remonte la valeur complète au changement', () => {
    const onChange = vi.fn();
    render(<CompanyFormFields value={EMPTY_COMPANY_INPUT} onChange={onChange} secteurs={secteurs} />);
    fireEvent.change(screen.getByLabelText(/Raison sociale/), { target: { value: 'ACME' } });
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_COMPANY_INPUT, raison_sociale: 'ACME' });
  });

  it('email en lecture seule si demandé', () => {
    render(<CompanyFormFields value={EMPTY_COMPANY_INPUT} onChange={() => {}} secteurs={secteurs} emailReadOnly />);
    expect(screen.getByLabelText(/Email/)).toHaveAttribute('readonly');
  });
});
```

- [ ] **Step 2: Lancer le test**

Run: `npx vitest run tests/entreprises/company-form-fields.test.tsx`
Expected: FAIL (module introuvable)

- [ ] **Step 3: Implémenter le composant**

```tsx
// components/forms/CompanyFormFields.tsx
'use client';

import type { ReactNode } from 'react';
import type { Secteur } from '@/lib/db/secteurs';
import { COMPANY_SECTIONS, type CompanyInput, type CompanySection } from '@/lib/validation/company';

type Theme = 'dark' | 'light';

const LABEL: Record<Theme, string> = {
  dark: 'text-xs uppercase tracking-[0.2em] text-muted',
  light: 'text-xs uppercase tracking-[0.2em] text-dark/60',
};
const INPUT: Record<Theme, string> = {
  dark: 'mt-1 w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-white placeholder-muted/40 focus:outline-none focus:border-teal-l transition read-only:opacity-60',
  light: 'mt-1 w-full bg-white border border-dark/15 rounded px-3 py-2 text-dark focus:outline-none focus:border-teal read-only:bg-light read-only:text-dark/60',
};
const HEADINGS: Record<CompanySection, string> = {
  societe: 'Société',
  adresse: 'Adresse de facturation',
  contact: 'Contact principal',
};

export function CompanyFormFields({
  value,
  onChange,
  secteurs,
  sections = COMPANY_SECTIONS,
  theme = 'dark',
  headings = false,
  emailReadOnly = false,
}: {
  value: CompanyInput;
  onChange: (next: CompanyInput) => void;
  secteurs: Secteur[];
  sections?: CompanySection[];
  theme?: Theme;
  headings?: boolean;
  emailReadOnly?: boolean;
}) {
  function set<K extends keyof CompanyInput>(k: K, v: string) {
    onChange({ ...value, [k]: v });
  }

  // Appelées comme fonctions (et non <Input />) : des composants déclarés dans le
  // rendu seraient remontés à chaque frappe et l'input perdrait le focus.
  function input(props: {
    label: string; k: keyof CompanyInput; required?: boolean; type?: string;
    autoComplete?: string; placeholder?: string; readOnly?: boolean;
  }) {
    return (
      <label className="block">
        <span className={LABEL[theme]}>
          {props.label}{props.required && <span className="text-orange ml-1">*</span>}
        </span>
        <input
          type={props.type ?? 'text'}
          value={value[props.k]}
          onChange={(e) => set(props.k, e.target.value)}
          required={props.required}
          readOnly={props.readOnly}
          autoComplete={props.autoComplete}
          placeholder={props.placeholder}
          className={INPUT[theme]}
        />
      </label>
    );
  }

  function section(id: CompanySection, children: ReactNode) {
    if (!sections.includes(id)) return null;
    return (
      <div className="space-y-3">
        {headings && <h3 className="font-display text-lg">{HEADINGS[id]}</h3>}
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {section('societe', (
        <>
          {input({ label: 'Raison sociale', k: 'raison_sociale', required: true, autoComplete: 'organization' })}
          <div className="grid sm:grid-cols-2 gap-3">
            {input({ label: 'SIRET', k: 'siret' })}
            {input({ label: 'TVA intracom.', k: 'tva_intra' })}
          </div>
          <label className="block">
            <span className={LABEL[theme]}>Secteur d&apos;activité</span>
            <select
              value={value.secteur_activite}
              onChange={(e) => set('secteur_activite', e.target.value)}
              className={INPUT[theme]}
            >
              <option value="" className="text-dark">— Non précisé —</option>
              {secteurs.map((s) => (
                <option key={s.code} value={s.code} className="text-dark">{s.label}</option>
              ))}
            </select>
          </label>
        </>
      ))}

      {section('adresse', (
        <>
          {input({ label: 'Rue', k: 'addr_rue', required: true, autoComplete: 'street-address' })}
          <div className="grid grid-cols-3 gap-3">
            {input({ label: 'Code postal', k: 'addr_cp', required: true, autoComplete: 'postal-code' })}
            <div className="col-span-2">
              {input({ label: 'Ville', k: 'addr_ville', required: true, autoComplete: 'address-level2' })}
            </div>
          </div>
        </>
      ))}

      {section('contact', (
        <>
          {input({ label: 'Nom et prénom', k: 'full_name', required: true, autoComplete: 'name' })}
          {input({ label: 'Fonction', k: 'contact_fonction', required: true, autoComplete: 'organization-title', placeholder: 'Ex. Responsable RH' })}
          {input({ label: 'Email', k: 'email', type: 'email', required: true, autoComplete: 'email', readOnly: emailReadOnly })}
          {input({ label: 'Téléphone', k: 'phone', type: 'tel', required: true, autoComplete: 'tel' })}
        </>
      ))}
    </div>
  );
}
```

Vérifier manuellement qu'on peut taper plusieurs caractères d'affilée sans perdre le focus.

- [ ] **Step 4: Lancer le test**

Run: `npx vitest run tests/entreprises/company-form-fields.test.tsx`
Expected: PASS

- [ ] **Step 5: Refactorer `SignupEntrepriseForm.tsx`**

Remplacer l'interface `FormState`, `INITIAL` et `validate` par :

```tsx
import { CompanyFormFields } from '@/components/forms/CompanyFormFields';
import {
  EMPTY_COMPANY_INPUT,
  toCompanyAuthMetadata,
  validateCompanySection,
  type CompanyInput,
  type CompanySection,
} from '@/lib/validation/company';

interface FormState extends CompanyInput {
  password: string;
  confirm: string;
}

const INITIAL: FormState = { ...EMPTY_COMPANY_INPUT, password: '', confirm: '' };

const SECTION_BY_STEP: Record<0 | 1 | 2, CompanySection> = { 0: 'societe', 1: 'adresse', 2: 'contact' };

function validate(step: Step, f: FormState): string | null {
  if (step !== 3) return validateCompanySection(SECTION_BY_STEP[step], f);
  if (f.password.length < 8) return 'Mot de passe : 8 caractères minimum.';
  if (f.password !== f.confirm) return 'Les mots de passe ne correspondent pas.';
  return null;
}
```

`submit()` doit valider **toutes** les étapes (et non seulement l'étape 3) pour ne pas envoyer une saisie incomplète :

```tsx
    const err = validate(0, form) ?? validate(1, form) ?? validate(2, form) ?? validate(3, form) ?? validateRgpd(rgpd);
```

Dans l'appel `supabase.auth.signUp`, remplacer l'objet `billing_address` local et le bloc `data: {...}` par :

```tsx
        data: toCompanyAuthMetadata(form),
```

(supprimer la constante `billing_address` devenue inutile.)

Remplacer le contenu des étapes 0, 1 et 2 (les `<Field>` / `<SelectField>` de société, adresse, contact) par :

```tsx
        {step === 0 && (
          <StepContent title="Société" description="Renseignez les informations légales de votre entreprise.">
            <CompanyFormFields value={form} onChange={(next) => setForm((s) => ({ ...s, ...next }))} secteurs={secteurs} sections={['societe']} />
          </StepContent>
        )}

        {step === 1 && (
          <StepContent title="Adresse de facturation" description="Tous les champs sont obligatoires.">
            <CompanyFormFields value={form} onChange={(next) => setForm((s) => ({ ...s, ...next }))} secteurs={secteurs} sections={['adresse']} />
          </StepContent>
        )}

        {step === 2 && (
          <StepContent title="Contact principal" description="Personne référente du compte. Tous les champs sont obligatoires.">
            <CompanyFormFields value={form} onChange={(next) => setForm((s) => ({ ...s, ...next }))} secteurs={secteurs} sections={['contact']} />
          </StepContent>
        )}
```

Supprimer la fonction `SelectField` (plus utilisée). Garder `Field` (étape mot de passe). Le `useState` initial reste `{ ...INITIAL, email: prefill?.email ?? '', ... }`.

- [ ] **Step 6: Vérifier**

Run: `npx tsc --noEmit && npx vitest run tests/entreprises`
Expected: aucun erreur de type, tests PASS.

Vérification manuelle (`npm run dev`, `/signup-entreprise`) : les 4 étapes s'affichent comme avant, la saisie ne perd pas le focus, « Suivant » bloque sur un champ manquant.

---

### Task 4: Templates email (entreprise + salarié sans formation)

**Files:**
- Create: `lib/email/templates/company-invitation.ts`
- Modify: `lib/email/templates/invitation.ts`
- Modify: `lib/email/log.ts` (type `EmailLogKind`)
- Test: `tests/entreprises/email-templates.test.ts`

**Interfaces:**
- Produces:
  - `companyInvitationEmailHtml({ contactNom, raisonSociale, invitationUrl, isResend? }): string`
  - `companyInvitationEmailSubject(raisonSociale: string, isResend?: boolean): string`
  - `InvitationEmailInput.formationTitre` devient `string | null | undefined` ; `invitationEmailSubject(formationTitre: string | null, isResend?)`.
  - `EmailLogKind` += `'company_invitation' | 'employee_account_invitation'`.

- [ ] **Step 1: Écrire les tests**

```ts
// tests/entreprises/email-templates.test.ts
import { describe, it, expect } from 'vitest';
import { companyInvitationEmailHtml, companyInvitationEmailSubject } from '@/lib/email/templates/company-invitation';
import { invitationEmailHtml, invitationEmailSubject } from '@/lib/email/templates/invitation';

describe('company-invitation', () => {
  it('échappe le HTML et contient le lien', () => {
    const html = companyInvitationEmailHtml({ contactNom: 'Jo <b>', raisonSociale: 'A&B', invitationUrl: 'https://x/y' });
    expect(html).toContain('Jo &lt;b&gt;');
    expect(html).toContain('A&amp;B');
    expect(html).toContain('href="https://x/y"');
    expect(html).toContain('Créer mon mot de passe');
  });
  it('variante renvoi', () => {
    const html = companyInvitationEmailHtml({ contactNom: 'Jo', raisonSociale: 'ACME', invitationUrl: 'https://x', isResend: true });
    expect(html).toContain('Définir mon mot de passe');
    expect(companyInvitationEmailSubject('ACME', true)).toBe("[C-KIM] Nouveau lien d'accès — ACME");
    expect(companyInvitationEmailSubject('ACME')).toBe('[C-KIM] Activez l’espace entreprise de ACME');
  });
});

describe('invitation salarié sans formation', () => {
  it('ne mentionne pas de formation', () => {
    const html = invitationEmailHtml({ prenom: 'Léa', nom: 'Roy', entrepriseLabel: 'ACME', formationTitre: null, invitationUrl: 'https://x' });
    expect(html).toContain('ACME vous a créé un accès');
    expect(html).not.toContain('Formation :');
    expect(invitationEmailSubject(null)).toBe('[C-KIM] Créez votre accès');
    expect(invitationEmailSubject(null, true)).toBe("[C-KIM] Nouveau lien d'accès");
  });
  it('garde le comportement avec formation', () => {
    const html = invitationEmailHtml({ prenom: 'Léa', nom: 'Roy', entrepriseLabel: 'ACME', formationTitre: 'SST', invitationUrl: 'https://x' });
    expect(html).toContain('Formation : <strong>SST</strong>');
    expect(invitationEmailSubject('SST')).toBe('[C-KIM] Créez votre accès — SST');
  });
});
```

- [ ] **Step 2: Lancer les tests**

Run: `npx vitest run tests/entreprises/email-templates.test.ts`
Expected: FAIL

- [ ] **Step 3: Créer `company-invitation.ts`**

```ts
// lib/email/templates/company-invitation.ts
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export interface CompanyInvitationEmailInput {
  contactNom: string;
  raisonSociale: string;
  invitationUrl: string;
  /** true si renvoi (compte auth déjà créé) */
  isResend?: boolean;
}

export function companyInvitationEmailHtml(d: CompanyInvitationEmailInput): string {
  const heading = d.isResend ? "Nouveau lien d'accès" : 'Votre espace entreprise C-KIM Formation';
  const intro = d.isResend
    ? "Nous vous renvoyons un lien pour activer l'espace de votre entreprise. Il remplace le précédent (qui n'est plus valable)."
    : `C-KIM Formation a créé l'espace entreprise de <strong>${escapeHtml(d.raisonSociale)}</strong>. Vérifiez vos informations et définissez votre mot de passe pour gérer vos salariés et suivre vos inscriptions aux formations.`;
  const ctaLabel = d.isResend ? 'Définir mon mot de passe' : 'Créer mon mot de passe';

  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#0f172a;">
  <h2 style="color:#1B8FA0;margin:0 0 16px;">${escapeHtml(heading)}</h2>
  <p style="margin:0 0 16px;">Bonjour ${escapeHtml(d.contactNom)},</p>
  <p style="margin:0 0 16px;">${intro}</p>
  <p style="margin:24px 0;">
    <a href="${d.invitationUrl}" style="display:inline-block;padding:12px 24px;background:#1B8FA0;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
      ${escapeHtml(ctaLabel)}
    </a>
  </p>
  <p style="margin:0 0 16px;color:#475569;font-size:13px;">
    Ce lien est strictement personnel et valable plusieurs heures. Vous pourrez ensuite vous connecter avec votre email et ce mot de passe.
  </p>
  <p style="margin:24px 0 0;color:#475569;font-size:12px;">
    Une question ? Écrivez-nous à contact@ckimformation.fr.
  </p>
</div>`;
}

export function companyInvitationEmailSubject(raisonSociale: string, isResend = false): string {
  return isResend
    ? `[C-KIM] Nouveau lien d'accès — ${raisonSociale}`
    : `[C-KIM] Activez l’espace entreprise de ${raisonSociale}`;
}
```

- [ ] **Step 4: Adapter `invitation.ts`**

Dans l'interface : `formationTitre?: string | null;`

Remplacer le calcul de `intro` par :

```ts
  const intro = d.isResend
    ? `Nous vous renvoyons un lien d'accès pour finaliser votre compte. Il remplace le précédent (qui n'est plus valable).`
    : d.formationTitre
      ? `${escapeHtml(d.entrepriseLabel)} vous a inscrit·e à la formation <strong>${escapeHtml(d.formationTitre)}</strong>. Pour pouvoir signer les émargements et compléter les questionnaires le jour de la formation, créez votre accès en cliquant ci-dessous.`
      : `${escapeHtml(d.entrepriseLabel)} vous a créé un accès à l'espace C-KIM Formation. Créez votre mot de passe pour suivre vos formations, signer les émargements et répondre aux questionnaires.`;
```

Remplacer la condition du bloc « Formation : » `${!d.isResend ? \`` par `${!d.isResend && d.formationTitre ? \``.

Remplacer `invitationEmailSubject` par :

```ts
export function invitationEmailSubject(formationTitre: string | null, isResend = false): string {
  const suffix = formationTitre ? ` — ${formationTitre}` : '';
  return isResend
    ? `[C-KIM] Nouveau lien d'accès${suffix}`
    : `[C-KIM] Créez votre accès${suffix}`;
}
```

- [ ] **Step 5: Étendre `EmailLogKind`** dans `lib/email/log.ts` :

```ts
  | 'employee_link_invitation'
  | 'company_invitation'
  | 'employee_account_invitation';
```

- [ ] **Step 6: Vérifier**

Run: `npx vitest run tests/entreprises/email-templates.test.ts && npx tsc --noEmit`
Expected: PASS, aucune erreur de type.

---

### Task 5: Helper `sendEmployeeAccountInvitation` (extrait du flux formateur)

**Files:**
- Create: `lib/employees/account-invitation.ts`
- Modify: `lib/employees/invitations.ts` (export `getEntrepriseLabel`)
- Modify: `app/(app)/formateur/sessions/[id]/stagiaires/actions.ts`
- Test: `tests/entreprises/account-invitation.test.ts`

**Interfaces:**
- Consumes: `invitationEmailHtml` / `invitationEmailSubject` (Task 4), `sendAndLog`, `findProfileByEmail`, `sendEmployeeLinkInvitation`, `evaluateEmployeeLink`.
- Produces:
  - `getEntrepriseLabel(employerProfileId: string): Promise<string>` (dans `lib/employees/invitations.ts`)
  - `type AccountInvitationResult = { ok: true; resent: boolean; mode: 'create' | 'recovery' | 'link' } | { ok: false; error: string }`
  - `sendEmployeeAccountInvitation(employeeId: string, actorId: string, opts?: { formationTitre?: string | null }): Promise<AccountInvitationResult>`

- [ ] **Step 1: Écrire les tests**

```ts
// tests/entreprises/account-invitation.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  employee: null as null | Record<string, unknown>,
  generateLink: vi.fn(),
  sendAndLog: vi.fn(async () => ({ ok: true })),
  findProfileByEmail: vi.fn(async () => null as unknown),
  sendEmployeeLinkInvitation: vi.fn(async () => ({ ok: true, resent: false })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: m.employee }) }) }) }),
    auth: { admin: { generateLink: m.generateLink } },
  }),
}));
vi.mock('@/lib/email/log', () => ({ sendAndLog: m.sendAndLog }));
vi.mock('@/lib/employees/invitations', () => ({
  findProfileByEmail: m.findProfileByEmail,
  sendEmployeeLinkInvitation: m.sendEmployeeLinkInvitation,
  getEntrepriseLabel: async () => 'ACME',
}));

import { sendEmployeeAccountInvitation } from '@/lib/employees/account-invitation';

const EMP = { id: 'e1', prenom: 'Léa', nom: 'Roy', email: 'lea@x.fr', profile_id: null, employer_profile_id: 'c1' };

beforeEach(() => {
  vi.clearAllMocks();
  m.employee = { ...EMP };
  m.findProfileByEmail.mockResolvedValue(null);
  m.generateLink.mockResolvedValue({ data: { properties: { action_link: 'https://link' } }, error: null });
});

describe('sendEmployeeAccountInvitation', () => {
  it('crée le compte (invite) avec employee_id et envoie un mail sans formation', async () => {
    const res = await sendEmployeeAccountInvitation('e1', 'admin1');
    expect(res).toEqual({ ok: true, resent: false, mode: 'create' });
    const arg = m.generateLink.mock.calls[0][0];
    expect(arg.type).toBe('invite');
    expect(arg.options.data).toMatchObject({ employee_id: 'e1', employer_profile_id: 'c1', account_type: 'particulier' });
    expect(m.sendAndLog).toHaveBeenCalledWith(expect.objectContaining({ kind: 'employee_account_invitation', to: 'lea@x.fr', subject: '[C-KIM] Créez votre accès' }));
  });

  it('bascule en invitation de rattachement si un compte existe déjà', async () => {
    m.findProfileByEmail.mockResolvedValue({ id: 'p9', role: 'stagiaire', account_type: 'particulier', email: 'lea@x.fr', employer_profile_id: null, full_name: 'Léa' });
    const res = await sendEmployeeAccountInvitation('e1', 'admin1');
    expect(res).toEqual({ ok: true, resent: false, mode: 'link' });
    expect(m.generateLink).not.toHaveBeenCalled();
  });

  it('renvoie un lien recovery si la fiche a déjà un profil', async () => {
    m.employee = { ...EMP, profile_id: 'p1' };
    const res = await sendEmployeeAccountInvitation('e1', 'admin1', { formationTitre: 'SST' });
    expect(res).toEqual({ ok: true, resent: true, mode: 'recovery' });
    expect(m.generateLink.mock.calls[0][0].type).toBe('recovery');
  });

  it('erreur si le mail échoue', async () => {
    m.sendAndLog.mockResolvedValueOnce({ ok: false, error: 'boom' } as never);
    const res = await sendEmployeeAccountInvitation('e1', 'admin1');
    expect(res.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer les tests**

Run: `npx vitest run tests/entreprises/account-invitation.test.ts`
Expected: FAIL (module introuvable)

- [ ] **Step 3: Exporter `getEntrepriseLabel`** dans `lib/employees/invitations.ts` : renommer la fonction privée `entrepriseLabel` en `export async function getEntrepriseLabel(employerProfileId: string): Promise<string>` et remplacer son unique appel (`const label = await entrepriseLabel(emp.employer_profile_id);`) par `const label = await getEntrepriseLabel(emp.employer_profile_id);`.

- [ ] **Step 4: Créer le helper**

```ts
// lib/employees/account-invitation.ts
import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendAndLog } from '@/lib/email/log';
import { invitationEmailHtml, invitationEmailSubject } from '@/lib/email/templates/invitation';
import {
  findProfileByEmail,
  getEntrepriseLabel,
  sendEmployeeLinkInvitation,
} from '@/lib/employees/invitations';
import { evaluateEmployeeLink } from '@/lib/employees/linkability';

export type AccountInvitationResult =
  | { ok: true; resent: boolean; mode: 'create' | 'recovery' | 'link' }
  | { ok: false; error: string };

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

/**
 * Invite un salarié à créer (ou redéfinir) son accès.
 * - fiche sans profil + email déjà connu → invitation de rattachement (jamais de second compte) ;
 * - fiche sans profil → création de l'utilisateur auth (generateLink invite) + mail branded ;
 * - fiche avec profil → lien de récupération (définir le mot de passe).
 */
export async function sendEmployeeAccountInvitation(
  employeeId: string,
  actorId: string,
  opts: { formationTitre?: string | null } = {},
): Promise<AccountInvitationResult> {
  const admin = createAdminClient();
  const { data: emp } = await admin
    .from('employees')
    .select('id, prenom, nom, email, profile_id, employer_profile_id')
    .eq('id', employeeId)
    .single();
  if (!emp) return { ok: false, error: 'Salarié introuvable.' };

  async function linkInstead(): Promise<AccountInvitationResult> {
    const sent = await sendEmployeeLinkInvitation(emp!.id, actorId);
    if (!sent.ok) return { ok: false, error: sent.error };
    return { ok: true, resent: sent.resent, mode: 'link' };
  }

  if (!emp.profile_id) {
    const existing = await findProfileByEmail(emp.email);
    if (existing) {
      const eligible = evaluateEmployeeLink(existing, emp.employer_profile_id);
      if (!eligible.ok) return { ok: false, error: eligible.message };
      return linkInstead();
    }
  }

  const isResend = !!emp.profile_id;
  const formationTitre = opts.formationTitre ?? null;
  const redirect = `${siteUrl()}/callback?redirect=/stagiaire/parcours`;
  let actionLink: string;

  if (isResend) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: emp.email,
      options: { redirectTo: redirect },
    });
    if (error || !data?.properties?.action_link) {
      return { ok: false, error: error?.message ?? "Impossible de générer un nouveau lien d'invitation." };
    }
    actionLink = data.properties.action_link;
  } else {
    // generateLink('invite') crée l'utilisateur sans envoyer d'email Supabase.
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'invite',
      email: emp.email,
      options: {
        data: {
          role: 'stagiaire',
          account_type: 'particulier',
          full_name: `${emp.prenom} ${emp.nom}`.trim(),
          employer_profile_id: emp.employer_profile_id,
          employee_id: emp.id,
        },
        redirectTo: redirect,
      },
    });
    if (error || !data?.properties?.action_link) {
      if (/already (been )?registered|already exists|user already/i.test(error?.message ?? '')) {
        return linkInstead();
      }
      return { ok: false, error: error?.message ?? "L'invitation n'a pas pu être créée." };
    }
    actionLink = data.properties.action_link;
  }

  const entrepriseLabel = await getEntrepriseLabel(emp.employer_profile_id);
  const sent = await sendAndLog({
    kind: 'employee_account_invitation',
    to: emp.email,
    toProfileId: emp.profile_id,
    subject: invitationEmailSubject(formationTitre, isResend),
    html: invitationEmailHtml({
      prenom: emp.prenom,
      nom: emp.nom,
      entrepriseLabel,
      formationTitre,
      invitationUrl: actionLink,
      isResend,
    }),
    refTable: 'employees',
    refId: emp.id,
    isReminder: isResend,
    metadata: { entreprise: entrepriseLabel, formation: formationTitre },
  });
  if (!sent.ok) {
    return { ok: false, error: "Le lien a été généré mais l'email n'a pas pu être envoyé." };
  }
  return { ok: true, resent: isResend, mode: isResend ? 'recovery' : 'create' };
}
```

- [ ] **Step 5: Lancer les tests**

Run: `npx vitest run tests/entreprises/account-invitation.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Brancher le flux formateur**

Dans `app/(app)/formateur/sessions/[id]/stagiaires/actions.ts`, remplacer tout le corps de `sendInvitationToEmployee` par :

```ts
export async function sendInvitationToEmployee(
  sessionId: string,
  employeeId: string
): Promise<{ ok: true; resent: boolean; mode: 'create' | 'recovery' | 'link' } | { ok: false; error: string }> {
  const actor = await requireFormateurOfSession(sessionId);
  const admin = createAdminClient();

  const { data: sess } = await admin
    .from('sessions')
    .select('formation:formations(titre)')
    .eq('id', sessionId)
    .single();
  const formation = sess && (Array.isArray(sess.formation) ? sess.formation[0] : sess.formation);

  const result = await sendEmployeeAccountInvitation(employeeId, actor.id, {
    formationTitre: formation?.titre ?? 'Formation',
  });
  if (!result.ok) return result;

  revalidatePath(`/formateur/sessions/${sessionId}/stagiaires`);
  return result;
}
```

Ajouter l'import `import { sendEmployeeAccountInvitation } from '@/lib/employees/account-invitation';` et supprimer les imports devenus inutiles (`resend`, `EMAIL_FROM`, `invitationEmailHtml`, `invitationEmailSubject`, `findProfileByEmail`, `sendEmployeeLinkInvitation`, `evaluateEmployeeLink`, ainsi que `siteUrl()` si plus utilisé — vérifier avec `grep -n "siteUrl\|findProfileByEmail\|evaluateEmployeeLink\|sendEmployeeLinkInvitation" <fichier>`).

- [ ] **Step 7: Vérifier**

Run: `npx tsc --noEmit && npm run lint && npx vitest run`
Expected: aucune erreur ; tous les tests PASS.

---

### Task 6: Logique pure entreprises (conversion, inscription, statuts, sessions, recherche) + `todayIsoParis` + `employeeId` sur les occupants

**Files:**
- Create: `lib/companies/conversion.ts`, `lib/companies/enrollment.ts`, `lib/companies/status.ts`, `lib/companies/sessions.ts`, `lib/companies/search.ts`
- Modify: `lib/date.ts`, `lib/sessions/stagiaire-search.ts`, `lib/sessions/search-stagiaires-query.ts`
- Test: `tests/entreprises/companies-logic.test.ts`, `tests/date.test.ts`

**Interfaces:**
- Produces:
  - `canConvertToCompany(p: { role: string; account_type: string | null; employer_profile_id: string | null }, linkedEmployeeCount: number): { ok: true } | { ok: false; reason: string }`
  - `interface EnrollableSession { id: string; statut: string; visibility: 'public' | 'reserved'; reserved_company_id: string | null; firstDate: string | null }`
  - `isSessionEligibleForCompany(s: EnrollableSession, companyId: string, todayIso: string): boolean`
  - `partitionEmployeesByOccupancy(employees: { id: string; profile_id: string | null }[], occupants: SessionSearchOccupant[]): { enrollable: string[]; alreadyEnrolled: string[] }`
  - `type EmployeeAccountStatus = 'actif' | 'invite' | 'rattachement' | 'sans_acces'`, `employeeAccountStatus({ profileId, signedIn, pendingLink }): EmployeeAccountStatus`, `EMPLOYEE_STATUS_LABEL: Record<EmployeeAccountStatus, string>`
  - `firstAndLastDate(creneaux: { date: string; ordre: number }[] | null): { firstDate: string | null; lastDate: string | null }`
  - `interface RawCompanySession { id; statut; visibility; reserved_company_id; formation: { titre: string } | { titre: string }[] | null; creneaux: { date: string; ordre: number }[] | null }`
  - `interface CompanySessionRow { id; formationTitre; firstDate; lastDate; statut; reserved: boolean; participants: string[] }`
  - `buildCompanySessionRows(sessions: RawCompanySession[], participantsBySession: Map<string, string[]>): CompanySessionRow[]` (tri date de début décroissante, sans date en dernier)
  - `companyMatchesQuery(row: { raison_sociale: string; siret: string | null; contact: string; email: string }, query: string): boolean`
  - `todayIsoParis(now?: Date): string` (`YYYY-MM-DD`, Europe/Paris)
  - `SessionSearchOccupant.employeeId?: string | null`

- [ ] **Step 1: Écrire les tests**

```ts
// tests/entreprises/companies-logic.test.ts
import { describe, it, expect } from 'vitest';
import { canConvertToCompany } from '@/lib/companies/conversion';
import { isSessionEligibleForCompany, partitionEmployeesByOccupancy } from '@/lib/companies/enrollment';
import { employeeAccountStatus } from '@/lib/companies/status';
import { buildCompanySessionRows, firstAndLastDate } from '@/lib/companies/sessions';
import { companyMatchesQuery } from '@/lib/companies/search';

describe('canConvertToCompany', () => {
  const base = { role: 'stagiaire', account_type: 'particulier', employer_profile_id: null };
  it('autorise un particulier indépendant', () => {
    expect(canConvertToCompany(base, 0)).toEqual({ ok: true });
  });
  it('autorise un stagiaire sans type', () => {
    expect(canConvertToCompany({ ...base, account_type: null }, 0).ok).toBe(true);
  });
  it('refuse un compte déjà entreprise', () => {
    expect(canConvertToCompany({ ...base, account_type: 'entreprise' }, 0).ok).toBe(false);
  });
  it('refuse un salarié rattaché (employer_profile_id)', () => {
    expect(canConvertToCompany({ ...base, employer_profile_id: 'c1' }, 0).ok).toBe(false);
  });
  it('refuse un profil lié à une fiche salarié', () => {
    expect(canConvertToCompany(base, 1).ok).toBe(false);
  });
  it('refuse formateur et admin', () => {
    expect(canConvertToCompany({ ...base, role: 'formateur' }, 0).ok).toBe(false);
    expect(canConvertToCompany({ ...base, role: 'admin' }, 0).ok).toBe(false);
  });
});

describe('isSessionEligibleForCompany', () => {
  const today = '2026-09-28';
  const s = { id: 's', statut: 'published', visibility: 'public' as const, reserved_company_id: null, firstDate: '2026-10-05' };
  it('session publique à venir', () => expect(isSessionEligibleForCompany(s, 'c1', today)).toBe(true));
  it('session du jour', () => expect(isSessionEligibleForCompany({ ...s, firstDate: today }, 'c1', today)).toBe(true));
  it('réservée à cette entreprise', () =>
    expect(isSessionEligibleForCompany({ ...s, visibility: 'reserved', reserved_company_id: 'c1' }, 'c1', today)).toBe(true));
  it('réservée à une autre entreprise', () =>
    expect(isSessionEligibleForCompany({ ...s, visibility: 'reserved', reserved_company_id: 'c2' }, 'c1', today)).toBe(false));
  it('passée', () => expect(isSessionEligibleForCompany({ ...s, firstDate: '2026-09-01' }, 'c1', today)).toBe(false));
  it('non publiée', () => expect(isSessionEligibleForCompany({ ...s, statut: 'draft' }, 'c1', today)).toBe(false));
  it('sans créneau', () => expect(isSessionEligibleForCompany({ ...s, firstDate: null }, 'c1', today)).toBe(false));
});

describe('partitionEmployeesByOccupancy', () => {
  const employees = [
    { id: 'e1', profile_id: null },
    { id: 'e2', profile_id: 'p2' },
    { id: 'e3', profile_id: null },
  ];
  it('exclut les salariés déjà inscrits par fiche ou par profil lié', () => {
    const occupants = [
      { profileId: null, profileEmail: null, employeeProfileId: null, employeeEmail: 'a@x', employeeId: 'e1' },
      { profileId: 'p2', profileEmail: null, employeeProfileId: null, employeeEmail: null, employeeId: null },
    ];
    expect(partitionEmployeesByOccupancy(employees, occupants)).toEqual({ enrollable: ['e3'], alreadyEnrolled: ['e1', 'e2'] });
  });
  it('tout le monde est inscriptible sur une session vide', () => {
    expect(partitionEmployeesByOccupancy(employees, []).enrollable).toEqual(['e1', 'e2', 'e3']);
  });
});

describe('employeeAccountStatus', () => {
  it('actif', () => expect(employeeAccountStatus({ profileId: 'p', signedIn: true, pendingLink: false })).toBe('actif'));
  it('invité', () => expect(employeeAccountStatus({ profileId: 'p', signedIn: false, pendingLink: false })).toBe('invite'));
  it('rattachement en attente', () => expect(employeeAccountStatus({ profileId: null, signedIn: false, pendingLink: true })).toBe('rattachement'));
  it('sans accès', () => expect(employeeAccountStatus({ profileId: null, signedIn: false, pendingLink: false })).toBe('sans_acces'));
});

describe('sessions entreprise', () => {
  it('firstAndLastDate trie par ordre', () => {
    expect(firstAndLastDate([{ date: '2026-10-02', ordre: 2 }, { date: '2026-10-01', ordre: 1 }]))
      .toEqual({ firstDate: '2026-10-01', lastDate: '2026-10-02' });
    expect(firstAndLastDate(null)).toEqual({ firstDate: null, lastDate: null });
  });
  it('buildCompanySessionRows trie par date décroissante, sans date en dernier', () => {
    const rows = buildCompanySessionRows(
      [
        { id: 'a', statut: 'published', visibility: 'public', reserved_company_id: null, formation: { titre: 'A' }, creneaux: [{ date: '2026-01-01', ordre: 1 }] },
        { id: 'b', statut: 'draft', visibility: 'reserved', reserved_company_id: 'c1', formation: [{ titre: 'B' }], creneaux: [] },
        { id: 'c', statut: 'published', visibility: 'public', reserved_company_id: null, formation: null, creneaux: [{ date: '2026-06-01', ordre: 1 }] },
      ],
      new Map([['a', ['Léa Roy']]]),
    );
    expect(rows.map((r) => r.id)).toEqual(['c', 'a', 'b']);
    expect(rows[1].participants).toEqual(['Léa Roy']);
    expect(rows[2]).toMatchObject({ formationTitre: 'B', reserved: true, participants: [] });
    expect(rows[0].formationTitre).toBe('—');
  });
});

describe('companyMatchesQuery', () => {
  const row = { raison_sociale: 'Société Générale BTP', siret: '123 456', contact: 'Jeanne Martin', email: 'rh@sg.fr' };
  it('insensible aux accents et à l’ordre', () => {
    expect(companyMatchesQuery(row, 'societe btp')).toBe(true);
    expect(companyMatchesQuery(row, 'martin jeanne')).toBe(true);
  });
  it('par email et siret', () => {
    expect(companyMatchesQuery(row, 'rh@sg')).toBe(true);
    expect(companyMatchesQuery(row, '123')).toBe(true);
  });
  it('requête vide = tout', () => expect(companyMatchesQuery(row, '  ')).toBe(true));
  it('pas de correspondance', () => expect(companyMatchesQuery(row, 'carrefour')).toBe(false));
});
```

Ajouter dans `tests/date.test.ts` (dans un nouveau `describe`, importer `todayIsoParis` depuis `@/lib/date`) :

```ts
describe('todayIsoParis', () => {
  it('donne la date du jour à Paris (UTC+2 l’été)', () => {
    expect(todayIsoParis(new Date('2026-09-27T22:30:00Z'))).toBe('2026-09-28');
    expect(todayIsoParis(new Date('2026-09-27T21:30:00Z'))).toBe('2026-09-27');
  });
});
```

- [ ] **Step 2: Lancer les tests**

Run: `npx vitest run tests/entreprises/companies-logic.test.ts tests/date.test.ts`
Expected: FAIL (modules / export manquants)

- [ ] **Step 3: `todayIsoParis`** — ajouter dans `lib/date.ts` (après les formateurs existants) :

```ts
// 'en-CA' produit le format ISO YYYY-MM-DD ; utilisé uniquement pour comparer des dates, jamais affiché.
const isoDayFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric', month: '2-digit', day: '2-digit',
});

/** Date du jour à Paris au format YYYY-MM-DD (comparable aux colonnes `date`). */
export function todayIsoParis(now: Date = new Date()): string {
  return isoDayFmt.format(now);
}
```

- [ ] **Step 4: `employeeId` sur les occupants**

Dans `lib/sessions/stagiaire-search.ts`, interface `SessionSearchOccupant`, ajouter :

```ts
  /** Fiche salarié inscrite (null si participant par profil). */
  employeeId?: string | null;
```

Dans `lib/sessions/search-stagiaires-query.ts`, `loadSessionOccupants`, dans l'objet retourné par le `map` final, ajouter `employeeId: row.employee_id,`.

- [ ] **Step 5: Implémenter les modules**

```ts
// lib/companies/conversion.ts
export interface ConvertibleProfile {
  role: string;
  account_type: string | null;
  employer_profile_id: string | null;
}

/** Un compte ne peut devenir entreprise que s'il s'agit d'un particulier indépendant. */
export function canConvertToCompany(
  p: ConvertibleProfile,
  linkedEmployeeCount: number,
): { ok: true } | { ok: false; reason: string } {
  if (p.role !== 'stagiaire') return { ok: false, reason: 'Seul un compte stagiaire peut être transformé.' };
  if (p.account_type === 'entreprise') return { ok: false, reason: 'Ce compte est déjà un compte entreprise.' };
  if (p.employer_profile_id || linkedEmployeeCount > 0) {
    return { ok: false, reason: 'Ce compte est rattaché comme salarié à une entreprise.' };
  }
  return { ok: true };
}
```

```ts
// lib/companies/enrollment.ts
import type { SessionSearchOccupant } from '@/lib/sessions/stagiaire-search';

export interface EnrollableSession {
  id: string;
  statut: string;
  visibility: 'public' | 'reserved';
  reserved_company_id: string | null;
  firstDate: string | null;
}

/** Publiée, à venir (1er créneau ≥ aujourd'hui), publique ou réservée à cette entreprise. */
export function isSessionEligibleForCompany(s: EnrollableSession, companyId: string, todayIso: string): boolean {
  if (s.statut !== 'published') return false;
  if (!s.firstDate || s.firstDate < todayIso) return false;
  if (s.visibility === 'public') return true;
  return s.reserved_company_id === companyId;
}

export function partitionEmployeesByOccupancy(
  employees: { id: string; profile_id: string | null }[],
  occupants: SessionSearchOccupant[],
): { enrollable: string[]; alreadyEnrolled: string[] } {
  const employeeIds = new Set<string>();
  const profileIds = new Set<string>();
  for (const o of occupants) {
    if (o.employeeId) employeeIds.add(o.employeeId);
    if (o.profileId) profileIds.add(o.profileId);
    if (o.employeeProfileId) profileIds.add(o.employeeProfileId);
  }
  const enrollable: string[] = [];
  const alreadyEnrolled: string[] = [];
  for (const e of employees) {
    const taken = employeeIds.has(e.id) || (!!e.profile_id && profileIds.has(e.profile_id));
    (taken ? alreadyEnrolled : enrollable).push(e.id);
  }
  return { enrollable, alreadyEnrolled };
}
```

```ts
// lib/companies/status.ts
export type EmployeeAccountStatus = 'actif' | 'invite' | 'rattachement' | 'sans_acces';

export const EMPLOYEE_STATUS_LABEL: Record<EmployeeAccountStatus, string> = {
  actif: 'Compte actif',
  invite: 'Invité',
  rattachement: 'Rattachement en attente',
  sans_acces: 'Sans accès',
};

export function employeeAccountStatus(e: {
  profileId: string | null;
  signedIn: boolean;
  pendingLink: boolean;
}): EmployeeAccountStatus {
  if (e.profileId) return e.signedIn ? 'actif' : 'invite';
  return e.pendingLink ? 'rattachement' : 'sans_acces';
}
```

```ts
// lib/companies/sessions.ts
export function firstAndLastDate(
  creneaux: { date: string; ordre: number }[] | null,
): { firstDate: string | null; lastDate: string | null } {
  const sorted = (creneaux ?? []).slice().sort((a, b) => a.ordre - b.ordre);
  return { firstDate: sorted[0]?.date ?? null, lastDate: sorted[sorted.length - 1]?.date ?? null };
}

export interface RawCompanySession {
  id: string;
  statut: string;
  visibility: 'public' | 'reserved';
  reserved_company_id: string | null;
  formation: { titre: string } | { titre: string }[] | null;
  creneaux: { date: string; ordre: number }[] | null;
}

export interface CompanySessionRow {
  id: string;
  formationTitre: string;
  firstDate: string | null;
  lastDate: string | null;
  statut: string;
  reserved: boolean;
  participants: string[];
}

export function buildCompanySessionRows(
  sessions: RawCompanySession[],
  participantsBySession: Map<string, string[]>,
): CompanySessionRow[] {
  const rows = sessions.map((s) => {
    const formation = Array.isArray(s.formation) ? s.formation[0] : s.formation;
    return {
      id: s.id,
      formationTitre: formation?.titre ?? '—',
      ...firstAndLastDate(s.creneaux),
      statut: s.statut,
      reserved: s.visibility === 'reserved',
      participants: participantsBySession.get(s.id) ?? [],
    };
  });
  return rows.sort((a, b) => {
    if (!a.firstDate) return b.firstDate ? 1 : 0;
    if (!b.firstDate) return -1;
    return b.firstDate.localeCompare(a.firstDate);
  });
}
```

```ts
// lib/companies/search.ts
import { normalizeSearchText } from '@/lib/sessions/stagiaire-search';

/** Raison sociale, SIRET, contact ou email — accents et ordre des mots indifférents. */
export function companyMatchesQuery(
  row: { raison_sociale: string; siret: string | null; contact: string; email: string },
  query: string,
): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;
  const hay = normalizeSearchText(`${row.raison_sociale} ${row.siret ?? ''} ${row.contact} ${row.email}`);
  return q.split(' ').every((token) => hay.includes(token));
}
```

- [ ] **Step 6: Lancer les tests**

Run: `npx vitest run tests/entreprises/companies-logic.test.ts tests/date.test.ts tests/stagiaire-search.test.ts`
Expected: PASS

---

### Task 7: Menu + page liste `/admin/entreprises`

**Files:**
- Create: `lib/companies/auth-status.ts`, `lib/companies/queries.ts` (fonction `listCompanies`), `app/(app)/admin/entreprises/page.tsx`
- Modify: `components/app/AppShell.tsx`, `app/(app)/admin/stagiaires/SearchInput.tsx`

**Interfaces:**
- Consumes: `companyMatchesQuery` (Task 6), `formatDate`.
- Produces:
  - `loadSignedInIds(admin: AdminClient, ids: string[]): Promise<Set<string>>`
  - `type AdminClient = ReturnType<typeof createAdminClient>` (exporté par `lib/companies/queries.ts`)
  - `interface CompanyListRow { id; raison_sociale; siret: string | null; contact: string; email: string; phone: string | null; employeeCount: number; active: boolean; created_at: string }`
  - `listCompanies(admin: AdminClient): Promise<CompanyListRow[]>` (tri raison sociale)
  - `SearchInput({ initial, basePath?, placeholder? })`

- [ ] **Step 1: `auth-status.ts`**

```ts
// lib/companies/auth-status.ts
import 'server-only';
import type { createAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

/** Ids (parmi `ids`) dont l'utilisateur auth s'est déjà connecté au moins une fois. */
export async function loadSignedInIds(admin: AdminClient, ids: string[]): Promise<Set<string>> {
  const wanted = new Set(ids);
  const signedIn = new Set<string>();
  if (wanted.size === 0) return signedIn;

  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('[companies] listUsers failed', error);
      break;
    }
    for (const u of data.users) {
      if (wanted.has(u.id) && u.last_sign_in_at) signedIn.add(u.id);
    }
    if (data.users.length < perPage) break;
  }
  return signedIn;
}
```

- [ ] **Step 2: `queries.ts` — `listCompanies`**

```ts
// lib/companies/queries.ts
import 'server-only';
import type { createAdminClient } from '@/lib/supabase/admin';
import { loadSignedInIds } from './auth-status';

export type AdminClient = ReturnType<typeof createAdminClient>;

type One<T> = T | T[] | null;
function one<T>(v: One<T>): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export interface CompanyListRow {
  id: string;
  raison_sociale: string;
  siret: string | null;
  contact: string;
  email: string;
  phone: string | null;
  employeeCount: number;
  active: boolean;
  created_at: string;
}

export async function listCompanies(admin: AdminClient): Promise<CompanyListRow[]> {
  const { data: profiles, error } = await admin
    .from('profiles')
    .select(`
      id, full_name, email, phone, created_at,
      company:company_details!company_details_profile_id_fkey(raison_sociale, siret)
    `)
    .eq('role', 'stagiaire')
    .eq('account_type', 'entreprise');
  if (error) throw new Error(error.message);

  const ids = (profiles ?? []).map((p) => p.id);
  const [{ data: emps }, signedIn] = await Promise.all([
    ids.length === 0
      ? Promise.resolve({ data: [] as { employer_profile_id: string }[] })
      : admin.from('employees').select('employer_profile_id').in('employer_profile_id', ids),
    loadSignedInIds(admin, ids),
  ]);
  const counts = new Map<string, number>();
  for (const e of emps ?? []) counts.set(e.employer_profile_id, (counts.get(e.employer_profile_id) ?? 0) + 1);

  return (profiles ?? [])
    .map((p) => {
      const c = one(p.company as One<{ raison_sociale: string; siret: string | null }>);
      return {
        id: p.id,
        raison_sociale: c?.raison_sociale || p.full_name || '—',
        siret: c?.siret ?? null,
        contact: p.full_name,
        email: p.email,
        phone: p.phone,
        employeeCount: counts.get(p.id) ?? 0,
        active: signedIn.has(p.id),
        created_at: p.created_at,
      };
    })
    .sort((a, b) => a.raison_sociale.localeCompare(b.raison_sociale, 'fr', { sensitivity: 'base' }));
}
```

- [ ] **Step 3: Rendre `SearchInput` réutilisable**

Dans `app/(app)/admin/stagiaires/SearchInput.tsx` :
- signature : `export function SearchInput({ initial, basePath = '/admin/stagiaires', placeholder = 'Recherche par nom, prénom, email ou téléphone…' }: { initial: string; basePath?: string; placeholder?: string })`
- `router.replace(\`${basePath}${qs ? \`?${qs}\` : ''}\`);`
- `placeholder={placeholder}`

- [ ] **Step 4: Menu** — dans `components/app/AppShell.tsx`, `NAV_ADMIN`, après la ligne Stagiaires :

```ts
  { href: '/admin/entreprises', label: 'Entreprises' },
```

- [ ] **Step 5: Page liste**

```tsx
// app/(app)/admin/entreprises/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { listCompanies } from '@/lib/companies/queries';
import { companyMatchesQuery } from '@/lib/companies/search';
import { formatDate } from '@/lib/date';
import { SearchInput } from '../stagiaires/SearchInput';

export const dynamic = 'force-dynamic';

export default async function AdminEntreprisesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const me = await getCurrentProfile();
  if (!me || me.role !== 'admin') redirect('/login');

  const q = ((await searchParams).q ?? '').trim();
  const all = await listCompanies(createAdminClient());
  const rows = all.filter((r) => companyMatchesQuery(r, q));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Entreprises"
        description="Comptes entreprise de l'établissement : informations, salariés et sessions."
        actions={<ButtonLink href="/admin/entreprises/nouvelle">+ Ajouter une entreprise</ButtonLink>}
      />

      <SearchInput initial={q} basePath="/admin/entreprises" placeholder="Raison sociale, SIRET, contact ou email…" />

      <div className="text-xs text-dark/60">
        {rows.length} entreprise{rows.length > 1 ? 's' : ''}
        {q && <> pour <strong>« {q} »</strong></>}
      </div>

      <div className="bg-white rounded-lg border border-dark/10 overflow-x-auto">
        {rows.length === 0 ? (
          <p className="p-8 text-sm text-dark/60 text-center">
            {q ? 'Aucune entreprise ne correspond à votre recherche.' : 'Aucune entreprise pour le moment.'}
          </p>
        ) : (
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-3 px-4">Raison sociale</th>
                <th className="text-left py-3 px-4">SIRET</th>
                <th className="text-left py-3 px-4">Contact</th>
                <th className="text-right py-3 px-4">Salariés</th>
                <th className="text-left py-3 px-4">Compte</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {rows.map((r) => {
                const href = `/admin/entreprises/${r.id}`;
                return (
                  <tr key={r.id} className="hover:bg-light/50">
                    <td className="py-3 px-4">
                      <Link href={href} className="block">
                        <p className="font-medium">{r.raison_sociale}</p>
                        <p className="text-xs text-dark/50">Créée le {formatDate(r.created_at)}</p>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-dark/70">{r.siret || <span className="text-dark/40">—</span>}</td>
                    <td className="py-3 px-4">
                      <p>{r.contact || '—'}</p>
                      <p className="text-xs text-dark/60">{r.email}</p>
                    </td>
                    <td className="py-3 px-4 text-right">{r.employeeCount}</td>
                    <td className="py-3 px-4">
                      {r.active ? (
                        <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-teal/10 text-teal">Actif</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-orange/10 text-orange">Invitation en attente</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={href} className="text-xs uppercase tracking-[0.15em] text-teal hover:underline whitespace-nowrap">Voir →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Vérifier**

Run: `npx tsc --noEmit && npm run lint`
Expected: aucune erreur.

Manuel (`npm run dev`, connecté admin) : « Entreprises » apparaît dans le menu ; `/admin/entreprises` liste les comptes entreprise existants ; la recherche « societe » trouve « Société… » ; `/admin/stagiaires` fonctionne toujours (recherche inchangée).

---

### Task 8: Création d'entreprise par l'admin + renvoi de l'invitation

**Files:**
- Create: `lib/companies/invitation.ts`, `app/(app)/admin/entreprises/actions.ts`, `app/(app)/admin/entreprises/nouvelle/page.tsx`, `app/(app)/admin/entreprises/nouvelle/NewCompanyForm.tsx`
- Test: `tests/entreprises/company-invitation.test.ts`

**Interfaces:**
- Consumes: `normalizeCompanyInput`, `validateCompanyInput`, `toCompanyAuthMetadata` (Task 2) ; `companyInvitationEmailHtml/Subject` (Task 4) ; `canConvertToCompany` (Task 6) ; `findProfileByEmail` ; `sendAndLog` ; `CompanyFormFields` (Task 3).
- Produces:
  - `type InviteCompanyResult = { ok: true; id: string; emailSent: boolean } | { ok: false; error: string; convertibleProfileId?: string }`
  - `inviteNewCompany(raw: CompanyInput): Promise<InviteCompanyResult>`
  - `resendCompanyInvitationLink(companyId: string): Promise<{ ok: true } | { ok: false; error: string }>`
  - Server actions (`app/(app)/admin/entreprises/actions.ts`) : `createCompanyByAdmin(input: CompanyInput): Promise<InviteCompanyResult>`, `resendCompanyInvitation(companyId: string): Promise<{ ok: true } | { ok: false; error: string }>`, et `requireAdmin()` interne (réutilisé Tasks 10–11).

- [ ] **Step 1: Écrire les tests**

```ts
// tests/entreprises/company-invitation.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  generateLink: vi.fn(),
  getUserById: vi.fn(),
  sendAndLog: vi.fn(async () => ({ ok: true })),
  findProfileByEmail: vi.fn(async () => null as unknown),
  linkedCount: 0,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: async () => ({ count: m.linkedCount }) }),
    }),
    auth: { admin: { generateLink: m.generateLink, getUserById: m.getUserById } },
  }),
}));
vi.mock('@/lib/email/log', () => ({ sendAndLog: m.sendAndLog }));
vi.mock('@/lib/employees/invitations', () => ({ findProfileByEmail: m.findProfileByEmail }));

import { inviteNewCompany } from '@/lib/companies/invitation';

const INPUT = {
  raison_sociale: 'ACME', siret: '', tva_intra: '', secteur_activite: '',
  addr_rue: '1 rue A', addr_cp: '75001', addr_ville: 'Paris',
  full_name: 'Jeanne Martin', contact_fonction: 'DRH', email: 'RH@acme.fr', phone: '01',
};

beforeEach(() => {
  vi.clearAllMocks();
  m.linkedCount = 0;
  m.findProfileByEmail.mockResolvedValue(null);
  m.generateLink.mockResolvedValue({ data: { user: { id: 'new-id' }, properties: { action_link: 'https://link' } }, error: null });
});

describe('inviteNewCompany', () => {
  it('refuse une saisie invalide sans rien créer', async () => {
    const res = await inviteNewCompany({ ...INPUT, raison_sociale: '' });
    expect(res).toEqual({ ok: false, error: 'La raison sociale est obligatoire.' });
    expect(m.generateLink).not.toHaveBeenCalled();
  });

  it('crée le compte avec les métadonnées entreprise et envoie le mail', async () => {
    const res = await inviteNewCompany(INPUT);
    expect(res).toEqual({ ok: true, id: 'new-id', emailSent: true });
    const arg = m.generateLink.mock.calls[0][0];
    expect(arg).toMatchObject({ type: 'invite', email: 'rh@acme.fr' });
    expect(arg.options.data).toMatchObject({ account_type: 'entreprise', raison_sociale: 'ACME' });
    expect(m.sendAndLog).toHaveBeenCalledWith(expect.objectContaining({ kind: 'company_invitation', to: 'rh@acme.fr', toProfileId: 'new-id' }));
  });

  it('refuse un email déjà utilisé et propose la conversion si particulier', async () => {
    m.findProfileByEmail.mockResolvedValue({ id: 'p1', role: 'stagiaire', account_type: 'particulier', employer_profile_id: null, email: 'rh@acme.fr', full_name: 'X' });
    const res = await inviteNewCompany(INPUT);
    expect(res).toMatchObject({ ok: false, convertibleProfileId: 'p1' });
    expect(m.generateLink).not.toHaveBeenCalled();
  });

  it('refuse un email de compte non convertible sans proposer de conversion', async () => {
    m.findProfileByEmail.mockResolvedValue({ id: 'p2', role: 'formateur', account_type: null, employer_profile_id: null, email: 'rh@acme.fr', full_name: 'X' });
    const res = await inviteNewCompany(INPUT);
    expect(res.ok).toBe(false);
    expect(res).not.toHaveProperty('convertibleProfileId');
  });

  it('compte créé mais mail en échec → ok avec emailSent=false', async () => {
    m.sendAndLog.mockResolvedValueOnce({ ok: false, error: 'boom' } as never);
    expect(await inviteNewCompany(INPUT)).toEqual({ ok: true, id: 'new-id', emailSent: false });
  });
});
```

- [ ] **Step 2: Lancer les tests**

Run: `npx vitest run tests/entreprises/company-invitation.test.ts`
Expected: FAIL (module introuvable)

- [ ] **Step 3: Implémenter `lib/companies/invitation.ts`**

```ts
// lib/companies/invitation.ts
import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendAndLog } from '@/lib/email/log';
import { companyInvitationEmailHtml, companyInvitationEmailSubject } from '@/lib/email/templates/company-invitation';
import { findProfileByEmail } from '@/lib/employees/invitations';
import {
  normalizeCompanyInput,
  toCompanyAuthMetadata,
  validateCompanyInput,
  type CompanyInput,
} from '@/lib/validation/company';
import { canConvertToCompany } from './conversion';

export type InviteCompanyResult =
  | { ok: true; id: string; emailSent: boolean }
  | { ok: false; error: string; convertibleProfileId?: string };

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}
function redirectTo(): string {
  return `${siteUrl()}/callback?redirect=/stagiaire`;
}

async function sendCompanyEmail(p: {
  companyId: string; email: string; contactNom: string; raisonSociale: string; link: string; isResend: boolean;
}): Promise<boolean> {
  const sent = await sendAndLog({
    kind: 'company_invitation',
    to: p.email,
    toProfileId: p.companyId,
    subject: companyInvitationEmailSubject(p.raisonSociale, p.isResend),
    html: companyInvitationEmailHtml({
      contactNom: p.contactNom,
      raisonSociale: p.raisonSociale,
      invitationUrl: p.link,
      isResend: p.isResend,
    }),
    refTable: 'profiles',
    refId: p.companyId,
    isReminder: p.isResend,
    metadata: { raison_sociale: p.raisonSociale },
  });
  return sent.ok;
}

/** Crée le compte entreprise (auth + profil + company_details via trigger) et envoie l'invitation. */
export async function inviteNewCompany(raw: CompanyInput): Promise<InviteCompanyResult> {
  const input = normalizeCompanyInput(raw);
  const err = validateCompanyInput(input);
  if (err) return { ok: false, error: err };

  const admin = createAdminClient();

  const existing = await findProfileByEmail(input.email);
  if (existing) {
    const { count } = await admin
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', existing.id);
    const convertible = canConvertToCompany(existing, count ?? 0).ok;
    return convertible
      ? {
          ok: false,
          error: 'Un compte particulier existe déjà avec cet email. Vous pouvez le transformer en compte entreprise depuis sa fiche.',
          convertibleProfileId: existing.id,
        }
      : { ok: false, error: 'Un compte existe déjà avec cet email.' };
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: input.email,
    options: { data: toCompanyAuthMetadata(input), redirectTo: redirectTo() },
  });
  if (error || !data?.user || !data.properties?.action_link) {
    if (/already (been )?registered|already exists|user already/i.test(error?.message ?? '')) {
      return { ok: false, error: 'Un compte existe déjà avec cet email.' };
    }
    return { ok: false, error: error?.message ?? "Le compte n'a pas pu être créé." };
  }

  const emailSent = await sendCompanyEmail({
    companyId: data.user.id,
    email: input.email,
    contactNom: input.full_name,
    raisonSociale: input.raison_sociale,
    link: data.properties.action_link,
    isResend: false,
  });
  return { ok: true, id: data.user.id, emailSent };
}

/** Renvoie un lien (recovery) tant que l'entreprise ne s'est jamais connectée. */
export async function resendCompanyInvitationLink(
  companyId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data: prof } = await admin
    .from('profiles')
    .select('id, email, full_name, account_type, company:company_details!company_details_profile_id_fkey(raison_sociale)')
    .eq('id', companyId)
    .maybeSingle();
  if (!prof || prof.account_type !== 'entreprise') return { ok: false, error: 'Entreprise introuvable.' };

  const { data: userData } = await admin.auth.admin.getUserById(companyId);
  if (userData?.user?.last_sign_in_at) {
    return { ok: false, error: 'Ce compte est déjà activé.' };
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: prof.email,
    options: { redirectTo: redirectTo() },
  });
  if (error || !data?.properties?.action_link) {
    return { ok: false, error: error?.message ?? "Impossible de générer un nouveau lien d'invitation." };
  }

  const company = Array.isArray(prof.company) ? prof.company[0] : prof.company;
  const ok = await sendCompanyEmail({
    companyId,
    email: prof.email,
    contactNom: prof.full_name,
    raisonSociale: company?.raison_sociale ?? prof.full_name,
    link: data.properties.action_link,
    isResend: true,
  });
  return ok ? { ok: true } : { ok: false, error: "Le lien a été généré mais l'email n'a pas pu être envoyé." };
}
```

- [ ] **Step 4: Lancer les tests**

Run: `npx vitest run tests/entreprises/company-invitation.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Server actions**

```ts
// app/(app)/admin/entreprises/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/supabase/server';
import {
  inviteNewCompany,
  resendCompanyInvitationLink,
  type InviteCompanyResult,
} from '@/lib/companies/invitation';
import type { CompanyInput } from '@/lib/validation/company';

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error("Accès réservé à l'administration.");
  }
  return profile;
}

export async function createCompanyByAdmin(input: CompanyInput): Promise<InviteCompanyResult> {
  await requireAdmin();
  const res = await inviteNewCompany(input);
  if (res.ok) revalidatePath('/admin/entreprises');
  return res;
}

export async function resendCompanyInvitation(
  companyId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  return resendCompanyInvitationLink(companyId);
}
```

- [ ] **Step 6: Page + formulaire**

```tsx
// app/(app)/admin/entreprises/nouvelle/page.tsx
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { getCurrentProfile } from '@/lib/supabase/server';
import { getAllSecteurs } from '@/lib/db/secteurs';
import { NewCompanyForm } from './NewCompanyForm';

export const dynamic = 'force-dynamic';

export default async function NouvelleEntreprisePage() {
  const me = await getCurrentProfile();
  if (!me || me.role !== 'admin') redirect('/login');
  const secteurs = await getAllSecteurs();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Entreprises"
        title="Ajouter une entreprise"
        description="Renseignez les informations de l'entreprise. Un email d'invitation sera envoyé au contact pour valider l'inscription et définir son mot de passe."
        actions={<ButtonLink href="/admin/entreprises" variant="secondary">← Liste</ButtonLink>}
      />
      <NewCompanyForm secteurs={secteurs} />
    </div>
  );
}
```

```tsx
// app/(app)/admin/entreprises/nouvelle/NewCompanyForm.tsx
'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { CompanyFormFields } from '@/components/forms/CompanyFormFields';
import type { Secteur } from '@/lib/db/secteurs';
import { EMPTY_COMPANY_INPUT, validateCompanyInput, type CompanyInput } from '@/lib/validation/company';
import { createCompanyByAdmin } from '../actions';

export function NewCompanyForm({ secteurs }: { secteurs: Secteur[] }) {
  const router = useRouter();
  const [form, setForm] = useState<CompanyInput>(EMPTY_COMPANY_INPUT);
  const [error, setError] = useState<string | null>(null);
  const [convertId, setConvertId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setConvertId(null);
    const err = validateCompanyInput(form);
    if (err) { setError(err); return; }
    setError(null);
    startTransition(async () => {
      const res = await createCompanyByAdmin(form);
      if (!res.ok) {
        setError(res.error);
        setConvertId(res.convertibleProfileId ?? null);
        return;
      }
      router.push(`/admin/entreprises/${res.id}?invitation=${res.emailSent ? 'sent' : 'failed'}`);
    });
  }

  return (
    <form onSubmit={submit} className="bg-white border border-dark/10 rounded-lg p-6 space-y-6 max-w-3xl">
      <CompanyFormFields value={form} onChange={setForm} secteurs={secteurs} theme="light" headings />
      <div className="flex gap-3 items-center flex-wrap">
        <Button type="submit" disabled={pending}>
          {pending ? 'Création…' : "Créer l'entreprise et envoyer l'invitation"}
        </Button>
        {error && (
          <p className="text-sm text-orange">
            {error}{' '}
            {convertId && (
              <Link href={`/admin/stagiaires/${convertId}`} className="underline">Ouvrir la fiche</Link>
            )}
          </p>
        )}
      </div>
    </form>
  );
}
```

- [ ] **Step 7: Vérifier**

Run: `npx tsc --noEmit && npm run lint && npx vitest run tests/entreprises`
Expected: aucune erreur, tests PASS.

(La redirection vers la fiche `/admin/entreprises/[id]` sera fonctionnelle après la Task 9.)

---

### Task 9: Fiche entreprise `/admin/entreprises/[id]` (infos, salariés, sessions)

**Files:**
- Modify: `lib/companies/queries.ts` (ajout `loadCompanyDetail`)
- Create: `app/(app)/admin/entreprises/[id]/page.tsx`, `app/(app)/admin/entreprises/[id]/ResendCompanyInvitationButton.tsx`

**Interfaces:**
- Consumes: `loadSignedInIds` (Task 7), `employeeAccountStatus`, `EMPLOYEE_STATUS_LABEL`, `buildCompanySessionRows`, `RawCompanySession`, `CompanySessionRow` (Task 6), `resendCompanyInvitation` (Task 8).
- Produces:
  - `interface CompanyEmployeeRow { id: string; prenom: string; nom: string; email: string; profile_id: string | null; status: EmployeeAccountStatus }`
  - `interface CompanyDetail { id; full_name; email; phone: string | null; secteur: string | null; created_at: string; active: boolean; company: { raison_sociale; siret: string | null; tva_intra: string | null; contact_fonction: string | null; billing_address: { rue?: string; code_postal?: string; ville?: string; pays?: string } | null }; employees: CompanyEmployeeRow[]; sessions: CompanySessionRow[] }`
  - `loadCompanyDetail(admin: AdminClient, id: string): Promise<CompanyDetail | null>` (null si pas une entreprise)
  - La page affiche des emplacements pour `AddCompanyEmployeeForm`, `ResendEmployeeInvitationButton` (Task 10) et `EnrollEmployeesDialog` (Task 11) — ils sont ajoutés dans ces tâches.

- [ ] **Step 1: `loadCompanyDetail`** — ajouter à `lib/companies/queries.ts` (les `import` vont en tête du fichier, le reste à la suite de `listCompanies`) :

```ts
import { employeeAccountStatus, type EmployeeAccountStatus } from './status';
import { buildCompanySessionRows, type CompanySessionRow, type RawCompanySession } from './sessions';

export interface CompanyEmployeeRow {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  profile_id: string | null;
  status: EmployeeAccountStatus;
}

export interface CompanyDetail {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  secteur: string | null;
  created_at: string;
  active: boolean;
  company: {
    raison_sociale: string;
    siret: string | null;
    tva_intra: string | null;
    contact_fonction: string | null;
    billing_address: { rue?: string; code_postal?: string; ville?: string; pays?: string } | null;
  };
  employees: CompanyEmployeeRow[];
  sessions: CompanySessionRow[];
}

const SESSION_SELECT = `
  id, statut, visibility, reserved_company_id,
  formation:formations(titre),
  creneaux:session_creneaux(date, ordre)
`;

export async function loadCompanyDetail(admin: AdminClient, id: string): Promise<CompanyDetail | null> {
  const { data: prof } = await admin
    .from('profiles')
    .select(`
      id, full_name, email, phone, created_at, account_type,
      secteur:secteurs_activite(label),
      company:company_details!company_details_profile_id_fkey(raison_sociale, siret, tva_intra, contact_fonction, billing_address)
    `)
    .eq('id', id)
    .maybeSingle();
  if (!prof || prof.account_type !== 'entreprise') return null;

  const { data: emps } = await admin
    .from('employees')
    .select('id, prenom, nom, email, profile_id')
    .eq('employer_profile_id', id)
    .order('nom');
  const employees = emps ?? [];
  const employeeIds = employees.map((e) => e.id);

  const [signedIn, { data: pendingLinks }, { data: reserved }, { data: paid }, { data: parts }] = await Promise.all([
    loadSignedInIds(admin, [id, ...employees.map((e) => e.profile_id).filter((p): p is string => !!p)]),
    employeeIds.length === 0
      ? Promise.resolve({ data: [] as { employee_id: string }[] })
      : admin.from('employee_invitations').select('employee_id').in('employee_id', employeeIds).is('claimed_at', null),
    admin.from('sessions').select('id').eq('reserved_company_id', id),
    admin.from('inscriptions').select('session_id').eq('payer_profile_id', id),
    employeeIds.length === 0
      ? Promise.resolve({ data: [] as { employee_id: string | null; inscription: unknown }[] })
      : admin
          .from('inscription_participants')
          .select('employee_id, inscription:inscriptions!inner(session_id)')
          .in('employee_id', employeeIds),
  ]);

  const pendingSet = new Set((pendingLinks ?? []).map((p) => p.employee_id));
  const employeeRows: CompanyEmployeeRow[] = employees.map((e) => ({
    ...e,
    status: employeeAccountStatus({
      profileId: e.profile_id,
      signedIn: !!e.profile_id && signedIn.has(e.profile_id),
      pendingLink: pendingSet.has(e.id),
    }),
  }));

  const nameById = new Map(employees.map((e) => [e.id, `${e.prenom} ${e.nom}`.trim()]));
  const participantsBySession = new Map<string, string[]>();
  for (const p of parts ?? []) {
    const insc = one(p.inscription as One<{ session_id: string }>);
    if (!insc || !p.employee_id) continue;
    const list = participantsBySession.get(insc.session_id) ?? [];
    const name = nameById.get(p.employee_id);
    if (name && !list.includes(name)) list.push(name);
    participantsBySession.set(insc.session_id, list);
  }

  const sessionIds = [...new Set([
    ...(reserved ?? []).map((s) => s.id),
    ...(paid ?? []).map((i) => i.session_id),
    ...participantsBySession.keys(),
  ])];
  const { data: sessions } = sessionIds.length === 0
    ? { data: [] as RawCompanySession[] }
    : await admin.from('sessions').select(SESSION_SELECT).in('id', sessionIds);

  const c = one(prof.company as One<CompanyDetail['company']>);
  const secteur = one(prof.secteur as One<{ label: string }>);
  return {
    id: prof.id,
    full_name: prof.full_name,
    email: prof.email,
    phone: prof.phone,
    secteur: secteur?.label ?? null,
    created_at: prof.created_at,
    active: signedIn.has(prof.id),
    company: c ?? { raison_sociale: prof.full_name, siret: null, tva_intra: null, contact_fonction: null, billing_address: null },
    employees: employeeRows,
    sessions: buildCompanySessionRows((sessions ?? []) as RawCompanySession[], participantsBySession),
  };
}
```

> Si l'embed `secteur:secteurs_activite(label)` échoue (relation non détectée par PostgREST), remplacer par la sélection de `secteur_activite` puis une requête `admin.from('secteurs_activite').select('label').eq('code', …).maybeSingle()`.

- [ ] **Step 2: Bouton de renvoi (entreprise)**

```tsx
// app/(app)/admin/entreprises/[id]/ResendCompanyInvitationButton.tsx
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/app/Button';
import { resendCompanyInvitation } from '../actions';

export function ResendCompanyInvitationButton({ companyId }: { companyId: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => startTransition(async () => {
          const res = await resendCompanyInvitation(companyId);
          setMsg(res.ok ? { ok: true, text: 'Invitation renvoyée.' } : { ok: false, text: res.error });
        })}
      >
        {pending ? 'Envoi…' : "Renvoyer l'invitation"}
      </Button>
      {msg && <span className={`text-sm ${msg.ok ? 'text-teal' : 'text-orange'}`}>{msg.text}</span>}
    </div>
  );
}
```

- [ ] **Step 3: Page fiche**

```tsx
// app/(app)/admin/entreprises/[id]/page.tsx
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadCompanyDetail } from '@/lib/companies/queries';
import { EMPLOYEE_STATUS_LABEL } from '@/lib/companies/status';
import { formatDate } from '@/lib/date';
import { ResendCompanyInvitationButton } from './ResendCompanyInvitationButton';

export const dynamic = 'force-dynamic';

const STATUT_LABEL: Record<string, string> = {
  draft: 'Brouillon', published: 'Publiée', cancelled: 'Annulée', completed: 'Terminée',
};

export default async function AdminEntrepriseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invitation?: string }>;
}) {
  const me = await getCurrentProfile();
  if (!me || me.role !== 'admin') redirect('/login');
  const { id } = await params;
  const sp = await searchParams;

  const d = await loadCompanyDetail(createAdminClient(), id);
  if (!d) notFound();

  const addr = d.company.billing_address;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Entreprise"
        title={d.company.raison_sociale}
        description={`${d.full_name} · ${d.email}`}
        actions={<ButtonLink href="/admin/entreprises" variant="secondary">← Liste</ButtonLink>}
      />

      {sp.invitation === 'sent' && (
        <p className="text-sm border rounded p-3 text-teal bg-teal/10 border-teal/30">
          Entreprise créée. L&apos;invitation a été envoyée à {d.email}.
        </p>
      )}
      {sp.invitation === 'failed' && (
        <p className="text-sm border rounded p-3 text-orange bg-orange/10 border-orange/30">
          Entreprise créée, mais l&apos;email d&apos;invitation n&apos;a pas pu être envoyé. Utilisez « Renvoyer l&apos;invitation ».
        </p>
      )}

      {/* Infos */}
      <section className="grid lg:grid-cols-3 gap-4">
        <Card title="Société">
          <Row k="Raison sociale" v={d.company.raison_sociale} />
          <Row k="SIRET" v={d.company.siret || '—'} />
          <Row k="TVA intra." v={d.company.tva_intra || '—'} />
          <Row k="Secteur" v={d.secteur || '—'} />
          <Row k="Créée le" v={formatDate(d.created_at)} />
        </Card>
        <Card title="Adresse de facturation">
          <p className="text-sm">{addr?.rue || '—'}</p>
          <p className="text-sm">{[addr?.code_postal, addr?.ville].filter(Boolean).join(' ') || ''}</p>
          <p className="text-sm text-dark/60">{addr?.pays || ''}</p>
        </Card>
        <Card title="Contact">
          <Row k="Nom" v={d.full_name || '—'} />
          <Row k="Fonction" v={d.company.contact_fonction || '—'} />
          <Row k="Email" v={d.email} />
          <Row k="Téléphone" v={d.phone || '—'} />
          <Row k="Compte" v={d.active ? 'Actif' : 'Invitation en attente'} />
          {!d.active && <div className="pt-3"><ResendCompanyInvitationButton companyId={d.id} /></div>}
        </Card>
      </section>

      {/* Salariés */}
      <section className="bg-white rounded-lg border border-dark/10">
        <header className="flex items-center justify-between gap-3 p-6 pb-3">
          <h2 className="font-display text-xl">Salariés ({d.employees.length})</h2>
        </header>
        {/* Task 10 : <AddCompanyEmployeeForm companyId={d.id} /> ici */}
        {d.employees.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-dark/60">Aucun salarié pour le moment.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-3 px-4">Nom</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Statut</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {d.employees.map((e) => (
                <tr key={e.id}>
                  <td className="py-3 px-4">
                    {e.profile_id ? (
                      <Link href={`/admin/stagiaires/${e.profile_id}`} className="font-medium hover:underline">{e.prenom} {e.nom}</Link>
                    ) : (
                      <span className="font-medium">{e.prenom} {e.nom}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-dark/70">{e.email}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs ${e.status === 'actif' ? 'text-teal' : 'text-orange'}`}>{EMPLOYEE_STATUS_LABEL[e.status]}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {/* Task 10 : {e.status !== 'actif' && <ResendEmployeeInvitationButton employeeId={e.id} companyId={d.id} />} */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Sessions */}
      <section className="bg-white rounded-lg border border-dark/10">
        <header className="flex items-center justify-between gap-3 p-6 pb-3">
          <h2 className="font-display text-xl">Sessions ({d.sessions.length})</h2>
          {/* Task 11 : <EnrollEmployeesDialog companyId={d.id} employees={...} /> ici */}
        </header>
        {d.sessions.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-dark/60">Aucune session liée à cette entreprise.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-3 px-4">Formation</th>
                <th className="text-left py-3 px-4">Dates</th>
                <th className="text-left py-3 px-4">Statut</th>
                <th className="text-left py-3 px-4">Participants de l&apos;entreprise</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {d.sessions.map((s) => {
                const href = `/admin/sessions/${s.id}`;
                return (
                  <tr key={s.id} className="hover:bg-light/50">
                    <td className="py-3 px-4">
                      <Link href={href} className="block font-medium">
                        {s.formationTitre}
                        {s.reserved && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-teal/10 text-teal uppercase tracking-wider">Réservée</span>}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-dark/70">
                      {s.firstDate ? formatDate(s.firstDate) : '—'}
                      {s.lastDate && s.lastDate !== s.firstDate && <> → {formatDate(s.lastDate)}</>}
                    </td>
                    <td className="py-3 px-4">{STATUT_LABEL[s.statut] ?? s.statut}</td>
                    <td className="py-3 px-4 text-dark/70">{s.participants.join(', ') || <span className="text-dark/40">—</span>}</td>
                    <td className="py-3 px-4 text-right">
                      <Link href={href} className="text-xs uppercase tracking-[0.15em] text-teal hover:underline whitespace-nowrap">Voir →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-dark/10 p-6">
      <h2 className="font-display text-xl mb-3">{title}</h2>
      <dl className="text-sm space-y-1">{children}</dl>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-dark/60">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}
```

> `formatDate` reçoit ici une date `YYYY-MM-DD` : vérifier que `lib/date.ts` l'affiche sans décalage (même usage que `app/(app)/admin/sessions/page.tsx`, qui passe déjà `creneaux.date` à `formatDate`).

- [ ] **Step 4: Vérifier**

Run: `npx tsc --noEmit && npm run lint`
Expected: aucune erreur.

Manuel : ouvrir une entreprise existante depuis la liste → infos, salariés (avec statuts), sessions ; clic sur une session → `/admin/sessions/[id]`. Id d'un particulier dans l'URL → 404.

---

### Task 10: Ajout de salariés par l'admin + renvoi d'invitation

**Files:**
- Modify: `app/(app)/admin/entreprises/actions.ts`
- Create: `app/(app)/admin/entreprises/[id]/AddCompanyEmployeeForm.tsx`, `app/(app)/admin/entreprises/[id]/ResendEmployeeInvitationButton.tsx`
- Modify: `app/(app)/admin/entreprises/[id]/page.tsx` (remplacer les deux commentaires « Task 10 »)

**Interfaces:**
- Consumes: `upsertEmployeeForEmployer` (`lib/employees/upsert.ts`), `sendEmployeeAccountInvitation` (Task 5), `requireAdmin` (Task 8).
- Produces:
  - `addEmployeeByAdmin(companyId: string, input: { prenom: string; nom: string; email: string }): Promise<{ ok: true; message: string } | { ok: false; error: string }>`
  - `resendEmployeeInvitationByAdmin(companyId: string, employeeId: string): Promise<{ ok: true; message: string } | { ok: false; error: string }>`
  - `assertCompany(admin, companyId): Promise<boolean>` (interne aux actions, réutilisé Task 11)

- [ ] **Step 1: Actions** — ajouter dans `app/(app)/admin/entreprises/actions.ts` (imports en tête du fichier) :

```ts
import { createAdminClient } from '@/lib/supabase/admin';
import { upsertEmployeeForEmployer } from '@/lib/employees/upsert';
import { sendEmployeeAccountInvitation } from '@/lib/employees/account-invitation';

type Admin = ReturnType<typeof createAdminClient>;

async function assertCompany(admin: Admin, companyId: string): Promise<boolean> {
  const { data } = await admin.from('profiles').select('account_type').eq('id', companyId).maybeSingle();
  return data?.account_type === 'entreprise';
}

function revalidateCompany(companyId: string) {
  revalidatePath(`/admin/entreprises/${companyId}`);
  revalidatePath('/admin/entreprises');
}

function invitationMessage(mode: 'create' | 'recovery' | 'link'): string {
  if (mode === 'link') return 'Ce salarié a déjà un compte : une invitation de rattachement lui a été envoyée.';
  if (mode === 'recovery') return 'Un nouveau lien d’accès a été envoyé.';
  return 'Salarié ajouté : son invitation a été envoyée par email.';
}

export async function addEmployeeByAdmin(
  companyId: string,
  input: { prenom: string; nom: string; email: string },
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const me = await requireAdmin();
  const admin = createAdminClient();
  if (!(await assertCompany(admin, companyId))) return { ok: false, error: 'Entreprise introuvable.' };

  const res = await upsertEmployeeForEmployer(admin, companyId, input, me.id);
  if (!res.ok) return res;
  revalidateCompany(companyId);

  if (res.invitation === 'sent') return { ok: true, message: invitationMessage('link') };
  if (res.invitation === 'failed') {
    return { ok: true, message: 'Salarié ajouté, mais l’invitation n’a pas pu être envoyée. Utilisez « Renvoyer ».' };
  }

  const { data: emp } = await admin.from('employees').select('profile_id').eq('id', res.id).maybeSingle();
  if (emp?.profile_id) {
    return { ok: true, message: res.created ? 'Salarié ajouté.' : 'Ce salarié est déjà dans la liste.' };
  }

  const sent = await sendEmployeeAccountInvitation(res.id, me.id);
  revalidateCompany(companyId);
  if (!sent.ok) return { ok: true, message: `Salarié ajouté, mais l’invitation a échoué : ${sent.error}` };
  return { ok: true, message: invitationMessage(sent.mode) };
}

export async function resendEmployeeInvitationByAdmin(
  companyId: string,
  employeeId: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const me = await requireAdmin();
  const admin = createAdminClient();
  const { data: emp } = await admin
    .from('employees')
    .select('id')
    .eq('id', employeeId)
    .eq('employer_profile_id', companyId)
    .maybeSingle();
  if (!emp) return { ok: false, error: 'Salarié introuvable.' };

  const sent = await sendEmployeeAccountInvitation(employeeId, me.id);
  if (!sent.ok) return sent;
  revalidateCompany(companyId);
  return { ok: true, message: invitationMessage(sent.mode) };
}
```

- [ ] **Step 2: Formulaire d'ajout**

```tsx
// app/(app)/admin/entreprises/[id]/AddCompanyEmployeeForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { Field } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { addEmployeeByAdmin } from '../actions';

export function AddCompanyEmployeeForm({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <div className="px-6 pb-4">
        <Button variant="secondary" onClick={() => setOpen(true)}>+ Ajouter un salarié</Button>
        {msg && <p className={`mt-2 text-sm ${msg.ok ? 'text-teal' : 'text-orange'}`}>{msg.text}</p>}
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await addEmployeeByAdmin(companyId, { prenom, nom, email });
      if (!res.ok) { setMsg({ ok: false, text: res.error }); return; }
      setPrenom(''); setNom(''); setEmail('');
      setOpen(false);
      setMsg({ ok: true, text: res.message });
    });
  }

  return (
    <form onSubmit={submit} className="mx-6 mb-4 border border-dark/10 rounded p-4 bg-light/40">
      <p className="text-sm text-dark/60 mb-3">
        Le salarié recevra un email pour créer son mot de passe. S’il a déjà un compte C-KIM, il recevra une invitation de rattachement.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
        <Field label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="mt-4 flex gap-3 items-center flex-wrap">
        <Button type="submit" disabled={pending}>{pending ? 'Ajout…' : 'Ajouter et inviter'}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
        {msg && !msg.ok && <p className="text-sm text-orange">{msg.text}</p>}
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Bouton de renvoi (salarié)**

```tsx
// app/(app)/admin/entreprises/[id]/ResendEmployeeInvitationButton.tsx
'use client';

import { useState, useTransition } from 'react';
import { resendEmployeeInvitationByAdmin } from '../actions';

export function ResendEmployeeInvitationButton({ companyId, employeeId }: { companyId: string; employeeId: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  if (msg) return <span className={`text-xs ${msg.ok ? 'text-teal' : 'text-orange'}`}>{msg.text}</span>;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => {
        const res = await resendEmployeeInvitationByAdmin(companyId, employeeId);
        setMsg(res.ok ? { ok: true, text: res.message } : { ok: false, text: res.error });
      })}
      className="text-xs uppercase tracking-[0.15em] text-teal hover:underline disabled:opacity-50 whitespace-nowrap"
    >
      {pending ? 'Envoi…' : "Renvoyer l'invitation"}
    </button>
  );
}
```

- [ ] **Step 4: Brancher dans la fiche** (`app/(app)/admin/entreprises/[id]/page.tsx`)

Importer les deux composants, puis remplacer :
- le commentaire `{/* Task 10 : <AddCompanyEmployeeForm companyId={d.id} /> ici */}` par `<AddCompanyEmployeeForm companyId={d.id} />` ;
- le commentaire de la cellule d'action par `{e.status !== 'actif' && <ResendEmployeeInvitationButton companyId={d.id} employeeId={e.id} />}`.

- [ ] **Step 5: Vérifier**

Run: `npx tsc --noEmit && npm run lint`
Expected: aucune erreur.

Manuel (avec une adresse de test) : ajouter un salarié avec un email neuf → message « invitation envoyée », statut « Invité », mail reçu (« Créez votre accès », sans formation), le lien mène à `/setup-password`. Ajouter un salarié dont l'email est un particulier existant → message « rattachement ». Email d'un compte entreprise → erreur explicite.

---

### Task 11: Inscription de salariés à une session

**Files:**
- Modify: `lib/companies/queries.ts` (ajout `listEnrollableSessions`)
- Modify: `app/(app)/admin/entreprises/actions.ts`
- Create: `app/(app)/admin/entreprises/[id]/EnrollEmployeesDialog.tsx`
- Modify: `app/(app)/admin/entreprises/[id]/page.tsx`

**Interfaces:**
- Consumes: `isSessionEligibleForCompany`, `partitionEmployeesByOccupancy`, `firstAndLastDate` (Task 6), `todayIsoParis`, `loadSessionOccupants`, `assertCompany`, `requireAdmin`.
- Produces:
  - `interface EnrollableSessionOption { id: string; label: string; reserved: boolean }`
  - `listEnrollableSessions(admin: AdminClient, companyId: string): Promise<EnrollableSessionOption[]>` (tri par date croissante)
  - `getEnrolledEmployeeIds(companyId: string, sessionId: string): Promise<string[]>`
  - `enrollEmployeesByAdmin(companyId: string, sessionId: string, employeeIds: string[]): Promise<{ ok: true; enrolled: number; skipped: number } | { ok: false; error: string }>`

- [ ] **Step 1: `listEnrollableSessions`** — ajouter à `lib/companies/queries.ts` (imports en tête du fichier) :

```ts
import { formatDate, todayIsoParis } from '@/lib/date';
import { isSessionEligibleForCompany } from './enrollment';
import { firstAndLastDate } from './sessions';

export interface EnrollableSessionOption {
  id: string;
  label: string;
  reserved: boolean;
}

export async function listEnrollableSessions(admin: AdminClient, companyId: string): Promise<EnrollableSessionOption[]> {
  const { data } = await admin
    .from('sessions')
    .select(SESSION_SELECT)
    .eq('statut', 'published');
  const today = todayIsoParis();
  return ((data ?? []) as RawCompanySession[])
    .map((s) => ({ s, ...firstAndLastDate(s.creneaux) }))
    .filter(({ s, firstDate }) => isSessionEligibleForCompany({ ...s, firstDate }, companyId, today))
    .sort((a, b) => (a.firstDate ?? '').localeCompare(b.firstDate ?? ''))
    .map(({ s, firstDate, lastDate }) => {
      const formation = one(s.formation);
      const dates = firstDate === lastDate || !lastDate
        ? formatDate(firstDate)
        : `${formatDate(firstDate)} → ${formatDate(lastDate)}`;
      return {
        id: s.id,
        label: `${formation?.titre ?? 'Formation'} — ${dates}${s.visibility === 'reserved' ? ' (réservée)' : ''}`,
        reserved: s.visibility === 'reserved',
      };
    });
}
```

- [ ] **Step 2: Actions** — ajouter dans `app/(app)/admin/entreprises/actions.ts` (imports en tête du fichier) :

```ts
import { loadSessionOccupants } from '@/lib/sessions/search-stagiaires-query';
import { isSessionEligibleForCompany, partitionEmployeesByOccupancy } from '@/lib/companies/enrollment';
import { firstAndLastDate } from '@/lib/companies/sessions';
import { todayIsoParis } from '@/lib/date';

export async function getEnrolledEmployeeIds(companyId: string, sessionId: string): Promise<string[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const [{ data: emps }, occupants] = await Promise.all([
    admin.from('employees').select('id, profile_id').eq('employer_profile_id', companyId),
    loadSessionOccupants(admin, sessionId),
  ]);
  return partitionEmployeesByOccupancy(emps ?? [], occupants).alreadyEnrolled;
}

export async function enrollEmployeesByAdmin(
  companyId: string,
  sessionId: string,
  employeeIds: string[],
): Promise<{ ok: true; enrolled: number; skipped: number } | { ok: false; error: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  if (employeeIds.length === 0) return { ok: false, error: 'Sélectionnez au moins un salarié.' };
  if (!(await assertCompany(admin, companyId))) return { ok: false, error: 'Entreprise introuvable.' };

  const { data: session } = await admin
    .from('sessions')
    .select('id, statut, visibility, reserved_company_id, creneaux:session_creneaux(date, ordre)')
    .eq('id', sessionId)
    .maybeSingle();
  if (!session) return { ok: false, error: 'Session introuvable.' };
  const { firstDate } = firstAndLastDate(session.creneaux);
  if (!isSessionEligibleForCompany({ ...session, firstDate }, companyId, todayIsoParis())) {
    return { ok: false, error: "Cette session n'est pas ouverte à cette entreprise." };
  }

  const { data: emps } = await admin
    .from('employees')
    .select('id, profile_id')
    .eq('employer_profile_id', companyId)
    .in('id', employeeIds);
  if (!emps || emps.length !== new Set(employeeIds).size) {
    return { ok: false, error: "Un des salariés sélectionnés n'appartient pas à cette entreprise." };
  }

  const occupants = await loadSessionOccupants(admin, sessionId);
  const { enrollable, alreadyEnrolled } = partitionEmployeesByOccupancy(emps, occupants);
  if (enrollable.length === 0) {
    return { ok: false, error: 'Tous les salariés sélectionnés sont déjà inscrits à cette session.' };
  }

  const { data: insc, error: inscErr } = await admin
    .from('inscriptions')
    .insert({
      session_id: sessionId,
      payer_profile_id: companyId,
      participant_profile_id: null,
      statut: 'confirmee',
      confirmed_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (inscErr || !insc) return { ok: false, error: inscErr?.message ?? "Création de l'inscription impossible." };

  const { error: partErr } = await admin
    .from('inscription_participants')
    .insert(enrollable.map((employee_id) => ({ inscription_id: insc.id, employee_id })));
  if (partErr) {
    await admin.from('inscriptions').delete().eq('id', insc.id);
    return { ok: false, error: partErr.message };
  }

  revalidateCompany(companyId);
  revalidatePath(`/admin/sessions/${sessionId}`);
  revalidatePath(`/formateur/sessions/${sessionId}`);
  revalidatePath(`/formateur/sessions/${sessionId}/stagiaires`);
  revalidatePath('/stagiaire/parcours');
  return { ok: true, enrolled: enrollable.length, skipped: alreadyEnrolled.length };
}
```

> `session.creneaux` est typé par supabase-js ; si TypeScript se plaint, caster : `firstAndLastDate(session.creneaux as { date: string; ordre: number }[] | null)` et `visibility: session.visibility as 'public' | 'reserved'`.

- [ ] **Step 3: Composant de sélection**

```tsx
// app/(app)/admin/entreprises/[id]/EnrollEmployeesDialog.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/app/Button';
import { Select } from '@/components/app/Field';
import type { EnrollableSessionOption } from '@/lib/companies/queries';
import { enrollEmployeesByAdmin, getEnrolledEmployeeIds } from '../actions';

export function EnrollEmployeesDialog({
  companyId,
  sessions,
  employees,
}: {
  companyId: string;
  sessions: EnrollableSessionOption[];
  employees: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSelected(new Set());
    setTaken(new Set());
    if (!sessionId) return;
    let cancelled = false;
    getEnrolledEmployeeIds(companyId, sessionId).then((ids) => {
      if (!cancelled) setTaken(new Set(ids));
    });
    return () => { cancelled = true; };
  }, [companyId, sessionId]);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function submit() {
    setMsg(null);
    startTransition(async () => {
      const res = await enrollEmployeesByAdmin(companyId, sessionId, [...selected]);
      if (!res.ok) { setMsg({ ok: false, text: res.error }); return; }
      setMsg({
        ok: true,
        text: `${res.enrolled} salarié${res.enrolled > 1 ? 's' : ''} inscrit${res.enrolled > 1 ? 's' : ''}${res.skipped ? ` (${res.skipped} déjà inscrit${res.skipped > 1 ? 's' : ''})` : ''}.`,
      });
      setOpen(false);
      setSessionId('');
    });
  }

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        {msg?.ok && <span className="text-sm text-teal">{msg.text}</span>}
        <Button variant="secondary" onClick={() => { setMsg(null); setOpen(true); }} disabled={employees.length === 0}>
          Inscrire des salariés
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-dark/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="font-display text-xl">Inscrire des salariés à une session</h3>

        {sessions.length === 0 ? (
          <p className="text-sm text-dark/60">Aucune session à venir ouverte à cette entreprise.</p>
        ) : (
          <Select label="Session" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            <option value="">— Choisir une session —</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
        )}

        {sessionId && (
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-[0.2em] text-dark/60 mb-1">Salariés</legend>
            {employees.map((e) => {
              const isTaken = taken.has(e.id);
              return (
                <label key={e.id} className={`flex items-center gap-2 text-sm ${isTaken ? 'text-dark/40' : ''}`}>
                  <input type="checkbox" disabled={isTaken} checked={selected.has(e.id)} onChange={() => toggle(e.id)} />
                  {e.name}
                  {isTaken && <span className="text-xs">(déjà inscrit)</span>}
                </label>
              );
            })}
          </fieldset>
        )}

        {msg && !msg.ok && <p className="text-sm text-orange">{msg.text}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={pending || !sessionId || selected.size === 0}>
            {pending ? 'Inscription…' : `Inscrire (${selected.size})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Brancher dans la fiche**

Dans `app/(app)/admin/entreprises/[id]/page.tsx` :
- importer `listEnrollableSessions` depuis `@/lib/companies/queries` et `EnrollEmployeesDialog` ;
- après `loadCompanyDetail`, créer `const admin = createAdminClient();` (réutilisé pour les deux appels) et `const enrollable = await listEnrollableSessions(admin, id);` ;
- remplacer le commentaire « Task 11 » par :

```tsx
          <EnrollEmployeesDialog
            companyId={d.id}
            sessions={enrollable}
            employees={d.employees.map((e) => ({ id: e.id, name: `${e.prenom} ${e.nom}`.trim() }))}
          />
```

- [ ] **Step 5: Vérifier**

Run: `npx tsc --noEmit && npm run lint && npx vitest run`
Expected: aucune erreur ; tests PASS.

Manuel : le sélecteur ne propose que les sessions publiées à venir, publiques ou réservées à cette entreprise ; les salariés déjà inscrits sont grisés ; après inscription de 2 salariés, ils apparaissent dans le bloc Sessions et sur `/admin/sessions/[id]` (participants). Relancer la même inscription → « déjà inscrits ».

---

### Task 12: Conversion particulier → entreprise

**Files:**
- Create: `app/(app)/admin/stagiaires/[id]/convert-actions.ts`, `app/(app)/admin/stagiaires/[id]/ConvertToCompany.tsx`
- Modify: `app/(app)/admin/stagiaires/[id]/page.tsx`

**Interfaces:**
- Consumes: `canConvertToCompany` (Task 6), `normalizeCompanyInput`, `validateCompanyInput`, `toCompanyDetailsRow`, `EMPTY_COMPANY_INPUT`, `CompanyInput` (Task 2), `CompanyFormFields` (Task 3).
- Produces: `convertToCompany(profileId: string, input: CompanyInput): Promise<{ ok: true } | { ok: false; error: string }>`

- [ ] **Step 1: Action**

```ts
// app/(app)/admin/stagiaires/[id]/convert-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canConvertToCompany } from '@/lib/companies/conversion';
import {
  normalizeCompanyInput,
  toCompanyDetailsRow,
  validateCompanyInput,
  type CompanyInput,
} from '@/lib/validation/company';

export async function convertToCompany(
  profileId: string,
  raw: CompanyInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await getCurrentProfile();
  if (!me || me.role !== 'admin') throw new Error("Accès réservé à l'administration.");
  const admin = createAdminClient();

  const { data: prof } = await admin
    .from('profiles')
    .select('id, email, role, account_type, employer_profile_id')
    .eq('id', profileId)
    .maybeSingle();
  if (!prof) return { ok: false, error: 'Profil introuvable.' };

  const { count } = await admin
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId);
  const check = canConvertToCompany(prof, count ?? 0);
  if (!check.ok) return { ok: false, error: check.reason };

  // L'email reste celui du compte (identifiant de connexion).
  const input = normalizeCompanyInput({ ...raw, email: prof.email });
  const err = validateCompanyInput(input);
  if (err) return { ok: false, error: err };

  const { data: existingDetails } = await admin
    .from('company_details')
    .select('profile_id')
    .eq('profile_id', profileId)
    .maybeSingle();

  const { error: cdErr } = await admin
    .from('company_details')
    .upsert(toCompanyDetailsRow(profileId, input), { onConflict: 'profile_id' });
  if (cdErr) return { ok: false, error: cdErr.message };

  const { data: secteur } = input.secteur_activite
    ? await admin.from('secteurs_activite').select('code').eq('code', input.secteur_activite).maybeSingle()
    : { data: null };

  const { error: pErr } = await admin
    .from('profiles')
    .update({
      account_type: 'entreprise',
      full_name: input.full_name,
      phone: input.phone,
      secteur_activite: secteur?.code ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId);
  if (pErr) {
    if (!existingDetails) await admin.from('company_details').delete().eq('profile_id', profileId);
    return { ok: false, error: pErr.message };
  }

  revalidatePath(`/admin/stagiaires/${profileId}`);
  revalidatePath('/admin/stagiaires');
  revalidatePath('/admin/entreprises');
  return { ok: true };
}
```

- [ ] **Step 2: Composant**

```tsx
// app/(app)/admin/stagiaires/[id]/ConvertToCompany.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { CompanyFormFields } from '@/components/forms/CompanyFormFields';
import type { Secteur } from '@/lib/db/secteurs';
import { EMPTY_COMPANY_INPUT, validateCompanyInput, type CompanyInput } from '@/lib/validation/company';
import { convertToCompany } from './convert-actions';

export function ConvertToCompany({
  profileId,
  secteurs,
  prefill,
}: {
  profileId: string;
  secteurs: Secteur[];
  prefill: { full_name: string; email: string; phone: string; secteur_activite: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CompanyInput>({ ...EMPTY_COMPANY_INPUT, ...prefill });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Transformer en compte entreprise
      </Button>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateCompanyInput(form);
    if (err) { setError(err); return; }
    setError(null);
    startTransition(async () => {
      const res = await convertToCompany(profileId, form);
      if (!res.ok) { setError(res.error); return; }
      router.push(`/admin/entreprises/${profileId}`);
    });
  }

  return (
    <form onSubmit={submit} className="bg-white border border-teal/30 rounded-lg p-6 space-y-6">
      <div>
        <h2 className="font-display text-xl">Transformer en compte entreprise</h2>
        <p className="text-sm text-dark/60 mt-1">
          Le compte garde son email, son mot de passe et son historique. La personne devient le contact référent de l&apos;entreprise.
        </p>
      </div>
      <CompanyFormFields value={form} onChange={setForm} secteurs={secteurs} theme="light" headings emailReadOnly />
      <div className="flex gap-3 items-center flex-wrap">
        <Button type="submit" disabled={pending}>{pending ? 'Transformation…' : 'Confirmer la transformation'}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
        {error && <p className="text-sm text-orange">{error}</p>}
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Brancher dans la fiche stagiaire** (`app/(app)/admin/stagiaires/[id]/page.tsx`)

1. Imports :

```tsx
import { getAllSecteurs } from '@/lib/db/secteurs';
import { canConvertToCompany } from '@/lib/companies/conversion';
import { ConvertToCompany } from './ConvertToCompany';
```

2. Ajouter `secteur_activite` à la sélection du profil (étape 1) : `id, full_name, email, phone, role, account_type, employer_profile_id, secteur_activite, created_at,`.

3. Après le calcul de `employeeIds` (étape 3) :

```tsx
  const convertible = canConvertToCompany(prof, employeeIds.length).ok;
  const secteurs = convertible && tab === 'infos' ? await getAllSecteurs() : [];
```

4. Dans le rendu, juste avant `{tab === 'infos' && (<InfosSection …/>)}`, ajouter :

```tsx
      {tab === 'infos' && convertible && (
        <ConvertToCompany
          profileId={prof.id}
          secteurs={secteurs}
          prefill={{
            full_name: prof.full_name ?? '',
            email: prof.email,
            phone: prof.phone ?? '',
            secteur_activite: prof.secteur_activite ?? '',
          }}
        />
      )}
```

5. Si le profil est déjà une entreprise, ajouter un lien vers sa fiche entreprise dans les `actions` du `PageHeader` :

```tsx
        actions={
          <>
            {prof.account_type === 'entreprise' && (
              <ButtonLink href={`/admin/entreprises/${prof.id}`} variant="secondary">Fiche entreprise</ButtonLink>
            )}
            <ButtonLink href="/admin/stagiaires" variant="secondary">← Liste</ButtonLink>
          </>
        }
```

- [ ] **Step 4: Vérifier**

Run: `npx tsc --noEmit && npm run lint`
Expected: aucune erreur.

Manuel : sur un particulier indépendant, le bouton apparaît ; le formulaire est pré-rempli (email grisé) ; après validation → redirection vers `/admin/entreprises/[id]` qui affiche les infos ; le particulier se reconnecte et voit le menu entreprise (Mes salariés, etc.) avec son historique. Sur un salarié, une entreprise ou un formateur : pas de bouton.

---

### Task 13: Vérification finale

- [ ] **Step 1: Suite complète**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: tous les tests PASS, aucune erreur de type ni de lint.

- [ ] **Step 2: Parcours manuel de bout en bout** (`npm run dev`, compte admin, adresses email de test)

1. Menu → Entreprises → « Ajouter une entreprise » → formulaire complet (avec secteur) → redirection vers la fiche, bandeau « invitation envoyée ».
2. Ouvrir le mail → « Créer mon mot de passe » → `/setup-password` → connexion → espace entreprise. Vérifier en base que `profiles.secteur_activite` est renseigné (fix Task 1).
3. Revenir admin → la liste montre l'entreprise « Actif ».
4. Fiche → ajouter 2 salariés (emails neufs) → 2 mails reçus, statut « Invité ».
5. Fiche → « Inscrire des salariés » → choisir une session publique à venir → cocher les 2 → ils apparaissent dans le bloc Sessions et sur la fiche session.
6. Réserver une session à cette entreprise (fiche session existante) → elle apparaît dans le bloc Sessions et dans le sélecteur d'inscription ; une session réservée à une autre entreprise n'y apparaît pas.
7. Créer une entreprise avec l'email d'un particulier existant → erreur + lien « Ouvrir la fiche » → « Transformer en compte entreprise » → fiche entreprise.
8. Signup public `/signup-entreprise` avec un secteur → le secteur est enregistré.
9. Flux formateur : `/formateur/sessions/[id]/stagiaires` → « Envoyer l'invitation » à un salarié sans compte → mail reçu avec le titre de formation (non-régression Task 5).

- [ ] **Step 3: Rapport à l'utilisateur**

Résumer ce qui a été fait, ce qui a été vérifié manuellement et ce qui ne l'a pas été, et rappeler que la migration `20260928_entreprises_admin.sql` doit être appliquée en base si ce n'est pas déjà fait. **Ne pas commit ni push** : l'utilisateur le fera lui-même.
