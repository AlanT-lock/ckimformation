# Plan — Compétences, fin de journée, suivi entreprise

Spec : `docs/superpowers/specs/2026-10-17-competences-suivi-journees-design.md`

1. **Migration** `supabase/migrations/20261017_competences_suivi.sql` (4 tables + RLS + index). À exécuter dans Supabase **avant** le déploiement.
2. **Logique pure** `lib/suivi/progress.ts` (journées d'une session, progression, badges, fenêtre d'affichage) + tests vitest.
3. **Chargement** `lib/suivi/data.ts` (server-only) : suivi d'une session (journées, compétences vues, commentaires filtrés par entreprise).
4. **Admin compétences** : onglet `FormationTabs` + `/admin/formations/[id]/competences` (liste éditable, server actions).
5. **Formateur** : section « Journées » sur la page session ; pages étape 1 (compétences) et étape 2 (commentaires) ; server actions avec contrôle formateur/admin et session non terminée.
6. **Email** `lib/email/templates/journee-terminee.ts` + envoi unique (`email_sent_at`) aux entreprises de la session.
7. **Entreprise** : composant `SuiviCard` (jauge, frise, badges) sur le tableau de bord ; page détail `/stagiaire/suivi/[sessionId]`.
8. **Admin session** : section « Suivi des journées » (lecture).
9. **Vérification** : tsc, lint, tests, build, rendu des composants ; commit, puis push après migration.
