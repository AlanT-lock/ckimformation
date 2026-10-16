# Design — Pages « Nos résultats », CGV, Règlement intérieur, Livret d'accueil

**Date :** 2026-10-16
**Statut :** validé (design)

## Besoin

Quatre nouvelles pages publiques, accessibles depuis le pied de page (exigence Qualiopi, indicateurs 1 et 2 : trouvables sans moteur de recherche interne) :

| URL | Source | PDF téléchargeable |
|---|---|---|
| `/nos-resultats` | `Page_Nos_resultats_CKIM.pdf` | `public/documents/nos-resultats-ckim-formation.pdf` (pages 1-2 uniquement) |
| `/cgv` | `CGV_C-KIM_SECURITE_FORMATION_V2.1_oct2026.pdf` | `public/documents/cgv-ckim-formation.pdf` |
| `/reglement-interieur` | `Reglement_interieur_C-KIM_V2_oct2026.pdf` | `public/documents/reglement-interieur-ckim-formation.pdf` |
| `/livret-accueil` | `LIVRET D'ACCUEIL STAGIAIRE C-KIM – version courte 102026.pdf` | `public/documents/livret-accueil-ckim-formation.pdf` (remplace l'ancien, même chemin) |

## Décisions

- **Contenu** : texte des PDF repris intégralement en HTML (pas d'iframe), pour la lisibilité mobile et le référencement.
- **Nos résultats** : la page 3 du PDF (« Notes pour l'intégration (webmaster) ») n'est ni publiée sur la page ni incluse dans le PDF téléchargeable.
- **Livret d'accueil** : le nouveau PDF écrase l'ancien au même chemin, pour que les anciens liens restent valides.
- **Hero** : chaque page a un hero sombre (même style que `/organisme`) avec surtitre, titre, version/date, et un bouton « Télécharger le PDF » (`download` + ouverture dans un nouvel onglet).
- **Composant partagé** `components/sections/LegalDocHero.tsx` + petits helpers de mise en forme (`LegalArticle`, encadré `LegalCallout`) pour garder les 4 pages homogènes.
- **Pied de page** : colonne « Légal » → Nos résultats, CGV, Règlement intérieur, Livret d'accueil (pages, plus le PDF direct), Mentions légales, Confidentialité.
- **SEO** : pages indexables (contrairement aux mentions légales), ajoutées au `sitemap.ts`.
- **Coquille source** : « (remplace la version 2.0)VP » dans les CGV est corrigé en « (remplace la version 2.0) ».

## Hors périmètre

- Les liens vers ces pages depuis la pop-up d'émargement (point 2) et les fiches formation.
