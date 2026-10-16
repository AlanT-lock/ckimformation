# Design — Menu de la page formation + rubrique Tests & enquêtes

**Date :** 2026-10-16 · **Statut :** validé

## Besoin
- Retirer « Tests & enquêtes » du menu principal de l'admin.
- Sur chaque page formation (admin), un petit menu (onglets) au-dessus de la section « Fiche PDF » :
  « Fiche formation » et « Tests & enquêtes ». D'autres onglets viendront (Compétences, Analyse des besoins).
- L'onglet Tests & enquêtes ne montre que les tests et enquêtes **de cette formation**.

## Décisions (validées)
- L'**enquête financeur** (commune à toutes les formations) est accessible **depuis chaque formation** :
  encart dans l'onglet Tests & enquêtes, qui ouvre l'enquête commune sous le menu de la formation.
- La création, l'édition et les résultats d'un test s'ouvrent **sous le menu de la formation** (menu toujours visible).

## Routes
| Route | Contenu |
|---|---|
| `/admin/formations/[id]` | onglet Fiche formation (fiche PDF + formulaire) |
| `/admin/formations/[id]/tests` | liste des tests / enquêtes de la formation + encart enquête financeur |
| `/admin/formations/[id]/tests/nouveau` | création (formation figée) |
| `/admin/formations/[id]/tests/[testId]` | édition |
| `/admin/formations/[id]/tests/[testId]/resultats` | résultats |
| `/admin/formations/[id]/tests/financeur` | enquête financeur commune |

`app/(app)/admin/formations/[id]/layout.tsx` porte l'en-tête de la formation (titre, retour, voir le site, supprimer) et les onglets (`FormationTabs`, actif selon l'URL).

## Anciennes URLs (`/admin/tests/...`)
Conservées en **redirections** pour ne casser aucun lien (emails, favoris, tableau de bord) :
- `/admin/tests` → `/admin/formations` ;
- `/admin/tests/formation/[id]`, `/admin/tests/nouveau?formation=…`, `/admin/tests/[id]`, `/admin/tests/[id]/resultats` → équivalent sous la formation ;
- l'enquête financeur reste aussi joignable seule (`/admin/tests/financeur`, `/admin/tests/[id]/resultats`) depuis « Analyses enquêtes ».

## Implémentation
- Les corps de pages existants deviennent des vues réutilisables (`TestsListView`, `NewTestView`, `TestEditView`, `TestResultsView`, `FinanceurView`) paramétrées par leurs liens.
- Server actions : redirections et `revalidatePath` vers les nouvelles routes.
- Liens internes mis à jour (tableau de bord, analyses enquêtes, fiche stagiaire).
