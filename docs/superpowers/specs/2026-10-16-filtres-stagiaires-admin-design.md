# Design — Filtres de la page admin Stagiaires

**Date :** 2026-10-16 · **Statut :** validé

## Besoin
Sur `/admin/stagiaires`, en plus de la recherche texte :
- **Date d'inscription (période)** : du / au, sur la **date de création** du compte (profil) ou de la fiche salarié (sans compte).
- **Entreprise** : liste déroulante de toutes les entreprises (comptes `account_type = 'entreprise'`), avec une **barre de recherche** dans la liste.
- **Colonne « Inscrit le »** et **tri** : alphabétique (défaut) ou plus récents d'abord.

## Décisions
- Filtre entreprise = ses salariés avec ou sans compte (`employees.employer_profile_id`, `profiles.employer_profile_id`) **+ le compte entreprise lui-même** s'il s'est ajouté comme salarié (fiche `employees` liée à son propre profil).
- Les bornes de dates sont interprétées en heure de Paris (jour « au » inclus).
- Tous les filtres vivent dans l'URL (`q`, `du`, `au`, `entreprise`, `tri`) : lien partageable, retour arrière OK. La recherche texte conserve les autres filtres.
- `entreprise` est validé comme UUID côté serveur avant d'être utilisé dans une requête.
- Correction au passage : pour un salarié **avec compte**, la colonne « Société / Employeur » affiche l'entreprise de l'employeur (aujourd'hui vide).

## Plan
1. `lib/stagiaires/filters.ts` : parsing des paramètres + bornes de jour Europe/Paris (+ tests vitest).
2. `app/(app)/admin/stagiaires/StagiairesFilters.tsx` : dates, combobox entreprise avec recherche, tri, réinitialiser.
3. `SearchInput` : conserver les autres paramètres de l'URL.
4. `page.tsx` : application des filtres aux deux requêtes, liste des entreprises, colonne « Inscrit le », tri.
5. Vérification (tsc, lint, tests, build, navigateur) puis commit + push.
