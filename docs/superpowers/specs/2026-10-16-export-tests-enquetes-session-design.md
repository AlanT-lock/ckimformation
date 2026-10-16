# Design — Export groupé des tests & enquêtes d'une session

**Date :** 2026-10-16 · **Statut :** validé

## Besoin
Sur la page session **admin**, une rubrique « Tests & enquêtes » permet d'exporter en PDF tout le contenu des tests et enquêtes :
- **d'un stagiaire** (au choix),
- ou **de tous les stagiaires** dans un **seul PDF**.

## Décisions (validées)
- Admin uniquement (pas sur l'espace formateur).
- Un seul PDF pour « tous » : une nouvelle page et un en-tête (stagiaire, entreprise, formation) par stagiaire.
- Contenu par stagiaire : tests et enquêtes remplis par le stagiaire (ordre chronologique), **enquête financeur** de son inscription si l'entreprise a répondu, puis **évaluations formateur** (encadré « usage interne »).
- Le PDF « Toutes les réponses » de la fiche stagiaire inclut lui aussi l'enquête financeur, pour être cohérent.

## Implémentation
- `lib/pdf/tests-data.ts` : sans `completion`, le chargement inclut aussi l'enquête financeur de l'inscription.
- `lib/pdf/TestsResponsesPdf.tsx` : extraction des blocs réutilisables (`PdfHeader`, `StagiaireInfo`, `TestsList`, `PdfFooter`).
- `lib/pdf/TestsSessionPdf.tsx` : document multi-stagiaires.
- Route `GET /api/pdf/tests/session/[sessionId]?participant=<id|vide>` réservée aux admins.
- `app/(app)/admin/sessions/[id]/TestsExportPanel.tsx` : tableau des stagiaires confirmés (nombre de tests / enquêtes complétés, bouton PDF) + sélecteur « Tous les stagiaires / un stagiaire » et bouton « Exporter en PDF ».

## Plan
1. Loader + refactor PDF + nouveau document.
2. Route API session.
3. Rubrique sur la page session admin.
4. Vérification (tsc, lint, rendu PDF factice, build) puis commit + push.
