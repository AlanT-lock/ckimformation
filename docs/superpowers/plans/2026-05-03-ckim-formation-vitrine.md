# C-KIM Formation — Vitrine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 16 marketing site for C-KIM Formation with 5 public pages, 15 formation detail pages from a typed TS data source, devis modal, contact forms, and editorial-dark hero animations.

**Architecture:** Static-first Next.js 16 App Router project. Formation content in typed TS files (`lib/formations/*.ts`). Animations via Framer Motion + Lenis. Forms via Server Actions + Resend. Tailwind v4 design tokens. Deployment Vercel. Phase 2 routes (auth/client/admin/formateur) reserved as empty placeholders.

**Tech Stack:** Next.js 16, TypeScript strict, Tailwind v4, Framer Motion 12, Lenis, Resend, Zod, next/font, Vitest (unit tests).

**Spec:** `docs/superpowers/specs/2026-05-03-ckim-formation-vitrine-design.md`

---

## File Structure

```
ckim-formation/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                          # /
│   │   ├── organisme/page.tsx
│   │   ├── formations/
│   │   │   ├── page.tsx                      # index
│   │   │   └── [slug]/page.tsx
│   │   ├── contact/{page.tsx, ContactClient.tsx}
│   │   ├── mentions-legales/page.tsx
│   │   └── confidentialite/page.tsx
│   ├── (auth)/login/page.tsx                 # phase 2 placeholder
│   ├── (client)/dashboard/page.tsx           # phase 2 placeholder
│   ├── (admin)/dashboard/page.tsx            # phase 2 placeholder
│   ├── (formateur)/dashboard/page.tsx        # phase 2 placeholder
│   ├── actions/{devis.ts, contact.ts}
│   ├── layout.tsx
│   ├── globals.css
│   ├── fonts.ts
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── ui/{Button,Tag,Card,Accordion,Container}.tsx
│   ├── sections/{SectionHeader,HeroAccueil,HeroFormation,MetaBlock,MethodeCkim,CtaFinal}.tsx
│   ├── motion/{LenisProvider,FadeUp,LetterReveal,StatCounter,Marquee}.tsx
│   ├── forms/{DevisModal,ContactEntreprise,ContactParticulier}.tsx
│   └── layout/{Navbar,Footer,CookieBanner}.tsx
├── lib/
│   ├── formations/{index.ts, 15 formation files}
│   ├── types/formation.ts
│   ├── parcours.ts
│   ├── email/{resend.ts, templates/{devis,contact}.ts}
│   ├── validation/{devis,contact}.ts
│   └── utils.ts
├── public/images/formations/
├── tests/{validation,formations,parcours}.test.ts
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── vitest.config.ts
└── README.md
```

---

### Task 1: Bootstrap Next.js 16 project

**Files:**
- Create: `/Users/alantouati/ckim-formation/package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `.env.local.example`, `README.md`

- [ ] **Step 1: Initialize Next.js 16 with TypeScript and Tailwind v4**

```bash
cd /Users/alantouati/ckim-formation
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --turbopack --eslint
```

When prompted to overwrite existing files (the `.superpowers/` and `docs/` directories already exist): allow.

- [ ] **Step 2: Verify dev server runs**

Run: `npm run dev`
Open `http://localhost:3000` — expected: default Next.js welcome page.
Stop with Ctrl+C.

- [ ] **Step 3: Init git and first commit**

```bash
cd /Users/alantouati/ckim-formation
git init
git add .
git commit -m "chore: bootstrap Next.js 16 + Tailwind v4 project"
```

- [ ] **Step 4: Add `.superpowers/` to .gitignore**

Edit `.gitignore`, append:
```
.superpowers/
```

Then:
```bash
git add .gitignore
git commit -m "chore: ignore brainstorm artifacts"
```

---

### Task 2: Install runtime dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install motion, scroll, email, validation libs**

```bash
cd /Users/alantouati/ckim-formation
npm install framer-motion@^12 lenis@^1.1 resend@^4 zod@^3.23
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Verify install succeeds**

Run: `npm run dev`
Expected: server starts without errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install framer-motion, lenis, resend, zod, vitest"
```

---

### Task 3: Configure design tokens (Tailwind v4 + globals)

**Files:**
- Replace: `app/globals.css`
- Create: `app/fonts.ts`

- [ ] **Step 1: Replace `app/globals.css` with C-KIM design tokens**

```css
@import "tailwindcss";

@theme {
  --color-teal: #1B8FA0;
  --color-teal-d: #0F6070;
  --color-teal-l: #3AB5CA;
  --color-orange: #E8692A;
  --color-orange-l: #F5954A;
  --color-dark: #0A1A1E;
  --color-dark-2: #112228;
  --color-light: #EEF5F7;
  --color-text-dark: #D8EDEF;
  --color-muted: #7AACB2;

  --color-c-secu: #1B8FA0;
  --color-c-alim: #2E9E6A;
  --color-c-prev: #C4532A;
  --color-c-mana: #6A4ABE;
  --color-c-form: #E8692A;
  --color-c-dev: #2A7E9E;
  --color-c-qual: #2A5E9E;
  --color-c-cert: #9E7A2A;

  --font-display: var(--font-bebas), sans-serif;
  --font-sans: var(--font-dm-sans), sans-serif;
  --font-serif: var(--font-dm-serif), serif;
}

html, body {
  background: #FFFFFF;
  color: #0A1A1E;
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Create `app/fonts.ts` with next/font**

```typescript
import { Bebas_Neue, DM_Sans, DM_Serif_Display } from 'next/font/google';

export const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bebas',
});

export const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
});

export const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-serif',
});
```

- [ ] **Step 3: Wire fonts into `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { bebas, dmSans, dmSerif } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'C-KIM Formation — Sécurité au travail & développement humain',
  description: 'Centre de formation certifié Qualiopi à Draguignan (PACA). Sécurité, prévention, formateurs, développement humain.',
  metadataBase: new URL('https://ckim-formation.fr'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-FR" className={`${bebas.variable} ${dmSans.variable} ${dmSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Verify by editing `app/page.tsx` to test the tokens**

```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-white p-8">
      <h1 className="font-display text-6xl tracking-wide text-dark">FORMER <em className="not-italic text-teal">POUR</em> AGIR</h1>
      <p className="font-sans text-muted mt-4">Test design tokens</p>
      <div className="mt-4 flex gap-2">
        <span className="bg-teal text-white px-3 py-1">teal</span>
        <span className="bg-orange text-white px-3 py-1">orange</span>
        <span className="bg-light text-dark px-3 py-1">light</span>
        <span className="bg-dark text-white px-3 py-1">dark</span>
      </div>
    </main>
  );
}
```

Run `npm run dev`, open `http://localhost:3000` — expected: Bebas Neue title, color swatches matching tokens.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/fonts.ts app/layout.tsx app/page.tsx
git commit -m "feat: add C-KIM design tokens and fonts (Bebas, DM Sans, DM Serif)"
```

---

### Task 4: Configure Vitest

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 2: Create `tests/setup.ts`**

```typescript
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Add npm script in `package.json`**

In `"scripts"`, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify Vitest runs (no tests yet)**

Run: `npm test`
Expected: "No test files found" — that's fine, Vitest is wired.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts tests/setup.ts package.json
git commit -m "chore: configure Vitest"
```

---

### Task 5: Define `Formation` type and parcours metadata

**Files:**
- Create: `lib/types/formation.ts`, `lib/parcours.ts`
- Create: `tests/parcours.test.ts`

- [ ] **Step 1: Write failing test for parcours metadata**

`tests/parcours.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { PARCOURS_META, getParcoursMeta } from '@/lib/parcours';

describe('parcours metadata', () => {
  it('has all 8 parcours defined', () => {
    expect(Object.keys(PARCOURS_META)).toHaveLength(8);
  });

  it('returns metadata for a known parcours', () => {
    const meta = getParcoursMeta('securite');
    expect(meta.label).toBe('Sécurité');
    expect(meta.couleur).toBe('#1B8FA0');
  });
});
```

- [ ] **Step 2: Run test and confirm it fails**

Run: `npm test -- tests/parcours.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `lib/types/formation.ts`**

```typescript
export type Parcours =
  | 'securite'
  | 'alimentaire'
  | 'prevention'
  | 'management'
  | 'formateurs'
  | 'developpement'
  | 'qualite'
  | 'certifiant';

export interface Module {
  titre: string;
  points: string[];
}

export interface Formation {
  slug: string;
  titre: string;
  sousTitre?: string;
  parcours: Parcours;
  ref: string;
  hero: {
    image: string;
    alt: string;
  };
  infosPratiques: {
    duree: string;
    public: string;
    prerequis: string;
    prixIndicatif: string;
    modalite: string;
    inscription: string;
    recyclage?: string;
  };
  objectifs: string;
  programme: Module[];
  publicDetail?: string;
  evaluation: string;
  referencesReglementaires: string;
  formationsLiees: string[];
  seo: {
    title: string;
    description: string;
  };
}
```

- [ ] **Step 4: Create `lib/parcours.ts`**

```typescript
import type { Parcours } from './types/formation';

export interface ParcoursMeta {
  label: string;
  couleur: string;
  description: string;
}

export const PARCOURS_META: Record<Parcours, ParcoursMeta> = {
  securite: {
    label: 'Sécurité',
    couleur: '#1B8FA0',
    description: 'Incendie, habilitations électriques, prévention des risques sur le terrain.',
  },
  alimentaire: {
    label: 'Sécurité Alimentaire',
    couleur: '#2E9E6A',
    description: 'Méthode HACCP et hygiène en restauration collective et commerciale.',
  },
  prevention: {
    label: 'Prévention & Conformité',
    couleur: '#C4532A',
    description: 'DUERP, accompagnement clé en main, conformité réglementaire.',
  },
  management: {
    label: 'Management S&ST',
    couleur: '#6A4ABE',
    description: 'Élaboration DUERP et pilotage de la santé-sécurité au travail.',
  },
  formateurs: {
    label: 'Formateurs — Sécurité & Ingénierie',
    couleur: '#E8692A',
    description: 'Devenir formateur SST, incendie, gestes & postures, indépendant ou interne.',
  },
  developpement: {
    label: 'Développement Personnel',
    couleur: '#2A7E9E',
    description: 'PNL et préparation au contrôle Qualiopi pour formateurs.',
  },
  qualite: {
    label: 'Qualité & Conformité',
    couleur: '#2A5E9E',
    description: 'Préparer un contrôle qualité Qualiopi (RNQ).',
  },
  certifiant: {
    label: 'Certifiant — Titre Professionnel',
    couleur: '#9E7A2A',
    description: "Titre professionnel Formateur Professionnel d'Adultes (FPA).",
  },
};

export function getParcoursMeta(p: Parcours): ParcoursMeta {
  return PARCOURS_META[p];
}
```

- [ ] **Step 5: Run test, confirm pass**

Run: `npm test -- tests/parcours.test.ts`
Expected: 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/types/formation.ts lib/parcours.ts tests/parcours.test.ts
git commit -m "feat: add Formation type and parcours metadata"
```

---

### Task 6: Create formations registry + 1 sample (Incendie)

**Files:**
- Create: `lib/formations/incendie-extincteur-evacuation.ts`, `lib/formations/index.ts`
- Create: `tests/formations.test.ts`

- [ ] **Step 1: Write failing test**

`tests/formations.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { formations, getFormationBySlug } from '@/lib/formations';

describe('formations registry', () => {
  it('exposes at least one formation', () => {
    expect(formations.length).toBeGreaterThan(0);
  });

  it('finds a formation by slug', () => {
    const f = getFormationBySlug('incendie-extincteur-evacuation');
    expect(f).toBeDefined();
    expect(f?.titre).toContain('Incendie');
  });

  it('returns undefined for unknown slug', () => {
    expect(getFormationBySlug('does-not-exist')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `npm test -- tests/formations.test.ts`
Expected: FAIL.

- [ ] **Step 3: Create the sample formation file**

`lib/formations/incendie-extincteur-evacuation.ts`:
```typescript
import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'incendie-extincteur-evacuation',
  titre: 'Formation Incendie',
  sousTitre: 'Extincteur & Évacuation',
  parcours: 'securite',
  ref: 'SECU-01',
  hero: {
    image: '/images/formations/incendie.jpg',
    alt: "Manipulation d'un extincteur lors d'un exercice incendie",
  },
  infosPratiques: {
    duree: '2 heures ou 5 heures',
    public: 'Tout public',
    prerequis: 'Avoir 18 ans — Savoir lire et écrire',
    prixIndicatif: '70 à 200 € TTC',
    modalite: 'Présentiel — sur site client',
    inscription: '24h avant la session',
  },
  objectifs:
    "À la fin de cette formation, le stagiaire est capable de prévenir les risques d'incendie, mettre en œuvre les moyens d'extinction disponibles en attendant les secours, et procéder à l'évacuation de l'établissement en appliquant les consignes générales de sécurité.",
  programme: [
    {
      titre: 'Prévention du risque incendie',
      points: [
        'Le triangle du feu, classes de feux',
        "Causes courantes d'incendie en entreprise",
        'Comportement du feu et propagation',
        'Consignes générales de sécurité',
      ],
    },
    {
      titre: "Moyens d'extinction",
      points: [
        "Les différents types d'extincteurs",
        "Choix de l'extincteur selon la classe de feu",
        'Mise en œuvre pratique — manipulation sur feu réel',
      ],
    },
    {
      titre: 'Évacuation',
      points: [
        "Rôles : guide-file, serre-file, chargé d'évacuation",
        'Procédure et points de rassemblement',
        "Mise en situation — exercice d'évacuation simulé",
      ],
    },
  ],
  evaluation:
    'Attestation de formation et notification sur le registre de sécurité. Évaluation continue + mise en situation incendie simulée.',
  referencesReglementaires:
    'Articles R4227-28, R4227-39 et R4141-17 à R4141-20 du Code du Travail — Articles L4141-2, R4141-3 et R4141-13 (formation à la sécurité) — Recommandation APSAD R6.',
  formationsLiees: ['habilitation-electrique-h0-b0', 'formateur-incendie-gestes-postures'],
  seo: {
    title: 'Formation Incendie — Extincteur & Évacuation | C-KIM Formation',
    description: "Formation incendie certifiée à Draguignan (PACA). Manipulation d'extincteurs, évacuation, conformité Code du travail. Sur site, 2h ou 5h.",
  },
};
```

- [ ] **Step 4: Create `lib/formations/index.ts`**

```typescript
import type { Formation } from '@/lib/types/formation';
import { formation as incendie } from './incendie-extincteur-evacuation';

export const formations: Formation[] = [incendie];

export function getFormationBySlug(slug: string): Formation | undefined {
  return formations.find((f) => f.slug === slug);
}

export function getFormationsByParcours(parcours: Formation['parcours']): Formation[] {
  return formations.filter((f) => f.parcours === parcours);
}
```

- [ ] **Step 5: Run test, confirm pass**

Run: `npm test -- tests/formations.test.ts`
Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/formations tests/formations.test.ts
git commit -m "feat: add Formation registry and Incendie sample"
```

---

### Task 7: Build shared UI primitives (Button, Tag, Container)

**Files:**
- Create: `components/ui/Button.tsx`, `components/ui/Tag.tsx`, `components/ui/Container.tsx`, `lib/utils.ts`

- [ ] **Step 1: Create `lib/utils.ts`**

```typescript
type ClassValue = string | number | null | false | undefined;

export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(' ');
}
```

- [ ] **Step 2: Create `components/ui/Container.tsx`**

```tsx
import { cn } from '@/lib/utils';

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-6 md:px-10', className)}>{children}</div>;
}
```

- [ ] **Step 3: Create `components/ui/Button.tsx`**

```tsx
'use client';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark';

interface BaseProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-orange text-white hover:bg-orange-l',
  secondary: 'bg-teal text-white hover:bg-teal-l',
  ghost: 'border border-dark text-dark hover:bg-dark hover:text-white',
  dark: 'bg-dark text-white hover:bg-dark-2',
};

const BASE = 'inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider transition-all duration-200';

export function Button({ children, variant = 'primary', className, ...rest }: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(BASE, VARIANTS[variant], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({ children, variant = 'primary', className, href }: BaseProps & { href: string }) {
  return (
    <Link href={href} className={cn(BASE, VARIANTS[variant], className)}>
      {children}
    </Link>
  );
}
```

- [ ] **Step 4: Create `components/ui/Tag.tsx`**

```tsx
import { cn } from '@/lib/utils';

interface TagProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'solid' | 'outline';
  className?: string;
}

export function Tag({ children, color, variant = 'outline', className }: TagProps) {
  const style = color
    ? variant === 'solid'
      ? { backgroundColor: color, color: '#fff' }
      : { borderColor: color, color }
    : undefined;

  return (
    <span
      className={cn(
        'inline-block rounded-sm border px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.15em]',
        !color && variant === 'outline' && 'border-teal text-teal',
        !color && variant === 'solid' && 'border-transparent bg-teal text-white',
        className
      )}
      style={style}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 5: Smoke test on `app/page.tsx`**

```tsx
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Container } from '@/components/ui/Container';

export default function Home() {
  return (
    <main className="min-h-screen bg-white py-12">
      <Container>
        <div className="flex flex-wrap gap-3 mb-6">
          <Tag>Qualiopi</Tag>
          <Tag color="#E8692A" variant="solid">Sécurité</Tag>
          <Tag color="#2E9E6A">Alimentaire</Tag>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Demander un devis</Button>
          <Button variant="secondary">Voir les formations</Button>
          <Button variant="ghost">En savoir plus</Button>
          <Button variant="dark">Contact</Button>
        </div>
      </Container>
    </main>
  );
}
```

Run `npm run dev`, open `http://localhost:3000` — expected: tags + 4 buttons in their variants.

- [ ] **Step 6: Commit**

```bash
git add components/ui lib/utils.ts app/page.tsx
git commit -m "feat: Button, Tag, Container primitives"
```

---

### Task 8: Build motion components (LenisProvider, FadeUp, LetterReveal, StatCounter, Marquee)

**Files:**
- Create: 5 files in `components/motion/`

- [ ] **Step 1: Create `components/motion/LenisProvider.tsx`**

```tsx
'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, []);
  return <>{children}</>;
}
```

- [ ] **Step 2: Create `components/motion/FadeUp.tsx`**

```tsx
'use client';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export function FadeUp({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 3: Create `components/motion/LetterReveal.tsx`**

```tsx
'use client';
import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  text: string;
  className?: string;
  staggerDelay?: number;
  delay?: number;
}

export function LetterReveal({ text, className, staggerDelay = 0.04, delay = 0 }: Props) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{text}</span>;

  const letters = Array.from(text);
  return (
    <span className={className} aria-label={text}>
      {letters.map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: delay + i * staggerDelay, ease: 'easeOut' }}
          style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}
```

- [ ] **Step 4: Create `components/motion/StatCounter.tsx`**

```tsx
'use client';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export function StatCounter({ to, suffix = '', duration = 1.6 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      setV(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, to, duration]);

  return (
    <motion.span ref={ref}>
      {v}{suffix}
    </motion.span>
  );
}
```

- [ ] **Step 5: Create `components/motion/Marquee.tsx`**

```tsx
'use client';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export function Marquee({ children, speed = 30 }: { children: ReactNode; speed?: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex whitespace-nowrap gap-12"
        animate={reduce ? undefined : { x: ['0%', '-50%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      >
        <div className="flex gap-12 shrink-0">{children}</div>
        <div className="flex gap-12 shrink-0" aria-hidden>{children}</div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 6: Wire LenisProvider into root layout**

Edit `app/layout.tsx`, replace the body:
```tsx
import { LenisProvider } from '@/components/motion/LenisProvider';
// ...
<body>
  <LenisProvider>{children}</LenisProvider>
</body>
```

- [ ] **Step 7: Smoke test**

Replace `app/page.tsx` body:
```tsx
import { Container } from '@/components/ui/Container';
import { LetterReveal } from '@/components/motion/LetterReveal';
import { FadeUp } from '@/components/motion/FadeUp';
import { StatCounter } from '@/components/motion/StatCounter';
import { Marquee } from '@/components/motion/Marquee';

export default function Home() {
  return (
    <main className="min-h-[200vh] bg-white py-24">
      <Container>
        <h1 className="font-display text-7xl tracking-wide">
          <LetterReveal text="FORMER POUR AGIR" />
        </h1>
        <div className="mt-32">
          <FadeUp>
            <p className="font-display text-4xl">
              <StatCounter to={15} /> formations
            </p>
          </FadeUp>
        </div>
        <div className="mt-16">
          <Marquee>
            <span className="font-display text-3xl">QUALIOPI</span>
            <span className="font-display text-3xl">·</span>
            <span className="font-display text-3xl">INRS</span>
            <span className="font-display text-3xl">·</span>
            <span className="font-display text-3xl">AFNOR</span>
            <span className="font-display text-3xl">·</span>
          </Marquee>
        </div>
      </Container>
    </main>
  );
}
```

Run `npm run dev`, scroll the page — expected: letter reveal animates on load, counter animates on scroll, marquee scrolls infinitely.

- [ ] **Step 8: Commit**

```bash
git add components/motion app/layout.tsx app/page.tsx
git commit -m "feat: motion primitives (Lenis, FadeUp, LetterReveal, StatCounter, Marquee)"
```

---

### Task 9: Build Navbar, Footer, and (public) layout

**Files:**
- Create: `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`, `app/(public)/layout.tsx`

- [ ] **Step 1: Create `components/layout/Navbar.tsx`**

```tsx
'use client';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { useEffect, useState } from 'react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur shadow-sm' : 'bg-transparent'
      }`}
    >
      <Container className="flex h-20 items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-[0.25em] text-dark">C-KIM</Link>
        <nav className="hidden md:flex gap-8 font-sans text-sm font-semibold uppercase tracking-wider">
          <Link href="/organisme" className="hover:text-teal">L'organisme</Link>
          <Link href="/formations" className="hover:text-teal">Formations</Link>
          <Link href="/contact" className="hover:text-teal">Contact</Link>
        </nav>
        <ButtonLink href="/contact" variant="primary" className="hidden md:inline-flex">Demander un devis</ButtonLink>
      </Container>
    </header>
  );
}
```

- [ ] **Step 2: Create `components/layout/Footer.tsx`**

```tsx
import Link from 'next/link';
import { Container } from '@/components/ui/Container';

export function Footer() {
  return (
    <footer className="bg-dark text-white py-16 mt-32">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/10">
          <div>
            <p className="font-display text-2xl tracking-[0.25em]">C-KIM FORMATION</p>
            <p className="mt-3 text-sm text-muted leading-relaxed">
              Centre de formation certifié Qualiopi — Sécurité, prévention et développement humain. Draguignan (83), région PACA.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-l mb-3">Navigation</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-teal-l">Accueil</Link></li>
              <li><Link href="/organisme" className="hover:text-teal-l">L'organisme</Link></li>
              <li><Link href="/formations" className="hover:text-teal-l">Formations</Link></li>
              <li><Link href="/contact" className="hover:text-teal-l">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-l mb-3">Contact</p>
            <ul className="space-y-2 text-sm">
              <li><a href="tel:0662515659" className="hover:text-teal-l">06 62 51 56 59</a></li>
              <li><a href="mailto:ckimsecuriteformation@gmail.com" className="hover:text-teal-l break-all">ckimsecuriteformation@gmail.com</a></li>
              <li className="text-muted">Draguignan (83) — PACA</li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-l mb-3">Légal</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/mentions-legales" className="hover:text-teal-l">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-teal-l">Confidentialité</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
          <p>© {new Date().getFullYear()} C-KIM Formation — Tous droits réservés</p>
          <p>Certifié Qualiopi · Formateurs INRS / AFNOR / FPA</p>
        </div>
      </Container>
    </footer>
  );
}
```

- [ ] **Step 3: Create `app/(public)/layout.tsx`**

```tsx
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-20">{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Move home page into the (public) group**

```bash
mkdir -p app/\(public\)
git mv app/page.tsx app/\(public\)/page.tsx
```

Open `http://localhost:3000` — expected: navbar visible, scroll triggers backdrop-blur, footer at bottom.

- [ ] **Step 5: Commit**

```bash
git add app components/layout
git commit -m "feat: Navbar, Footer, (public) layout group"
```

---

### Task 10: Home page hero (HeroAccueil)

**Files:**
- Create: `components/sections/HeroAccueil.tsx`
- Modify: `app/(public)/page.tsx`

- [ ] **Step 1: Create `components/sections/HeroAccueil.tsx`**

```tsx
'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { LetterReveal } from '@/components/motion/LetterReveal';

export function HeroAccueil() {
  const reduce = useReducedMotion();
  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-dark text-white">
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 90% 70% at 110% 20%, rgba(27,143,160,.30), transparent 55%), radial-gradient(ellipse 70% 80% at -15% 90%, rgba(232,105,42,.18), transparent 50%)',
        }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(90deg,rgba(27,143,160,.08) 1px,transparent 1px),linear-gradient(rgba(27,143,160,.08) 1px,transparent 1px)',
          backgroundSize: '22px 22px',
        }}
        animate={reduce ? undefined : { backgroundPosition: ['0px 0px', '22px 22px'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-teal via-teal-l to-orange" />
      <Container className="relative z-10 flex flex-col justify-center min-h-[92vh] py-24">
        <motion.p
          className="text-xs uppercase tracking-[0.4em] text-teal-l mb-6 flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="inline-block w-8 h-[2px] bg-teal-l" />
          Centre de formation certifié Qualiopi — Draguignan (83)
        </motion.p>
        <h1 className="font-display text-6xl md:text-8xl lg:text-[120px] leading-[0.88] tracking-wide mb-8">
          <LetterReveal text="FORMER" delay={0.1} /><br />
          <span className="text-teal-l"><LetterReveal text="POUR" delay={0.4} /></span>{' '}
          <LetterReveal text="AGIR" delay={0.6} />
        </h1>
        <motion.p
          className="text-base md:text-lg text-muted max-w-xl leading-relaxed mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          Sécurité au travail · Prévention des risques · Développement humain. 60 à 80 % de pratique, formateurs certifiés INRS, AFNOR et FPA, intervention sur site partout en région PACA.
        </motion.p>
        <motion.div
          className="flex flex-wrap gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <ButtonLink href="/formations" variant="primary">Découvrir les formations</ButtonLink>
          <ButtonLink href="/contact" variant="ghost" className="border-white/40 text-white hover:bg-white hover:text-dark">
            Demander un devis
          </ButtonLink>
        </motion.div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Use it in the home page**

Replace `app/(public)/page.tsx` body:
```tsx
import { HeroAccueil } from '@/components/sections/HeroAccueil';

export default function Home() {
  return (
    <>
      <HeroAccueil />
    </>
  );
}
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:3000` — expected: dark hero, animated grid, gradient bar at top, letter-reveal cascade, two CTA buttons.

- [ ] **Step 4: Commit**

```bash
git add components/sections/HeroAccueil.tsx app/\(public\)/page.tsx
git commit -m "feat: home hero with letter reveal and animated grid"
```

---

### Task 11: Home page sections (manifesto, stats, parcours preview, CTA, marquee)

**Files:**
- Modify: `app/(public)/page.tsx`
- Create: `components/sections/SectionHeader.tsx`

- [ ] **Step 1: Create `components/sections/SectionHeader.tsx`**

```tsx
import { cn } from '@/lib/utils';

interface Props {
  eyebrow?: string;
  titre: string;
  accent?: string;
  description?: string;
  align?: 'left' | 'center';
  invert?: boolean;
}

export function SectionHeader({ eyebrow, titre, accent, description, align = 'left', invert = false }: Props) {
  let titleNode: React.ReactNode = titre;
  if (accent && titre.includes(accent)) {
    const [before, after] = titre.split(accent);
    titleNode = (
      <>
        {before}
        <em className={cn('not-italic', invert ? 'text-teal-l' : 'text-teal')}>{accent}</em>
        {after}
      </>
    );
  }
  return (
    <header className={cn('mb-12', align === 'center' && 'text-center')}>
      {eyebrow && (
        <p className={cn('text-xs uppercase tracking-[0.3em] mb-4', invert ? 'text-teal-l' : 'text-orange')}>
          {eyebrow}
        </p>
      )}
      <h2 className={cn('font-display text-4xl md:text-6xl tracking-wide leading-none', invert ? 'text-white' : 'text-dark')}>
        {titleNode}
      </h2>
      {description && (
        <p className={cn('mt-6 max-w-2xl text-base md:text-lg leading-relaxed', invert ? 'text-muted' : 'text-dark/70')}>
          {description}
        </p>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Build out the home page sections**

Replace `app/(public)/page.tsx`:
```tsx
import Link from 'next/link';
import { HeroAccueil } from '@/components/sections/HeroAccueil';
import { SectionHeader } from '@/components/sections/SectionHeader';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { FadeUp } from '@/components/motion/FadeUp';
import { StatCounter } from '@/components/motion/StatCounter';
import { Marquee } from '@/components/motion/Marquee';
import { PARCOURS_META } from '@/lib/parcours';

export default function Home() {
  return (
    <>
      <HeroAccueil />

      {/* Manifesto - white */}
      <section className="bg-white py-24">
        <Container>
          <FadeUp>
            <SectionHeader
              eyebrow="Notre approche"
              titre="Apprendre par la pratique."
              accent="pratique"
              description="60 à 80 % de pratique, formateurs certifiés, intervention directement sur votre site. Une pédagogie ancrée dans la réalité terrain de vos équipes pour des compétences durables."
            />
          </FadeUp>
        </Container>
      </section>

      {/* Stats - light */}
      <section className="bg-light py-24">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { n: 15, s: '', label: 'Formations' },
              { n: 8, s: '', label: 'Parcours' },
              { n: 100, s: '%', label: 'Qualiopi' },
              { n: 80, s: '%', label: 'Pratique' },
            ].map((stat, i) => (
              <FadeUp key={stat.label} delay={i * 0.08}>
                <div>
                  <p className="font-display text-6xl md:text-7xl text-teal leading-none">
                    <StatCounter to={stat.n} suffix={stat.s} />
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-dark/60">{stat.label}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </Container>
      </section>

      {/* Parcours preview - white */}
      <section className="bg-white py-24">
        <Container>
          <FadeUp>
            <SectionHeader
              eyebrow="Catalogue"
              titre="8 parcours, 15 formations."
              accent="15 formations"
              description="Un catalogue couvrant la sécurité au travail, la prévention, le management, les formateurs et le développement humain."
            />
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {Object.entries(PARCOURS_META).map(([key, meta], i) => (
              <FadeUp key={key} delay={i * 0.05}>
                <Link
                  href={`/formations#${key}`}
                  className="block bg-white border border-light rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="h-1 w-12 mb-4" style={{ backgroundColor: meta.couleur }} />
                  <h3 className="font-display text-2xl tracking-wide text-dark">{meta.label}</h3>
                  <p className="mt-2 text-sm text-dark/60 leading-relaxed">{meta.description}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.2em]" style={{ color: meta.couleur }}>
                    Découvrir →
                  </p>
                </Link>
              </FadeUp>
            ))}
          </div>
          <FadeUp delay={0.4}>
            <div className="mt-12 text-center">
              <ButtonLink href="/formations" variant="dark">Voir toutes les formations</ButtonLink>
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* Citation - dark */}
      <section className="bg-dark text-white py-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal via-teal-l to-orange" />
        <Container>
          <FadeUp>
            <p className="font-serif italic text-3xl md:text-5xl leading-[1.2] max-w-4xl">
              « La sécurité, ça <span className="text-teal-l">s'apprend</span>. La performance, ça se <span className="text-orange">construit</span>. »
            </p>
            <p className="mt-8 text-sm uppercase tracking-[0.3em] text-muted">— L'équipe C-KIM Formation</p>
          </FadeUp>
        </Container>
      </section>

      {/* Marquee - white */}
      <section className="bg-white py-12 border-y border-light">
        <Marquee speed={40}>
          {['QUALIOPI', '·', 'INRS', '·', 'AFNOR', '·', 'FPA', '·', 'CODE DU TRAVAIL', '·', 'APSAD', '·'].map((label, i) => (
            <span key={i} className="font-display text-3xl tracking-[0.2em] text-dark/60">{label}</span>
          ))}
        </Marquee>
      </section>

      {/* Final CTA - light */}
      <section className="bg-light py-24">
        <Container>
          <FadeUp>
            <div className="text-center max-w-3xl mx-auto">
              <SectionHeader
                align="center"
                eyebrow="Démarrer"
                titre="Une formation pour votre équipe ?"
                accent="votre équipe"
                description="Demandez un devis personnalisé pour votre site. Réponse sous 24h."
              />
              <div className="flex flex-wrap gap-4 justify-center mt-8">
                <ButtonLink href="/contact" variant="primary">Demander un devis</ButtonLink>
                <a href="tel:0662515659" className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider border border-dark text-dark hover:bg-dark hover:text-white transition-all">
                  06 62 51 56 59
                </a>
              </div>
            </div>
          </FadeUp>
        </Container>
      </section>
    </>
  );
}
```

- [ ] **Step 3: Verify**

Scroll the page — expected: alternating section backgrounds (dark / white / light / white / dark / white / light), all sections fade-up on scroll, stats animate, marquee scrolls infinitely.

- [ ] **Step 4: Commit**

```bash
git add components/sections/SectionHeader.tsx app/\(public\)/page.tsx
git commit -m "feat: home page sections (manifesto, stats, parcours preview, marquee, CTA)"
```

---

### Task 12: Page Organisme

**Files:**
- Create: `app/(public)/organisme/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/sections/SectionHeader';
import { ButtonLink } from '@/components/ui/Button';
import { FadeUp } from '@/components/motion/FadeUp';
import { Tag } from '@/components/ui/Tag';

export const metadata: Metadata = {
  title: "L'organisme C-KIM Formation — Qualiopi, méthode, formateurs",
  description: 'Centre de formation certifié Qualiopi en région PACA. Formateurs certifiés INRS, AFNOR, FPA. 60-80% de pratique, intervention sur site.',
};

export default function OrganismePage() {
  return (
    <>
      {/* Hero - dark */}
      <section className="bg-dark text-white py-32 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-teal via-teal-l to-orange" />
        <Container className="relative">
          <p className="text-xs uppercase tracking-[0.4em] text-teal-l mb-4">L'organisme</p>
          <h1 className="font-display text-6xl md:text-8xl tracking-wide leading-[0.9]">
            Une équipe<br/>
            <em className="not-italic text-teal-l">terrain.</em>
          </h1>
          <p className="mt-8 text-lg text-muted max-w-2xl leading-relaxed">
            C-KIM Formation est implanté en Provence-Alpes-Côte d'Azur, spécialisé dans la sécurité au travail, la prévention des risques professionnels et le développement humain. Certifié Qualiopi, nous intervenons directement sur site client pour des formations ancrées dans la réalité terrain.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Tag color="#3AB5CA">Qualiopi</Tag>
            <Tag color="#3AB5CA">INRS</Tag>
            <Tag color="#3AB5CA">AFNOR</Tag>
            <Tag color="#3AB5CA">FPA</Tag>
          </div>
        </Container>
      </section>

      {/* Méthode - white */}
      <section className="bg-white py-24">
        <Container>
          <FadeUp>
            <SectionHeader
              eyebrow="Notre méthode"
              titre="60 à 80 % de pratique."
              accent="pratique"
              description="Une approche ludopédagogique pour favoriser l'ancrage durable des compétences. Chaque session est construite autour de mises en situation réelles, adaptées au contexte métier de vos équipes."
            />
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[
              { n: '01', t: 'Diagnostic terrain', d: 'Analyse de vos risques et besoins spécifiques avant la session.' },
              { n: '02', t: 'Pratique immersive', d: '60 à 80 % du temps en situation réelle, avec matériel professionnel.' },
              { n: '03', t: 'Ancrage durable', d: 'Évaluation continue + livrables (attestation, registre) pour assurer la conformité.' },
            ].map((step, i) => (
              <FadeUp key={step.n} delay={i * 0.1}>
                <div className="bg-light rounded-lg p-8 h-full">
                  <p className="font-display text-5xl text-orange leading-none">{step.n}</p>
                  <h3 className="font-display text-2xl mt-4 tracking-wide">{step.t}</h3>
                  <p className="mt-3 text-sm text-dark/70 leading-relaxed">{step.d}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </Container>
      </section>

      {/* Formateurs - light */}
      <section className="bg-light py-24">
        <Container>
          <FadeUp>
            <SectionHeader
              eyebrow="Nos formateurs"
              titre="Certifiés et expérimentés."
              accent="Certifiés"
              description="Tous nos formateurs sont titulaires du titre FPA (Formateur Professionnel d'Adultes), certifiés INRS et auditeurs Qualiopi AFNOR. Ils interviennent sur le terrain depuis plusieurs années."
            />
          </FadeUp>
        </Container>
      </section>

      {/* CTA - dark */}
      <section className="bg-dark text-white py-24">
        <Container>
          <FadeUp>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-display text-4xl md:text-5xl tracking-wide">Prêts à former vos équipes ?</h2>
              <p className="mt-4 text-muted">Devis sous 24h pour toute demande.</p>
              <div className="mt-8 flex justify-center gap-4 flex-wrap">
                <ButtonLink href="/formations" variant="primary">Voir les formations</ButtonLink>
                <ButtonLink href="/contact" variant="secondary">Nous contacter</ButtonLink>
              </div>
            </div>
          </FadeUp>
        </Container>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Verify**

Open `http://localhost:3000/organisme` — expected: hero dark, méthode (3 steps in light cards), formateurs (light), final CTA (dark).

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/organisme
git commit -m "feat: organisme page"
```

---

### Task 13: Page Formations index (grouped by parcours)

**Files:**
- Create: `app/(public)/formations/page.tsx`

- [ ] **Step 1: Create the index page**

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { FadeUp } from '@/components/motion/FadeUp';
import { Tag } from '@/components/ui/Tag';
import { formations } from '@/lib/formations';
import { PARCOURS_META } from '@/lib/parcours';
import type { Parcours } from '@/lib/types/formation';

export const metadata: Metadata = {
  title: 'Formations — Catalogue C-KIM Formation',
  description: 'Découvrez nos 15 formations en sécurité au travail, prévention, management S&ST et développement humain. Certifiées Qualiopi, intervention en région PACA.',
};

export default function FormationsIndex() {
  const grouped = (Object.keys(PARCOURS_META) as Parcours[]).map((key) => ({
    key,
    meta: PARCOURS_META[key],
    items: formations.filter((f) => f.parcours === key),
  }));

  return (
    <>
      {/* Hero - dark */}
      <section className="bg-dark text-white py-32 relative">
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-teal via-teal-l to-orange" />
        <Container>
          <p className="text-xs uppercase tracking-[0.4em] text-teal-l mb-4">Catalogue</p>
          <h1 className="font-display text-6xl md:text-8xl tracking-wide leading-[0.9]">
            Toutes nos<br/><em className="not-italic text-teal-l">formations.</em>
          </h1>
          <p className="mt-8 text-muted max-w-xl">
            15 formations réparties en 8 parcours. Toutes certifiées Qualiopi, dispensées en région PACA, sur votre site.
          </p>
        </Container>
      </section>

      {grouped.map((g, gi) => (
        g.items.length === 0 ? null : (
          <section
            key={g.key}
            id={g.key}
            className={gi % 2 === 0 ? 'bg-white py-20' : 'bg-light py-20'}
          >
            <Container>
              <FadeUp>
                <div className="flex items-center gap-4 mb-10">
                  <span className="h-10 w-1 rounded" style={{ backgroundColor: g.meta.couleur }} />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em]" style={{ color: g.meta.couleur }}>Parcours</p>
                    <h2 className="font-display text-3xl md:text-5xl tracking-wide">{g.meta.label}</h2>
                  </div>
                </div>
              </FadeUp>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {g.items.map((f, i) => (
                  <FadeUp key={f.slug} delay={i * 0.06}>
                    <Link
                      href={`/formations/${f.slug}`}
                      className="block bg-white rounded-lg overflow-hidden border border-light hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full"
                    >
                      <div className="h-1" style={{ backgroundColor: g.meta.couleur }} />
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <Tag color={g.meta.couleur}>{f.ref}</Tag>
                          <span className="text-xs text-dark/50">{f.infosPratiques.duree}</span>
                        </div>
                        <h3 className="font-display text-2xl tracking-wide leading-tight mb-2">
                          {f.titre}
                          {f.sousTitre && <><br/><span className="text-dark/60 text-lg">{f.sousTitre}</span></>}
                        </h3>
                        <p className="text-sm text-dark/70 line-clamp-3 mt-3 leading-relaxed">{f.objectifs}</p>
                        <p className="mt-4 text-xs uppercase tracking-[0.2em]" style={{ color: g.meta.couleur }}>
                          Voir la formation →
                        </p>
                      </div>
                    </Link>
                  </FadeUp>
                ))}
              </div>
            </Container>
          </section>
        )
      ))}
    </>
  );
}
```

- [ ] **Step 2: Verify**

Open `http://localhost:3000/formations` — expected: hero, then sections by parcours (only Sécurité visible right now with the 1 sample formation).

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/formations/page.tsx
git commit -m "feat: formations index grouped by parcours"
```

---

### Task 14: Formation detail page (template figé)

**Files:**
- Create: `app/(public)/formations/[slug]/page.tsx`
- Create: `components/sections/HeroFormation.tsx`, `MetaBlock.tsx`, `MethodeCkim.tsx`, `CtaFinal.tsx`
- Create: `components/ui/Accordion.tsx`

- [ ] **Step 1: Create `components/ui/Accordion.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Item {
  titre: string;
  points: string[];
}

export function Accordion({ items, color }: { items: Item[]; color: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-lg overflow-hidden border border-light">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-5 text-left"
            aria-expanded={open === i}
          >
            <span className="flex items-center gap-4">
              <span className="font-display text-xl" style={{ color }}>{String(i + 1).padStart(2, '0')}</span>
              <span className="font-sans font-semibold uppercase tracking-wide text-sm">{item.titre}</span>
            </span>
            <span
              className="text-2xl leading-none transition-transform"
              style={{ color, transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)' }}
            >+</span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <ul className="p-5 pt-0 space-y-2">
                  {item.points.map((p, pi) => (
                    <li key={pi} className="flex gap-3 text-sm text-dark/80 leading-relaxed">
                      <span style={{ color }}>›</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `components/sections/HeroFormation.tsx`**

```tsx
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Tag } from '@/components/ui/Tag';
import type { Formation } from '@/lib/types/formation';
import type { ParcoursMeta } from '@/lib/parcours';

export function HeroFormation({ formation, meta }: { formation: Formation; meta: ParcoursMeta }) {
  return (
    <section className="relative h-[80vh] min-h-[560px] overflow-hidden bg-dark text-white">
      <Image
        src={formation.hero.image}
        alt={formation.hero.alt}
        fill
        priority
        className="object-cover opacity-50"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(10,26,30,.4) 0%, rgba(10,26,30,.85) 100%)' }}
      />
      <div className="absolute top-0 inset-x-0 h-[3px]" style={{ backgroundColor: meta.couleur }} />
      <Container className="relative z-10 flex flex-col justify-end h-full pb-16">
        <div className="flex items-center gap-3 mb-6">
          <Tag color={meta.couleur} variant="solid">{meta.label}</Tag>
          <span className="text-xs uppercase tracking-[0.2em] text-white/60">{formation.ref}</span>
        </div>
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wide leading-[0.9]">
          {formation.titre}
          {formation.sousTitre && (<><br/><span className="text-teal-l">{formation.sousTitre}</span></>)}
        </h1>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Create `components/sections/MetaBlock.tsx`**

```tsx
import { Container } from '@/components/ui/Container';
import type { Formation } from '@/lib/types/formation';

export function MetaBlock({ formation, color }: { formation: Formation; color: string }) {
  const i = formation.infosPratiques;
  const items = [
    { label: 'Durée', value: i.duree },
    { label: 'Public', value: i.public },
    { label: 'Prix indicatif', value: i.prixIndicatif },
    { label: 'Modalité', value: i.modalite },
    { label: 'Inscription', value: i.inscription },
    ...(i.recyclage ? [{ label: 'Recyclage', value: i.recyclage }] : []),
  ];
  return (
    <div className="bg-white sticky top-20 z-30 border-b border-light">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4 py-4">
          {items.map((it) => (
            <div key={it.label}>
              <p className="text-[10px] uppercase tracking-[0.15em] text-dark/50">{it.label}</p>
              <p className="text-sm font-semibold mt-1" style={{ color }}>{it.value}</p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
```

- [ ] **Step 4: Create `components/sections/MethodeCkim.tsx`**

```tsx
import { Container } from '@/components/ui/Container';
import { FadeUp } from '@/components/motion/FadeUp';

export function MethodeCkim() {
  return (
    <section className="bg-dark text-white py-24">
      <Container>
        <FadeUp>
          <p className="text-xs uppercase tracking-[0.4em] text-teal-l mb-4">Méthode C-KIM</p>
          <h2 className="font-display text-4xl md:text-6xl tracking-wide leading-[0.95] max-w-3xl">
            Apprendre en <em className="not-italic text-teal-l">faisant</em>.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div>
              <p className="font-display text-5xl text-orange leading-none">60-80%</p>
              <p className="text-sm uppercase tracking-[0.15em] text-muted mt-2">de pratique</p>
              <p className="text-sm text-muted/80 mt-2 leading-relaxed">Mises en situation réelles, matériel professionnel.</p>
            </div>
            <div>
              <p className="font-display text-5xl text-teal-l leading-none">SUR SITE</p>
              <p className="text-sm uppercase tracking-[0.15em] text-muted mt-2">intervention chez vous</p>
              <p className="text-sm text-muted/80 mt-2 leading-relaxed">Adaptation au contexte métier de vos équipes.</p>
            </div>
            <div>
              <p className="font-display text-5xl text-teal-l leading-none">CERTIFIÉS</p>
              <p className="text-sm uppercase tracking-[0.15em] text-muted mt-2">INRS · AFNOR · FPA</p>
              <p className="text-sm text-muted/80 mt-2 leading-relaxed">Auditeurs Qualiopi, formateurs professionnels d'adultes.</p>
            </div>
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}
```

- [ ] **Step 5: Create `components/sections/CtaFinal.tsx` (with temporary alert stub)**

```tsx
'use client';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import type { Formation } from '@/lib/types/formation';
// import { useDevisModal } from '@/components/forms/DevisModal'; // wired in Task 18

export function CtaFinal({ formation }: { formation: Formation }) {
  // Temporary stub until DevisModal exists (Task 18 will replace this)
  const open = (titre: string) => {
    alert(`Devis pour : ${titre}`);
  };
  return (
    <section className="bg-light py-24">
      <Container>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl tracking-wide leading-[1.05]">
            Cette formation vous <em className="not-italic text-teal">intéresse</em> ?
          </h2>
          <p className="mt-4 text-dark/70">Devis personnalisé sous 24h. Intervention partout en région PACA.</p>
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <Button variant="primary" onClick={() => open(formation.titre)}>Demander un devis</Button>
            <a href="tel:0662515659" className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider border border-dark text-dark hover:bg-dark hover:text-white transition-all">
              06 62 51 56 59
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 6: Create the dynamic page**

`app/(public)/formations/[slug]/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Tag } from '@/components/ui/Tag';
import { Accordion } from '@/components/ui/Accordion';
import { FadeUp } from '@/components/motion/FadeUp';
import { HeroFormation } from '@/components/sections/HeroFormation';
import { MetaBlock } from '@/components/sections/MetaBlock';
import { MethodeCkim } from '@/components/sections/MethodeCkim';
import { CtaFinal } from '@/components/sections/CtaFinal';
import { formations, getFormationBySlug } from '@/lib/formations';
import { getParcoursMeta } from '@/lib/parcours';

interface PageProps { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return formations.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const f = getFormationBySlug(slug);
  if (!f) return {};
  return { title: f.seo.title, description: f.seo.description };
}

export default async function FormationPage({ params }: PageProps) {
  const { slug } = await params;
  const formation = getFormationBySlug(slug);
  if (!formation) notFound();
  const meta = getParcoursMeta(formation.parcours);
  const liees = formation.formationsLiees
    .map((s) => getFormationBySlug(s))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));

  return (
    <>
      <HeroFormation formation={formation} meta={meta} />
      <MetaBlock formation={formation} color={meta.couleur} />

      {/* 3. Objectifs - white */}
      <section className="bg-white py-20">
        <Container className="max-w-4xl">
          <FadeUp>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: meta.couleur }}>Objectifs</p>
            <h2 className="font-display text-3xl md:text-5xl tracking-wide mt-3 leading-[1.05]">
              Ce que vous saurez <em className="not-italic" style={{ color: meta.couleur }}>faire</em>.
            </h2>
            <p className="mt-6 text-lg text-dark/80 leading-relaxed">{formation.objectifs}</p>
          </FadeUp>
        </Container>
      </section>

      {/* 4. Programme - light */}
      <section className="bg-light py-20">
        <Container className="max-w-4xl">
          <FadeUp>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: meta.couleur }}>Programme</p>
            <h2 className="font-display text-3xl md:text-5xl tracking-wide mt-3 leading-[1.05]">
              Programme <em className="not-italic" style={{ color: meta.couleur }}>détaillé</em>.
            </h2>
            <div className="mt-8">
              <Accordion items={formation.programme} color={meta.couleur} />
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* 5. Public & prérequis - white */}
      <section className="bg-white py-20">
        <Container className="max-w-4xl">
          <FadeUp>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: meta.couleur }}>Public visé</p>
                <h3 className="font-display text-2xl md:text-3xl tracking-wide mt-3">Pour qui ?</h3>
                <p className="mt-4 text-dark/80 leading-relaxed">
                  {formation.publicDetail || formation.infosPratiques.public}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: meta.couleur }}>Prérequis</p>
                <h3 className="font-display text-2xl md:text-3xl tracking-wide mt-3">Avant la formation</h3>
                <p className="mt-4 text-dark/80 leading-relaxed">{formation.infosPratiques.prerequis}</p>
              </div>
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* 6. Évaluation - light */}
      <section className="bg-light py-20">
        <Container className="max-w-4xl">
          <FadeUp>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: meta.couleur }}>Évaluation</p>
            <h2 className="font-display text-3xl md:text-5xl tracking-wide mt-3 leading-[1.05]">
              Modalités d'<em className="not-italic" style={{ color: meta.couleur }}>évaluation</em>.
            </h2>
            <p className="mt-6 text-lg text-dark/80 leading-relaxed">{formation.evaluation}</p>
          </FadeUp>
        </Container>
      </section>

      {/* 7. Références - white */}
      <section className="bg-white py-20">
        <Container className="max-w-4xl">
          <FadeUp>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: meta.couleur }}>Cadre légal</p>
            <h2 className="font-display text-3xl md:text-5xl tracking-wide mt-3 leading-[1.05]">
              Références <em className="not-italic" style={{ color: meta.couleur }}>réglementaires</em>.
            </h2>
            <div className="mt-6 p-6 bg-light rounded-lg border-l-4" style={{ borderColor: meta.couleur }}>
              <p className="text-sm text-dark/80 leading-relaxed">{formation.referencesReglementaires}</p>
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* 8. Méthode C-KIM (transverse) - dark */}
      <MethodeCkim />

      {/* 9. CTA final - light */}
      <CtaFinal formation={formation} />

      {/* 10. Formations liées - white */}
      {liees.length > 0 && (
        <section className="bg-white py-20 border-t border-light">
          <Container>
            <FadeUp>
              <p className="text-xs uppercase tracking-[0.3em] text-orange">Pour aller plus loin</p>
              <h2 className="font-display text-3xl md:text-4xl tracking-wide mt-3">Formations liées</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {liees.map((f) => (
                  <Link
                    key={f.slug}
                    href={`/formations/${f.slug}`}
                    className="block bg-light rounded-lg p-6 hover:shadow-lg transition-all"
                  >
                    <Tag color={getParcoursMeta(f.parcours).couleur}>{f.ref}</Tag>
                    <h3 className="font-display text-xl mt-3 tracking-wide">{f.titre}</h3>
                    <p className="text-xs text-dark/60 mt-2">{f.infosPratiques.duree}</p>
                  </Link>
                ))}
              </div>
            </FadeUp>
          </Container>
        </section>
      )}
    </>
  );
}
```

- [ ] **Step 7: Add a placeholder hero photo**

```bash
mkdir -p public/images/formations
curl -L "https://images.unsplash.com/photo-1585150841593-1ac21cc4cdb2?w=1600&q=80" -o public/images/formations/incendie.jpg
```

- [ ] **Step 8: Configure next/image (no remote needed since local)**

`next.config.ts` already supports local files. No change.

- [ ] **Step 9: Verify**

Open `http://localhost:3000/formations/incendie-extincteur-evacuation` — expected: full formation page with all 10 sections, accordion working, sticky meta block, alert on devis click (temporary).

- [ ] **Step 10: Commit**

```bash
git add app/\(public\)/formations/\[slug\] components/sections components/ui/Accordion.tsx public/images
git commit -m "feat: formation detail page with all 10 sections"
```

---

### Task 15: Email validation schemas (Zod)

**Files:**
- Create: `lib/validation/devis.ts`, `lib/validation/contact.ts`
- Create: `tests/validation.test.ts`

- [ ] **Step 1: Write failing test**

`tests/validation.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { devisSchema } from '@/lib/validation/devis';
import { contactEntrepriseSchema, contactParticulierSchema } from '@/lib/validation/contact';

describe('devisSchema', () => {
  it('accepts a valid payload', () => {
    const r = devisSchema.safeParse({
      formation: 'incendie-extincteur-evacuation',
      nom: 'Jean Dupont',
      email: 'jean@test.com',
      telephone: '0612345678',
      message: 'Bonjour',
      honeypot: '',
    });
    expect(r.success).toBe(true);
  });

  it('rejects missing email', () => {
    const r = devisSchema.safeParse({ formation: 'x', nom: 'X', telephone: '06', message: '', honeypot: '' });
    expect(r.success).toBe(false);
  });

  it('rejects when honeypot is filled (bot)', () => {
    const r = devisSchema.safeParse({
      formation: 'x', nom: 'X', email: 'a@b.c', telephone: '06', message: '', honeypot: 'bot',
    });
    expect(r.success).toBe(false);
  });
});

describe('contactEntrepriseSchema', () => {
  it('requires raisonSociale', () => {
    const r = contactEntrepriseSchema.safeParse({
      nom: 'X', email: 'a@b.c', telephone: '06', message: 'm', honeypot: '',
    });
    expect(r.success).toBe(false);
  });
});

describe('contactParticulierSchema', () => {
  it('accepts a valid payload', () => {
    const r = contactParticulierSchema.safeParse({
      nom: 'X', email: 'a@b.c', telephone: '06', message: 'm', honeypot: '',
    });
    expect(r.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `npm test`
Expected: FAIL — modules missing.

- [ ] **Step 3: Create `lib/validation/devis.ts`**

```typescript
import { z } from 'zod';

export const devisSchema = z.object({
  formation: z.string().min(1),
  nom: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().min(8, 'Téléphone invalide'),
  entreprise: z.string().optional(),
  nbStagiaires: z.string().optional(),
  lieu: z.string().optional(),
  dates: z.string().optional(),
  message: z.string().optional(),
  honeypot: z.string().max(0, 'spam'),
});

export type DevisInput = z.infer<typeof devisSchema>;
```

- [ ] **Step 4: Create `lib/validation/contact.ts`**

```typescript
import { z } from 'zod';

const base = {
  nom: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().min(8, 'Téléphone invalide'),
  message: z.string().min(5, 'Message trop court'),
  honeypot: z.string().max(0, 'spam'),
};

export const contactEntrepriseSchema = z.object({
  ...base,
  raisonSociale: z.string().min(2, 'Raison sociale requise'),
  fonction: z.string().optional(),
  secteur: z.string().optional(),
});

export const contactParticulierSchema = z.object({ ...base });

export type ContactEntrepriseInput = z.infer<typeof contactEntrepriseSchema>;
export type ContactParticulierInput = z.infer<typeof contactParticulierSchema>;
```

- [ ] **Step 5: Run test, confirm pass**

Run: `npm test`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add lib/validation tests/validation.test.ts
git commit -m "feat: Zod validation schemas for devis and contact forms"
```

---

### Task 16: Resend client + email templates

**Files:**
- Create: `lib/email/resend.ts`, `lib/email/templates/devis.ts`, `lib/email/templates/contact.ts`
- Create: `.env.local.example`

- [ ] **Step 1: Document required environment variables**

`.env.local.example`:
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxx
CONTACT_EMAIL_TO=ckimsecuriteformation@gmail.com
CONTACT_EMAIL_FROM=devis@ckim-formation.fr
```

- [ ] **Step 2: Create `lib/email/resend.ts`**

```typescript
import 'server-only';
import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey && process.env.NODE_ENV === 'production') {
  throw new Error('RESEND_API_KEY is required in production');
}

export const resend = new Resend(apiKey || 're_dev_placeholder');

export const EMAIL_TO = process.env.CONTACT_EMAIL_TO || 'ckimsecuriteformation@gmail.com';
export const EMAIL_FROM = process.env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev';
```

- [ ] **Step 3: Create `lib/email/templates/devis.ts`**

```typescript
import type { DevisInput } from '@/lib/validation/devis';

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export function devisEmailHtml(data: DevisInput): string {
  const rows: [string, string | undefined][] = [
    ['Formation', data.formation],
    ['Nom', data.nom],
    ['Email', data.email],
    ['Téléphone', data.telephone],
    ['Entreprise', data.entreprise],
    ['Nb stagiaires estimé', data.nbStagiaires],
    ['Lieu', data.lieu],
    ['Dates souhaitées', data.dates],
    ['Message', data.message],
  ];
  const body = rows
    .filter(([, v]) => v && v.trim().length > 0)
    .map(([k, v]) => `<tr><td style="padding:6px 12px;font-weight:600;">${k}</td><td style="padding:6px 12px;">${escapeHtml(v!)}</td></tr>`)
    .join('');
  return `
    <div style="font-family:system-ui,sans-serif;color:#0A1A1E;max-width:560px;margin:auto;">
      <h2 style="color:#1B8FA0;border-bottom:2px solid #E8692A;padding-bottom:8px;">Nouvelle demande de devis</h2>
      <table style="width:100%;border-collapse:collapse;background:#EEF5F7;border-radius:8px;overflow:hidden;margin-top:16px;">
        ${body}
      </table>
      <p style="margin-top:16px;color:#7AACB2;font-size:12px;">Envoyé depuis ckim-formation.fr</p>
    </div>
  `;
}

export function devisEmailSubject(data: DevisInput): string {
  return `[C-KIM] Devis — ${data.formation} — ${data.nom}`;
}
```

- [ ] **Step 4: Create `lib/email/templates/contact.ts`**

```typescript
import type { ContactEntrepriseInput, ContactParticulierInput } from '@/lib/validation/contact';

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export function contactEntrepriseEmailHtml(d: ContactEntrepriseInput): string {
  const rows: [string, string | undefined][] = [
    ['Type', 'Entreprise'],
    ['Raison sociale', d.raisonSociale],
    ['Nom', d.nom],
    ['Fonction', d.fonction],
    ['Secteur', d.secteur],
    ['Email', d.email],
    ['Téléphone', d.telephone],
    ['Message', d.message],
  ];
  const body = rows.filter(([,v]) => v).map(([k,v]) => `<tr><td style="padding:6px 12px;font-weight:600;">${k}</td><td style="padding:6px 12px;">${escapeHtml(v!)}</td></tr>`).join('');
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;"><h2 style="color:#1B8FA0;">Contact entreprise</h2><table style="width:100%;border-collapse:collapse;background:#EEF5F7;border-radius:8px;overflow:hidden;">${body}</table></div>`;
}

export function contactParticulierEmailHtml(d: ContactParticulierInput): string {
  const rows: [string, string | undefined][] = [
    ['Type', 'Particulier'],
    ['Nom', d.nom],
    ['Email', d.email],
    ['Téléphone', d.telephone],
    ['Message', d.message],
  ];
  const body = rows.filter(([,v]) => v).map(([k,v]) => `<tr><td style="padding:6px 12px;font-weight:600;">${k}</td><td style="padding:6px 12px;">${escapeHtml(v!)}</td></tr>`).join('');
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;"><h2 style="color:#1B8FA0;">Contact particulier</h2><table style="width:100%;border-collapse:collapse;background:#EEF5F7;border-radius:8px;overflow:hidden;">${body}</table></div>`;
}

export function contactSubject(type: 'entreprise' | 'particulier', nom: string): string {
  return `[C-KIM] Contact ${type === 'entreprise' ? 'entreprise' : 'particulier'} — ${nom}`;
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/email .env.local.example
git commit -m "feat: Resend client and email templates"
```

---

### Task 17: Server Actions (devis, contact)

**Files:**
- Create: `app/actions/devis.ts`, `app/actions/contact.ts`

- [ ] **Step 1: Create `app/actions/devis.ts`**

```typescript
'use server';
import { devisSchema, type DevisInput } from '@/lib/validation/devis';
import { resend, EMAIL_FROM, EMAIL_TO } from '@/lib/email/resend';
import { devisEmailHtml, devisEmailSubject } from '@/lib/email/templates/devis';

export interface ActionResult {
  ok: boolean;
  errors?: Record<string, string>;
  message?: string;
}

export async function submitDevis(input: unknown): Promise<ActionResult> {
  const parsed = devisSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join('.')] = issue.message;
    }
    return { ok: false, errors };
  }
  const data: DevisInput = parsed.data;
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      replyTo: data.email,
      subject: devisEmailSubject(data),
      html: devisEmailHtml(data),
    });
    if (error) {
      console.error('[devis] resend error', error);
      return { ok: false, message: "Erreur d'envoi. Réessayez plus tard." };
    }
    return { ok: true, message: 'Demande envoyée. Réponse sous 24h.' };
  } catch (e) {
    console.error('[devis] unexpected', e);
    return { ok: false, message: "Erreur d'envoi. Réessayez plus tard." };
  }
}
```

- [ ] **Step 2: Create `app/actions/contact.ts`**

```typescript
'use server';
import {
  contactEntrepriseSchema,
  contactParticulierSchema,
  type ContactEntrepriseInput,
  type ContactParticulierInput,
} from '@/lib/validation/contact';
import { resend, EMAIL_FROM, EMAIL_TO } from '@/lib/email/resend';
import {
  contactEntrepriseEmailHtml,
  contactParticulierEmailHtml,
  contactSubject,
} from '@/lib/email/templates/contact';
import type { ActionResult } from './devis';

export async function submitContactEntreprise(input: unknown): Promise<ActionResult> {
  const p = contactEntrepriseSchema.safeParse(input);
  if (!p.success) {
    const errors: Record<string, string> = {};
    for (const issue of p.error.issues) errors[issue.path.join('.')] = issue.message;
    return { ok: false, errors };
  }
  return sendContact(p.data, 'entreprise');
}

export async function submitContactParticulier(input: unknown): Promise<ActionResult> {
  const p = contactParticulierSchema.safeParse(input);
  if (!p.success) {
    const errors: Record<string, string> = {};
    for (const issue of p.error.issues) errors[issue.path.join('.')] = issue.message;
    return { ok: false, errors };
  }
  return sendContact(p.data, 'particulier');
}

async function sendContact(
  data: ContactEntrepriseInput | ContactParticulierInput,
  type: 'entreprise' | 'particulier'
): Promise<ActionResult> {
  try {
    const html = type === 'entreprise'
      ? contactEntrepriseEmailHtml(data as ContactEntrepriseInput)
      : contactParticulierEmailHtml(data as ContactParticulierInput);
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      replyTo: data.email,
      subject: contactSubject(type, data.nom),
      html,
    });
    if (error) {
      console.error('[contact] resend error', error);
      return { ok: false, message: "Erreur d'envoi. Réessayez plus tard." };
    }
    return { ok: true, message: 'Message envoyé. Réponse sous 24h.' };
  } catch (e) {
    console.error('[contact] unexpected', e);
    return { ok: false, message: "Erreur d'envoi. Réessayez plus tard." };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/actions
git commit -m "feat: Server Actions for devis and contact forms"
```

---

### Task 18: DevisModal (global, replaces stub in CtaFinal)

**Files:**
- Create: `components/forms/DevisModal.tsx`
- Modify: `app/(public)/layout.tsx`, `components/sections/CtaFinal.tsx`

- [ ] **Step 1: Create `components/forms/DevisModal.tsx`**

```tsx
'use client';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitDevis, type ActionResult } from '@/app/actions/devis';

interface ModalCtx {
  open: (formationTitre: string) => void;
  close: () => void;
}

const Ctx = createContext<ModalCtx | null>(null);

export function useDevisModal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDevisModal must be inside <DevisModalProvider>');
  return ctx;
}

export function DevisModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [formation, setFormation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  const handleOpen = useCallback((titre: string) => {
    setFormation(titre);
    setResult(null);
    setOpen(true);
  }, []);
  const handleClose = useCallback(() => setOpen(false), []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const r = await submitDevis(Object.fromEntries(fd));
    setResult(r);
    setSubmitting(false);
  }

  return (
    <Ctx.Provider value={{ open: handleOpen, close: handleClose }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-dark text-white p-6 rounded-t-2xl relative">
                <p className="text-xs uppercase tracking-[0.2em] text-teal-l">Demande de devis</p>
                <h2 className="font-display text-3xl mt-1">{formation}</h2>
                <button onClick={handleClose} aria-label="Fermer" className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl">×</button>
              </div>

              {result?.ok ? (
                <div className="p-8 text-center">
                  <p className="font-display text-2xl text-teal">Demande envoyée ✓</p>
                  <p className="mt-2 text-dark/70">{result.message}</p>
                  <button onClick={handleClose} className="mt-6 px-6 py-2 border border-dark rounded-md text-sm uppercase tracking-wider hover:bg-dark hover:text-white transition">Fermer</button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                  <input type="hidden" name="formation" value={formation} />
                  <input type="text" name="honeypot" tabIndex={-1} autoComplete="off" className="hidden" />
                  <Field name="nom" label="Nom *" error={result?.errors?.nom} />
                  <Field name="email" label="Email *" type="email" error={result?.errors?.email} />
                  <Field name="telephone" label="Téléphone *" error={result?.errors?.telephone} />
                  <Field name="entreprise" label="Entreprise" />
                  <div className="grid grid-cols-2 gap-4">
                    <Field name="nbStagiaires" label="Nb de stagiaires" />
                    <Field name="lieu" label="Lieu" />
                  </div>
                  <Field name="dates" label="Dates souhaitées" />
                  <Textarea name="message" label="Message" />
                  {result?.message && !result.ok && (
                    <p className="text-sm text-red-600">{result.message}</p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-orange text-white px-6 py-3 rounded-md font-sans text-sm font-semibold uppercase tracking-wider hover:bg-orange-l transition disabled:opacity-60"
                  >
                    {submitting ? 'Envoi…' : 'Envoyer la demande'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

function Field({ name, label, type = 'text', error }: { name: string; label: string; type?: string; error?: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.15em] text-dark/60">{label}</span>
      <input name={name} type={type} className="mt-1 w-full border border-light rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal" />
      {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
    </label>
  );
}

function Textarea({ name, label }: { name: string; label: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.15em] text-dark/60">{label}</span>
      <textarea name={name} rows={4} className="mt-1 w-full border border-light rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal" />
    </label>
  );
}
```

- [ ] **Step 2: Wire `DevisModalProvider` into `(public)/layout.tsx`**

```tsx
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DevisModalProvider } from '@/components/forms/DevisModal';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <DevisModalProvider>
      <Navbar />
      <main className="pt-20">{children}</main>
      <Footer />
    </DevisModalProvider>
  );
}
```

- [ ] **Step 3: Replace the stub in `CtaFinal.tsx`**

```tsx
'use client';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useDevisModal } from '@/components/forms/DevisModal';
import type { Formation } from '@/lib/types/formation';

export function CtaFinal({ formation }: { formation: Formation }) {
  const { open } = useDevisModal();
  return (
    <section className="bg-light py-24">
      <Container>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl tracking-wide leading-[1.05]">
            Cette formation vous <em className="not-italic text-teal">intéresse</em> ?
          </h2>
          <p className="mt-4 text-dark/70">Devis personnalisé sous 24h. Intervention partout en région PACA.</p>
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <Button variant="primary" onClick={() => open(formation.titre)}>Demander un devis</Button>
            <a href="tel:0662515659" className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider border border-dark text-dark hover:bg-dark hover:text-white transition-all">
              06 62 51 56 59
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Verify**

Open a formation page, click « Demander un devis » — expected: modal opens with formation title pre-filled, form submits (will return error message gracefully without a real Resend key, or success with one).

For dev test with a real Resend key: copy `.env.local.example` to `.env.local`, add a real `RESEND_API_KEY`.

- [ ] **Step 5: Commit**

```bash
git add components/forms/DevisModal.tsx app/\(public\)/layout.tsx components/sections/CtaFinal.tsx
git commit -m "feat: global devis modal wired to Server Action"
```

---

### Task 19: Page Contact (Entreprise + Particulier tabs)

**Files:**
- Create: `app/(public)/contact/page.tsx`, `app/(public)/contact/ContactClient.tsx`
- Create: `components/forms/ContactEntreprise.tsx`, `components/forms/ContactParticulier.tsx`

- [ ] **Step 1: Create `components/forms/ContactEntreprise.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { submitContactEntreprise } from '@/app/actions/contact';

export function ContactEntreprise() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message?: string; errors?: Record<string, string> } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const r = await submitContactEntreprise(Object.fromEntries(fd));
    setResult(r);
    setSubmitting(false);
    if (r.ok) e.currentTarget.reset();
  }

  if (result?.ok) {
    return (
      <div className="bg-light p-8 rounded-lg text-center">
        <p className="font-display text-2xl text-teal">Message envoyé ✓</p>
        <p className="mt-2 text-dark/70">{result.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="text" name="honeypot" tabIndex={-1} autoComplete="off" className="hidden" />
      <Row>
        <Field name="raisonSociale" label="Raison sociale *" error={result?.errors?.raisonSociale} />
        <Field name="secteur" label="Secteur d'activité" />
      </Row>
      <Row>
        <Field name="nom" label="Nom *" error={result?.errors?.nom} />
        <Field name="fonction" label="Fonction" />
      </Row>
      <Row>
        <Field name="email" label="Email pro *" type="email" error={result?.errors?.email} />
        <Field name="telephone" label="Téléphone *" error={result?.errors?.telephone} />
      </Row>
      <label className="block">
        <span className="text-xs uppercase tracking-[0.15em] text-dark/60">Message *</span>
        <textarea name="message" rows={5} className="mt-1 w-full border border-light rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal" />
        {result?.errors?.message && <span className="text-xs text-red-600 mt-1 block">{result.errors.message}</span>}
      </label>
      {result?.message && !result.ok && <p className="text-sm text-red-600">{result.message}</p>}
      <button type="submit" disabled={submitting} className="w-full bg-orange text-white px-6 py-3 rounded-md font-sans text-sm font-semibold uppercase tracking-wider hover:bg-orange-l transition disabled:opacity-60">
        {submitting ? 'Envoi…' : 'Envoyer'}
      </button>
    </form>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}
function Field({ name, label, type = 'text', error }: { name: string; label: string; type?: string; error?: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.15em] text-dark/60">{label}</span>
      <input name={name} type={type} className="mt-1 w-full border border-light rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal" />
      {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
    </label>
  );
}
```

- [ ] **Step 2: Create `components/forms/ContactParticulier.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { submitContactParticulier } from '@/app/actions/contact';

export function ContactParticulier() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message?: string; errors?: Record<string, string> } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const r = await submitContactParticulier(Object.fromEntries(fd));
    setResult(r);
    setSubmitting(false);
    if (r.ok) e.currentTarget.reset();
  }

  if (result?.ok) {
    return (
      <div className="bg-light p-8 rounded-lg text-center">
        <p className="font-display text-2xl text-teal">Message envoyé ✓</p>
        <p className="mt-2 text-dark/70">{result.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="text" name="honeypot" tabIndex={-1} autoComplete="off" className="hidden" />
      <Field name="nom" label="Nom *" error={result?.errors?.nom} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field name="email" label="Email *" type="email" error={result?.errors?.email} />
        <Field name="telephone" label="Téléphone *" error={result?.errors?.telephone} />
      </div>
      <label className="block">
        <span className="text-xs uppercase tracking-[0.15em] text-dark/60">Message *</span>
        <textarea name="message" rows={5} className="mt-1 w-full border border-light rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal" />
        {result?.errors?.message && <span className="text-xs text-red-600 mt-1 block">{result.errors.message}</span>}
      </label>
      {result?.message && !result.ok && <p className="text-sm text-red-600">{result.message}</p>}
      <button type="submit" disabled={submitting} className="w-full bg-teal text-white px-6 py-3 rounded-md font-sans text-sm font-semibold uppercase tracking-wider hover:bg-teal-l transition disabled:opacity-60">
        {submitting ? 'Envoi…' : 'Envoyer'}
      </button>
    </form>
  );
}

function Field({ name, label, type = 'text', error }: { name: string; label: string; type?: string; error?: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.15em] text-dark/60">{label}</span>
      <input name={name} type={type} className="mt-1 w-full border border-light rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal" />
      {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
    </label>
  );
}
```

- [ ] **Step 3: Create `app/(public)/contact/ContactClient.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { FadeUp } from '@/components/motion/FadeUp';
import { ContactEntreprise } from '@/components/forms/ContactEntreprise';
import { ContactParticulier } from '@/components/forms/ContactParticulier';
import { cn } from '@/lib/utils';

export function ContactClient() {
  const [tab, setTab] = useState<'entreprise' | 'particulier'>('entreprise');

  return (
    <>
      <section className="bg-dark text-white py-32 relative">
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-teal via-teal-l to-orange" />
        <Container>
          <p className="text-xs uppercase tracking-[0.4em] text-teal-l mb-4">Contact</p>
          <h1 className="font-display text-6xl md:text-8xl tracking-wide leading-[0.9]">
            Parlons<br/><em className="not-italic text-teal-l">formation.</em>
          </h1>
          <p className="mt-8 text-muted max-w-xl">
            Devis sous 24h. Téléphone direct : <a href="tel:0662515659" className="text-teal-l hover:underline">06 62 51 56 59</a>.
          </p>
        </Container>
      </section>

      <section className="bg-white py-20">
        <Container className="max-w-3xl">
          <FadeUp>
            <div className="flex gap-2 mb-8 border-b border-light">
              {(['entreprise', 'particulier'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'px-6 py-3 text-sm uppercase tracking-[0.15em] font-semibold transition relative',
                    tab === t ? 'text-orange' : 'text-dark/50 hover:text-dark'
                  )}
                >
                  {t === 'entreprise' ? 'Entreprise' : 'Particulier'}
                  {tab === t && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-orange" />}
                </button>
              ))}
            </div>
            {tab === 'entreprise' ? <ContactEntreprise /> : <ContactParticulier />}
          </FadeUp>
        </Container>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Create `app/(public)/contact/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { ContactClient } from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact — C-KIM Formation',
  description: 'Demandez un devis ou contactez C-KIM Formation. Réponse sous 24h. Tél : 06 62 51 56 59.',
};

export default function ContactPage() {
  return <ContactClient />;
}
```

- [ ] **Step 5: Verify**

Open `http://localhost:3000/contact` — expected: hero, tabs Entreprise/Particulier toggling between two forms.

- [ ] **Step 6: Commit**

```bash
git add app/\(public\)/contact components/forms/ContactEntreprise.tsx components/forms/ContactParticulier.tsx
git commit -m "feat: contact page with entreprise/particulier tab forms"
```

---

### Task 20: Pages légales

**Files:**
- Create: `app/(public)/mentions-legales/page.tsx`, `app/(public)/confidentialite/page.tsx`

- [ ] **Step 1: Create `app/(public)/mentions-legales/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Mentions légales — C-KIM Formation',
  robots: { index: false },
};

export default function MentionsLegalesPage() {
  return (
    <section className="bg-white py-20">
      <Container className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-orange">Légal</p>
        <h1 className="font-display text-4xl md:text-6xl tracking-wide mt-3 leading-[1.05]">Mentions légales</h1>
        <div className="mt-8 text-dark/80 leading-relaxed space-y-4">
          <h2 className="font-display text-2xl mt-8">Éditeur</h2>
          <p>C-KIM Formation — [À compléter par le client : statut juridique, capital, SIRET, RCS, siège social].</p>
          <h2 className="font-display text-2xl mt-8">Directeur de la publication</h2>
          <p>[Nom du directeur de la publication]</p>
          <h2 className="font-display text-2xl mt-8">Hébergement</h2>
          <p>Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.</p>
          <h2 className="font-display text-2xl mt-8">Contact</h2>
          <p>ckimsecuriteformation@gmail.com — 06 62 51 56 59</p>
          <h2 className="font-display text-2xl mt-8">Numéro Qualiopi</h2>
          <p>[Numéro de certification Qualiopi à insérer]</p>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Create `app/(public)/confidentialite/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — C-KIM Formation',
  robots: { index: false },
};

export default function ConfidentialitePage() {
  return (
    <section className="bg-white py-20">
      <Container className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-orange">RGPD</p>
        <h1 className="font-display text-4xl md:text-6xl tracking-wide mt-3 leading-[1.05]">Politique de confidentialité</h1>
        <div className="mt-8 text-dark/80 leading-relaxed space-y-4">
          <h2 className="font-display text-2xl mt-8">Données collectées</h2>
          <p>Lorsque vous remplissez un formulaire (devis ou contact), nous collectons : nom, email, téléphone, et les informations que vous nous transmettez (entreprise, message). Ces données sont uniquement utilisées pour vous répondre.</p>
          <h2 className="font-display text-2xl mt-8">Conservation</h2>
          <p>Les emails sont conservés tant que la relation commerciale est active, puis archivés conformément aux obligations légales.</p>
          <h2 className="font-display text-2xl mt-8">Vos droits</h2>
          <p>Conformément au RGPD, vous pouvez accéder, rectifier ou supprimer vos données en écrivant à ckimsecuriteformation@gmail.com.</p>
          <h2 className="font-display text-2xl mt-8">Cookies</h2>
          <p>Le site n'utilise aucun cookie de tracking. Aucune donnée n'est partagée avec des tiers à des fins publicitaires.</p>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/mentions-legales app/\(public\)/confidentialite
git commit -m "feat: legal pages (mentions, confidentialité)"
```

---

### Task 21: Sitemap, robots, structured data

**Files:**
- Create: `app/sitemap.ts`, `app/robots.ts`
- Create: `components/seo/JsonLd.tsx`
- Modify: `app/(public)/page.tsx`, `app/(public)/formations/[slug]/page.tsx`

- [ ] **Step 1: Create `app/sitemap.ts`**

```typescript
import type { MetadataRoute } from 'next';
import { formations } from '@/lib/formations';

const BASE = 'https://ckim-formation.fr';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, priority: 1.0 },
    { url: `${BASE}/organisme`, lastModified: now, priority: 0.8 },
    { url: `${BASE}/formations`, lastModified: now, priority: 0.9 },
    { url: `${BASE}/contact`, lastModified: now, priority: 0.7 },
    ...formations.map((f) => ({
      url: `${BASE}/formations/${f.slug}`,
      lastModified: now,
      priority: 0.8,
    })),
  ];
}
```

- [ ] **Step 2: Create `app/robots.ts`**

```typescript
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/(auth)', '/(client)', '/(admin)', '/(formateur)'] },
    sitemap: 'https://ckim-formation.fr/sitemap.xml',
  };
}
```

- [ ] **Step 3: Create `components/seo/JsonLd.tsx`**

This component uses React's text-content pattern (no `dangerouslySetInnerHTML`) — it renders the JSON as the script tag's child text node, which React serializes safely.

```tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script type="application/ld+json">
      {JSON.stringify(data)}
    </script>
  );
}
```

- [ ] **Step 4: Add LocalBusiness JSON-LD to home**

In `app/(public)/page.tsx`, import and add at the end of the JSX (just before the closing fragment):

```tsx
import { JsonLd } from '@/components/seo/JsonLd';
// ...
<JsonLd
  data={{
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'C-KIM Formation',
    description: 'Centre de formation certifié Qualiopi spécialisé en sécurité au travail, prévention et développement humain.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Draguignan',
      postalCode: '83300',
      addressRegion: 'Provence-Alpes-Côte d\'Azur',
      addressCountry: 'FR',
    },
    email: 'ckimsecuriteformation@gmail.com',
    telephone: '+33-6-62-51-56-59',
    areaServed: 'Provence-Alpes-Côte d\'Azur',
  }}
/>
```

- [ ] **Step 5: Add Course JSON-LD to formation pages**

In `app/(public)/formations/[slug]/page.tsx`, import `JsonLd` and add at the end of the JSX:

```tsx
<JsonLd
  data={{
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `${formation.titre}${formation.sousTitre ? ' — ' + formation.sousTitre : ''}`,
    description: formation.objectifs,
    provider: { '@type': 'Organization', name: 'C-KIM Formation', sameAs: 'https://ckim-formation.fr' },
  }}
/>
```

- [ ] **Step 6: Verify**

Run `npm run dev`, open `http://localhost:3000/sitemap.xml` and `/robots.txt` — expected: valid XML/text.
View source on `/` and `/formations/incendie-extincteur-evacuation` — expected: JSON-LD `<script>` blocks.

- [ ] **Step 7: Commit**

```bash
git add app/sitemap.ts app/robots.ts components/seo app/\(public\)/page.tsx app/\(public\)/formations/\[slug\]/page.tsx
git commit -m "feat: sitemap, robots, and Schema.org JSON-LD"
```

---

### Task 22: Cookie banner

**Files:**
- Create: `components/layout/CookieBanner.tsx`
- Modify: `app/(public)/layout.tsx`

- [ ] **Step 1: Create the banner**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const KEY = 'ckim-cookie-accepted';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);
  function accept() {
    localStorage.setItem(KEY, '1');
    setVisible(false);
  }
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-4 inset-x-4 md:left-auto md:right-4 md:max-w-sm bg-dark text-white p-5 rounded-lg shadow-2xl z-[90]"
        >
          <p className="text-sm leading-relaxed">
            Ce site n'utilise aucun cookie de tracking. En continuant, vous acceptez les conditions d'utilisation.
          </p>
          <button onClick={accept} className="mt-4 bg-orange text-white px-4 py-2 rounded text-xs uppercase tracking-wider font-semibold hover:bg-orange-l transition">
            J'ai compris
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Mount in `(public)/layout.tsx`**

```tsx
import { CookieBanner } from '@/components/layout/CookieBanner';
// inside DevisModalProvider, after Footer:
<CookieBanner />
```

- [ ] **Step 3: Verify**

First load → banner appears bottom right. Click "J'ai compris" → disappears. Reload → still hidden.

- [ ] **Step 4: Commit**

```bash
git add components/layout/CookieBanner.tsx app/\(public\)/layout.tsx
git commit -m "feat: minimal cookie banner"
```

---

### Task 23: Phase 2 placeholder routes

**Files:**
- Create: `app/(auth)/login/page.tsx`, `app/(client)/dashboard/page.tsx`, `app/(admin)/dashboard/page.tsx`, `app/(formateur)/dashboard/page.tsx`

- [ ] **Step 1: Create the 4 placeholder pages**

`app/(client)/dashboard/page.tsx`:
```tsx
export default function ClientDashboardPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark text-white">
      <div className="text-center max-w-md p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-teal-l">Phase 2</p>
        <h1 className="font-display text-4xl mt-3">Espace client</h1>
        <p className="mt-4 text-muted">Bientôt disponible. Inscription aux sessions et paiement intégré.</p>
      </div>
    </div>
  );
}
```

`app/(auth)/login/page.tsx` — same pattern, title `Connexion`, body `Bientôt disponible.`
`app/(admin)/dashboard/page.tsx` — title `Espace admin`, body `Bientôt disponible. Gestion des sessions et suivi.`
`app/(formateur)/dashboard/page.tsx` — title `Espace formateur`, body `Bientôt disponible. Gestion et suivi des formations le jour J.`

- [ ] **Step 2: Verify**

Open each route — expected: each shows its placeholder. Routes are not linked from the public navigation.

- [ ] **Step 3: Commit**

```bash
git add app/\(auth\) app/\(client\) app/\(admin\) app/\(formateur\)
git commit -m "feat: phase 2 placeholder routes (auth, client, admin, formateur)"
```

---

### Task 24: Add the remaining 12 formations

The plaquette HTML at `/Users/alantouati/Downloads/plaquette_complete_ckimformation (1).html` is the canonical source. The 13 total formations are:

1. ✓ `incendie-extincteur-evacuation` (Task 6)
2. `habilitation-electrique-h0-b0`
3. `habilitation-electrique-b1v-b2v`
4. `hygiene-alimentaire-haccp`
5. `duerp-formation-accompagnement`
6. `elaboration-duerp-manager-sst`
7. `formateur-sst`
8. `mac-formateur-sst`
9. `formateur-incendie-gestes-postures`
10. `formateur-independant-interne`
11. `pnl-controle-qualiopi`
12. `preparer-controle-qualiopi`
13. `formateur-professionnel-adultes-fpa`

(Re-check the plaquette `grep -nE 'class="ph-title"'` to confirm count and titles.)

**For each formation, repeat:**

- [ ] **Step 1: Read source content from the plaquette**

Find the formation's section in the HTML:
```bash
grep -n -A 80 '<div class="ph-title">[Title to find]' "/Users/alantouati/Downloads/plaquette_complete_ckimformation (1).html"
```

Extract: titre, sous-titre, ref, durée, public, prérequis, prix, modalité, inscription, recyclage (if present), objectifs, programme (modules with sub-points), évaluation, références réglementaires.

- [ ] **Step 2: Create `lib/formations/<slug>.ts`**

Use this template (replace placeholders with actual extracted content):

```typescript
import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: '<slug>',
  titre: '<title>',
  sousTitre: '<subtitle or undefined>',
  parcours: '<parcours key>',
  ref: '<ref code>',
  hero: { image: '/images/formations/<slug>.jpg', alt: '<alt>' },
  infosPratiques: {
    duree: '<...>',
    public: '<...>',
    prerequis: '<...>',
    prixIndicatif: '<...>',
    modalite: '<...>',
    inscription: '<...>',
    recyclage: '<...>', // omit if absent
  },
  objectifs: '<objectifs prose>',
  programme: [
    { titre: '<module 1>', points: ['...', '...'] },
    // ... more modules
  ],
  evaluation: '<evaluation prose>',
  referencesReglementaires: '<refs>',
  formationsLiees: ['<slug-1>', '<slug-2>'],
  seo: {
    title: '<title> | C-KIM Formation',
    description: '<140-160 char SEO description>',
  },
};
```

- [ ] **Step 3: Add a hero photo for the slug**

```bash
curl -L "<unsplash url for theme>" -o public/images/formations/<slug>.jpg
```

Suggested theme keywords for Unsplash search:
- habilitations électriques → `electrician-helmet`, `electrical-panel`
- HACCP → `professional-kitchen`, `food-safety`
- DUERP → `office-meeting`, `safety-document`
- Formateur SST → `first-aid-training`
- Incendie/Gestes & postures → `firefighter-training`, `posture-workplace`
- Indépendant/Interne → `business-meeting`
- PNL/Qualiopi → `coaching-session`, `audit-clipboard`
- FPA → `classroom-training`

- [ ] **Step 4: Add the import to `lib/formations/index.ts`**

After all 13 are added, the file becomes:

```typescript
import type { Formation } from '@/lib/types/formation';

import { formation as incendie } from './incendie-extincteur-evacuation';
import { formation as h0b0 } from './habilitation-electrique-h0-b0';
import { formation as b1vb2v } from './habilitation-electrique-b1v-b2v';
import { formation as haccp } from './hygiene-alimentaire-haccp';
import { formation as duerpForm } from './duerp-formation-accompagnement';
import { formation as duerpManager } from './elaboration-duerp-manager-sst';
import { formation as foSst } from './formateur-sst';
import { formation as macFoSst } from './mac-formateur-sst';
import { formation as foIncendie } from './formateur-incendie-gestes-postures';
import { formation as foInde } from './formateur-independant-interne';
import { formation as pnl } from './pnl-controle-qualiopi';
import { formation as qualiopi } from './preparer-controle-qualiopi';
import { formation as fpa } from './formateur-professionnel-adultes-fpa';

export const formations: Formation[] = [
  incendie, h0b0, b1vb2v,
  haccp,
  duerpForm,
  duerpManager,
  foSst, macFoSst, foIncendie, foInde,
  pnl,
  qualiopi,
  fpa,
];

export function getFormationBySlug(slug: string): Formation | undefined {
  return formations.find((f) => f.slug === slug);
}
export function getFormationsByParcours(parcours: Formation['parcours']): Formation[] {
  return formations.filter((f) => f.parcours === parcours);
}
```

- [ ] **Step 5: Verify**

Run `npm test` — formations test still passes (more than 1 formation).
Open `/formations` — expected: all parcours sections populated.
Click each — `/formations/[slug]` renders correctly.

- [ ] **Step 6: Commit per parcours (frequent commits)**

```bash
# After Sécurité (2 new: H0-B0, B1V-B2V)
git add lib/formations/habilitation-electrique-h0-b0.ts lib/formations/habilitation-electrique-b1v-b2v.ts lib/formations/index.ts public/images/formations/habilitation-electrique-h0-b0.jpg public/images/formations/habilitation-electrique-b1v-b2v.jpg
git commit -m "content: add Habilitation Électrique H0-B0 and B1V-B2V"

# After Alimentaire
git add lib/formations/hygiene-alimentaire-haccp.ts lib/formations/index.ts public/images/formations/hygiene-alimentaire-haccp.jpg
git commit -m "content: add HACCP formation"

# Continue per parcours: Prévention, Management, Formateurs (4), Développement, Qualité, Certifiant
# One commit per parcours
```

---

### Task 25: Performance, accessibility, Lighthouse pass

**Files:**
- Modify: `next.config.ts`, `app/globals.css`

- [ ] **Step 1: Image optimization config**

`next.config.ts`:
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
```

- [ ] **Step 2: Add focus styles globally**

Append to `app/globals.css`:
```css
:focus-visible {
  outline: 2px solid #E8692A;
  outline-offset: 2px;
  border-radius: 4px;
}
```

- [ ] **Step 3: Run a production build**

```bash
npm run build
npm run start
```

Open `http://localhost:3000`.

- [ ] **Step 4: Lighthouse audit**

Run Lighthouse in Chrome DevTools (Mobile profile). Target: ≥ 90 in all categories.

Expected gaps and how to fix:
- **LCP**: ensure hero image (when present) has `priority` — already done in `HeroFormation`.
- **CLS**: every Image has explicit dimensions or `fill` with sized parent — already done.
- **Accessibility**: every clickable card has visible focus ring — handled in Step 2.
- **Best practices**: Resend errors are logged server-side only — already done.

If a category drops below 90, identify the failing audit, fix it, re-run.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts app/globals.css
git commit -m "perf: image formats config + a11y focus styles"
```

---

### Task 26: README

**Files:**
- Replace: `README.md`

- [ ] **Step 1: Write README**

```markdown
# C-KIM Formation — Site vitrine

Site marketing pour C-KIM Formation, organisme de formation Qualiopi (Draguignan, PACA).

## Stack
- Next.js 16, TypeScript, Tailwind v4, Framer Motion, Lenis, Resend, Zod
- Hébergement Vercel

## Démarrage local

```bash
npm install
cp .env.local.example .env.local   # remplir RESEND_API_KEY
npm run dev
```

## Tests

```bash
npm test
```

## Déploiement

- Pousser sur la branche `main` du repo GitHub → déploiement auto sur Vercel
- Variables d'environnement Vercel : `RESEND_API_KEY`, `CONTACT_EMAIL_TO`, `CONTACT_EMAIL_FROM`

## Ajouter une formation

1. Créer `lib/formations/<slug>.ts` avec un objet `Formation` typé
2. L'ajouter à l'export agrégé dans `lib/formations/index.ts`
3. Ajouter une photo dans `public/images/formations/<slug>.jpg`

## Architecture

- `app/(public)/` — pages publiques
- `app/(auth|client|admin|formateur)/` — placeholders phase 2
- `app/actions/` — Server Actions formulaires
- `lib/formations/` — données formations (typé)
- `lib/email/` — Resend + templates
- `lib/validation/` — schémas Zod
- `components/{ui,sections,motion,forms,layout,seo}/` — composants

## Phase 2 (à venir)

- Espace client : inscription aux sessions + paiement Stripe
- Espace admin : gestion sessions (dates/lieux), suivi
- Espace formateur : suivi le jour J
- Auth Supabase / DB Postgres
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with stack, dev workflow, and architecture"
```

---

### Task 27: First Vercel deployment

**Files:** none (deployment config only)

- [ ] **Step 1: Push to GitHub**

When the user is ready to create the GitHub repo:
```bash
gh repo create ckim-formation --private --source=. --remote=origin
git push -u origin main
```

- [ ] **Step 2: Link to Vercel**

```bash
npx vercel link
npx vercel env add RESEND_API_KEY    # paste real key
npx vercel env add CONTACT_EMAIL_TO  # ckimsecuriteformation@gmail.com
npx vercel env add CONTACT_EMAIL_FROM
npx vercel --prod
```

- [ ] **Step 3: Verify deployment**

Open the Vercel URL. Test:
- Hero animations
- All 5 main pages
- 1 formation page + devis modal submission
- Contact page (both forms)

- [ ] **Step 4: Branch domain on Hostinger**

When the client buys the domain on Hostinger, configure DNS to point at Vercel (CNAME `cname.vercel-dns.com` for `www`, A record or ALIAS for apex). Add the domain in Vercel project settings.

---

## Self-Review Checklist (run before delivering)

- [ ] Spec coverage: every spec section maps to ≥ 1 task above
- [ ] No placeholders: no "TBD", "TODO", or vague instructions left in steps (Task 24 lists explicit slugs and the extraction procedure rather than "fill later")
- [ ] Type consistency: `Formation`, `Parcours`, `ParcoursMeta`, `ActionResult`, schema names match across tasks
- [ ] Frequent commits: each task ends with a commit
- [ ] TDD where it adds value: validation, parcours, formations registry have tests; UI components are visually verified

## Open follow-ups (post-launch)

- Replace placeholder hero photos with client-supplied photos when available
- Fill real legal info (SIRET, RCS, capital, Qualiopi number) on `/mentions-legales`
- Add Plausible or Vercel Analytics if the client wants traffic data (will require updating the cookie banner copy)
