# Plan — Pages légales Qualiopi

Spec : `docs/superpowers/specs/2026-10-16-pages-legales-qualiopi-design.md`

1. **PDF** : copier les 4 PDF dans `public/documents/` (noms stables en kebab-case). Pour « Nos résultats », ne garder que les pages 1-2 (extraction via `pdf-lib` dans un script jetable hors du dépôt).
2. **Composants** : `components/sections/LegalDoc.tsx` — `LegalDocHero` (surtitre, titre, sous-titre, méta, bouton de téléchargement) et `LegalArticle`, `LegalCallout`.
3. **Pages** : `app/(public)/nos-resultats/page.tsx`, `cgv/page.tsx`, `reglement-interieur/page.tsx`, `livret-accueil/page.tsx`, chacune avec `metadata` (title + description).
4. **Pied de page** : mettre à jour la colonne « Légal » de `components/layout/Footer.tsx`.
5. **Sitemap** : ajouter les 4 URLs dans `app/sitemap.ts`.
6. **Vérification** : `tsc`, `eslint`, `next build`, puis contrôle visuel desktop + mobile (tableaux qui défilent horizontalement) et test des liens de téléchargement.
7. **Commit + push**.
