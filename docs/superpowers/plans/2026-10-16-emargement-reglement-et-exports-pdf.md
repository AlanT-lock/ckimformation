# Plan — Acceptation du règlement + exports PDF

Spec : `docs/superpowers/specs/2026-10-16-emargement-reglement-et-exports-pdf-design.md`

1. **Migration** `supabase/migrations/20261016_reglement_acceptation.sql` (colonne `reglement_accepte_at`). À exécuter dans l'éditeur SQL Supabase **avant** le déploiement.
2. **Constante** `lib/reglement/acceptation.ts` : texte de la case + URLs.
3. **Stagiaire**
   - `parcours/actions.ts` : `acceptReglementForCurrentUser`, garde-fou dans `signCreneauForCurrentUser` (factoriser la recherche du participant).
   - `parcours/page.tsx` : charger `reglement_accepte_at`, passer `reglementAcceptedSessionIds`.
   - `ParcoursClient.tsx` : étape d'acceptation dans la pop-up d'émargement.
4. **PDF**
   - `lib/pdf/EmargementPdf.tsx` + route : colonne formateur, bloc acceptation.
   - `lib/pdf/EmargementSessionPdf.tsx` + `app/api/pdf/emargements/session/[sessionId]/route.tsx`.
   - `lib/pdf/tests-data.ts` (extraction) + paramètre `completion` sur `app/api/pdf/tests/[participantId]` (incl. enquête financeur).
5. **Admin**
   - Fiche stagiaire : bloc acceptation, « signé le », boutons PDF par complétion, section financeur, libellé évaluation formateur.
   - `SessionParticipantsManager` : noms cliquables vers la fiche.
   - Page session admin + page session formateur : bouton « Feuille collective (PDF) ».
6. **Vérification** : `tsc`, `eslint`, `next build`, rendu des PDF (script local), contrôle visuel.
7. **Commit**, puis push une fois la migration appliquée en production.
