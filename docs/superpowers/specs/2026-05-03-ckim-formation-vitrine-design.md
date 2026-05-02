# C-KIM Formation — Site vitrine (Phase 1)

**Date** : 2026-05-03
**Client** : C-KIM Formation — organisme de formation certifié Qualiopi, Draguignan (83), région PACA
**Phase** : 1/2 — Vitrine publique uniquement. Phase 2 (espace client + paiement, espace admin, espace formateur) prévue mais hors-scope.

---

## 1. Contexte & objectifs

C-KIM Formation est un organisme de formation spécialisé en sécurité au travail, prévention des risques professionnels et développement humain. Certifié Qualiopi, formateurs certifiés INRS / AFNOR / FPA, intervention sur site client, 60-80 % de pratique, approche ludopédagogique.

**Objectif du site** : présenter l'organisme et ses ~15 formations réparties en 8 parcours, permettre aux prospects (entreprises et particuliers) de comprendre chaque formation et de demander un devis.

**Effet recherché** : « wow » à l'arrivée + au scroll. Direction visuelle **Editorial Dark / Bold** pour le hero, sections claires en alternance ensuite (majorité fond blanc, environ 1 section sur 2 colorée).

---

## 2. Stack technique

| Couche | Choix |
|---|---|
| Framework | Next.js 16 (App Router, React 19, Server Components) |
| Langage | TypeScript strict |
| Styling | Tailwind CSS v4 + design tokens C-KIM |
| Animations | Framer Motion 12 |
| Smooth scroll | Lenis |
| Email | Resend (Server Actions) |
| Validation | Zod |
| Polices | next/font (Bebas Neue, DM Sans, DM Serif Display) |
| Images | next/image |
| Hébergement | Vercel |
| Domaine | Acheté plus tard sur Hostinger, branché sur Vercel |
| Repo Git | GitHub, créé plus tard |

Emplacement du projet : `/Users/alantouati/ckim-formation/`.

---

## 3. Structure des pages

```
/                                Accueil
/organisme                       L'organisme (Qualiopi, méthode, formateurs, valeurs)
/formations                      Index des formations (regroupé par parcours)
/formations/[slug]               Détail formation (template figé × 15)
/contact                         Contact (2 formulaires : Entreprise / Particulier)
/mentions-legales                Mentions légales
/confidentialite                 Politique de confidentialité (RGPD)
```

Composant transversal : **modal « Demander un devis »** déclenchable depuis n'importe quelle page formation, avec champ formation pré-rempli.

### Pages préparées pour la phase 2 (vides, créées dès maintenant)

```
/(auth)/login
/(client)/dashboard
/(admin)/dashboard
/(formateur)/dashboard
```

Ces routes ne sont pas exposées au lancement (pas de lien public). Elles renvoient un placeholder « Bientôt disponible » pour réserver les emplacements.

---

## 4. Design system

### Couleurs (extraites de la plaquette)

```
--teal:       #1B8FA0   /* principal */
--teal-d:     #0F6070
--teal-l:     #3AB5CA
--orange:     #E8692A   /* accent / CTA */
--orange-l:   #F5954A
--dark:       #0A1A1E   /* hero, footer */
--dark-2:     #112228
--white:      #FFFFFF   /* fond majoritaire */
--light:      #EEF5F7   /* fond sections alternées */
--text:       #D8EDEF   /* texte sur fond sombre */
--muted:      #7AACB2

/* Couleurs parcours (badges + accents par formation) */
--c-secu:     #1B8FA0
--c-alim:     #2E9E6A
--c-prev:     #C4532A
--c-mana:     #6A4ABE
--c-form:     #E8692A
--c-dev:      #2A7E9E
--c-qual:     #2A5E9E
--c-cert:     #9E7A2A
```

### Typographie

- **Bebas Neue** : H1 hero (60-120 px), H2 sections (32-48 px), tags
- **DM Sans** : corps (16-18 px), boutons, métadonnées (300/400/500/600/700)
- **DM Serif Display** : accents éditoriaux (italique sur 1-2 mots clés)
- Toutes chargées via `next/font` (display: swap, preload)

### Rythme des sections

Alternance demandée : majorité blanc, ~1 section sur 2 non-blanche.

```
Section 1   dark      (hero d'impact)
Section 2   blanc
Section 3   light     (#EEF5F7)
Section 4   blanc
Section 5   dark      (accent fort, ex. citation/manifesto)
Section 6   blanc
...
```

### Composants UI partagés

- `Button` (variants : primary orange, secondary teal, ghost dark)
- `Tag` (badge parcours, badge certification)
- `SectionHeader` (eyebrow + titre + barre dégradée)
- `Card` (formation, formateur, témoignage)
- `Accordion` (modules de programme)
- `MarqueeBand` (bandeau infini certifications)
- `StatCounter` (chiffres animés)
- `MetaBlock` (bloc Durée/Public/Prix sur page formation)

---

## 5. Composition d'une page formation (figée, identique pour les 15)

```
1. Hero formation
   - Photo full-width + overlay dégradé dark
   - Badge parcours (couleur dédiée) + référence (ex. SECU-01)
   - Titre Bebas Neue XXL
   - CTA « Demander un devis » sticky
   - Eyebrow « Formation Qualiopi · X heures »

2. Bandeau infos pratiques (sticky au scroll, devient compact)
   - Durée · Public · Prix indicatif · Modalité · Certification

3. Objectifs de la formation
   - Phrase d'introduction (ce que le stagiaire saura faire à la fin)

4. Programme détaillé
   - Liste des modules sous forme d'accordions ou de timeline animée
   - Chaque module : titre + sous-points

5. Public visé & prérequis

6. Modalités d'évaluation & validation
   - Type d'évaluation, livrables (attestation, certificat, habilitation)

7. Références réglementaires
   - Code du travail, normes INRS, recommandations APSAD, etc.

8. Méthode pédagogique C-KIM (bloc transversal réutilisable)
   - 60-80 % de pratique, ludopédagogie, formateurs certifiés

9. CTA final
   - « Cette formation vous intéresse ? »
   - Bouton « Demander un devis » + numéro de téléphone

10. Formations liées
    - 2-3 cartes de formations du même parcours
```

Ordre, sections et hiérarchie sont **figés**. Seul le contenu varie d'une formation à l'autre. Photo principale tirée d'une banque de stock pro (Unsplash/Pexels) adaptée à chaque thématique.

---

## 6. Modèle de données

### Type `Formation`

```typescript
// lib/types/formation.ts
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
    image: string;        // chemin /public ou URL
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
  formationsLiees: string[];   // slugs d'autres formations
  seo: {
    title: string;
    description: string;
  };
}
```

### Stockage

15 fichiers TS dans `lib/formations/` :

```
lib/formations/
  incendie-extincteur-evacuation.ts
  habilitation-electrique-h0-b0.ts
  habilitation-electrique-b1v-b2v.ts
  hygiene-alimentaire-haccp.ts
  duerp-formation-accompagnement.ts
  elaboration-duerp-manager-sst.ts
  formateur-sst.ts
  mac-formateur-sst.ts
  formateur-incendie-gestes-postures.ts
  formateur-independant-interne.ts
  pnl-controle-qualiopi.ts
  preparer-controle-qualiopi.ts
  formateur-professionnel-adultes-fpa.ts
  index.ts                         // export agrégé : formations[]
```

Le contenu de chaque fichier est extrait de la plaquette HTML fournie par le client puis reformaté pour le web.

### Type `Parcours` — métadonnées

```typescript
// lib/parcours.ts
export const PARCOURS_META: Record<Parcours, { label: string; couleur: string; description: string }> = {
  securite:     { label: 'Sécurité', couleur: '#1B8FA0', description: '...' },
  alimentaire:  { label: 'Sécurité Alimentaire', couleur: '#2E9E6A', description: '...' },
  // ...
};
```

---

## 7. Animations

### Hero d'accueil (effet wow)

- Reveal letter-by-letter du titre principal (Framer Motion `stagger`)
- Grille technique animée en arrière-plan (CSS keyframes, panning lent)
- Gradient teal/orange qui pulse (radial-gradient animé)
- Barre de scan en haut (largeur 30 % → 100 % en boucle)
- Parallax doux au scroll (Lenis + transforms basés sur scroll progress)

### Scroll-triggered (toutes les sections)

- Apparition fade-up (`opacity 0 → 1`, `translateY 24px → 0`) via `useInView` + `motion.div`
- Délais en cascade pour les éléments enfants
- Trigger une seule fois par défaut

### Cards formation

- Hover : translateY -4px + shadow + léger 3D tilt (perspective + rotateX/Y)
- Image hero : zoom léger au hover (scale 1.05)

### Compteurs animés

- « 15 formations · 8 parcours · 100 % Qualiopi · X stagiaires formés » qui s'incrémentent à l'entrée du viewport

### Marquee

- Bandeau infini avec logos/labels Qualiopi · INRS · AFNOR · FPA · Code du Travail · APSAD

### Page transitions

- Fade + slide léger (10-15 px) entre routes via `framer-motion` AnimatePresence

### Smooth scroll global

- Lenis initialisé dans le root layout
- Désactivé si `prefers-reduced-motion: reduce`

### Performance & accessibilité

- Toutes les animations utilisent `transform` et `opacity` uniquement (compositables GPU)
- `prefers-reduced-motion` respecté : animations remplacées par fade simple ou désactivées
- Lighthouse cible : ≥ 90 sur Mobile

---

## 8. Formulaires & emails

### Modal « Demander un devis »

Déclenchée depuis n'importe quelle page formation.

Champs :
- Nom *
- Email *
- Téléphone *
- Entreprise (optionnel)
- Nombre de stagiaires estimé
- Lieu de la formation
- Dates souhaitées
- Message libre
- Formation choisie (caché, pré-rempli avec le slug courant)
- Honeypot (champ caché anti-bot)

### Page Contact — 2 formulaires (Entreprise / Particulier)

Onglets ou cards séparées.

**Entreprise** : nom, email pro, téléphone, raison sociale, fonction, secteur, message
**Particulier** : nom, email, téléphone, message

### Backend

- Server Actions Next.js
- Validation Zod (client + serveur)
- Envoi via Resend → `ckimsecuriteformation@gmail.com`
- Rate limit Vercel Edge (10 req / min / IP)
- Honeypot anti-spam

---

## 9. SEO & métadonnées

- `metadata` Next.js par page (title, description, OG, Twitter card)
- Schema.org JSON-LD :
  - Page accueil : `LocalBusiness` (région PACA, Draguignan, contact)
  - Pages formation : `Course` (provider, hasCourseInstance, offers)
- Sitemap.xml + robots.txt (Next 16 sitemap.ts)
- Mots-clés régionaux : Draguignan, Var, PACA, Toulon, Nice, Marseille
- Lang `fr-FR`

---

## 10. RGPD

- Bannière cookies minimaliste (pas de tracking analytique en phase 1, donc juste un consentement simple « OK »)
- Page `/mentions-legales` (placeholder à remplir avec les infos légales du client)
- Page `/confidentialite` (politique de confidentialité standard)
- Aucune cookie tiers sans consentement explicite

---

## 11. Structure du projet

```
ckim-formation/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                          # /
│   │   ├── organisme/page.tsx
│   │   ├── formations/
│   │   │   ├── page.tsx                      # index
│   │   │   └── [slug]/page.tsx               # détail
│   │   ├── contact/page.tsx
│   │   ├── mentions-legales/page.tsx
│   │   └── confidentialite/page.tsx
│   ├── (auth)/                               # placeholder phase 2
│   ├── (client)/                             # placeholder phase 2
│   ├── (admin)/                              # placeholder phase 2
│   ├── (formateur)/                          # placeholder phase 2
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                                   # Button, Tag, Card, Accordion, etc.
│   ├── sections/                             # SectionHeader, Hero, FormationsGrid, etc.
│   ├── motion/                               # FadeUp, LetterReveal, StatCounter, Marquee
│   ├── forms/                                # DevisModal, ContactForm
│   └── layout/                               # Navbar, Footer
├── lib/
│   ├── formations/                           # 15 fichiers TS + index.ts
│   ├── types/formation.ts
│   ├── parcours.ts
│   ├── email/                                # Resend client + templates
│   └── utils.ts
├── public/
│   └── images/formations/                    # photos stock
├── docs/superpowers/specs/
│   └── 2026-05-03-ckim-formation-vitrine-design.md
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 12. Hors-scope (phase 2)

Documenté ici pour référence, à ne PAS implémenter en phase 1 :

- Espace client (inscription aux formations + paiement Stripe)
- Espace admin (gestion des sessions de formation : dates, heures, lieux par formation ; suivi global)
- Espace formateur (gestion + suivi le jour J)
- Auth (Supabase ou Clerk)
- Base de données (Supabase Postgres)
- Migration des fichiers TS `lib/formations/` → DB

L'architecture phase 1 est conçue pour ne pas se fermer la porte à ces évolutions :
- Routes `/(auth)`, `/(client)`, `/(admin)`, `/(formateur)` réservées
- Type `Formation` migrable tel quel vers une table Supabase
- Aucune dépendance bloquante ajoutée

---

## 13. Critères de succès phase 1

- [ ] Les 5 pages publiques sont en ligne et complètes
- [ ] Les 15 pages formation sont générées depuis les fichiers TS, structure identique
- [ ] Le hero d'accueil produit un effet « wow » au load (anime sur le titre + grille + gradient)
- [ ] Toutes les sections animent au scroll (fade-up)
- [ ] La modal devis fonctionne sur toutes les pages formation et envoie l'email à `ckimsecuriteformation@gmail.com`
- [ ] La page Contact propose 2 formulaires fonctionnels (Entreprise / Particulier)
- [ ] Lighthouse Mobile ≥ 90 (performance, accessibilité, SEO, best practices)
- [ ] `prefers-reduced-motion` respecté
- [ ] Site responsive (mobile, tablette, desktop)
- [ ] Déployé sur Vercel
