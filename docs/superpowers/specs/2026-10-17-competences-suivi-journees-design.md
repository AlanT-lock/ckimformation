# Design — Compétences par formation, fin de journée formateur, suivi gamifié entreprise (points 9 & 10)

**Date :** 2026-10-17 · **Statut :** validé

## Besoin
1. **Admin** : pour chaque formation, une rubrique « Compétences » (onglet de la page formation) pour élaborer la liste des compétences.
2. **Formateur** : à la fin de chaque journée de formation, bouton « Terminer la journée » →
   (a) cocher les compétences vues ce jour-là (celles déjà cochées les jours précédents ne sont plus proposées),
   (b) page suivante : commentaire général sur la journée + commentaire optionnel par stagiaire **rattaché à une entreprise**.
3. **Entreprise** : dans son espace, une section par session en cours de ses salariés, présentant de façon gamifiée l'avancée,
   avec la liste des compétences acquises / manquantes et, par journée, les compétences vues, le commentaire général et les
   commentaires sur ses stagiaires.

## Décisions (validées)
| Sujet | Décision |
|---|---|
| Portée des compétences cochées | Tout le groupe (une liste par journée et par session) |
| Correction après validation | Possible tant que la session n'est pas terminée / annulée |
| Durée d'affichage côté entreprise | Du premier jour de formation à 30 jours après le dernier |
| Style | Jauge + frise des journées + badges (25 / 50 / 75 / 100 %) |
| Commentaire général | Visible par toutes les entreprises de la session |
| Commentaire par stagiaire | Visible par l'entreprise du stagiaire (et l'admin) uniquement |
| Email | Un récap par journée à l'entreprise, envoyé une seule fois (pas à chaque correction) |

## Définitions
- **Journée** = une date de `session_creneaux` (une journée peut compter plusieurs créneaux). Le bouton est actif dès que la date est ≤ aujourd'hui (heure de Paris).
- **Stagiaire rattaché à une entreprise** = participant inscrit via une fiche salarié (`inscription_participants.employee_id`) d'une inscription confirmée dont le payeur est un compte `entreprise`.
- **Progression** = compétences vues dans la session ÷ compétences de la formation. Sans compétence définie : journées terminées ÷ journées.
- **Badges** : Démarrage (≥ 25 %), Mi-parcours (≥ 50 %), Dernière ligne droite (≥ 75 %), Objectif atteint (100 %).

## Modèle de données — migration `20261017_competences_suivi.sql`
- `formation_competences` (id, formation_id → formations cascade, libelle, ordre, created_at).
- `session_journees` (id, session_id → sessions cascade, date, terminee_at, terminee_by, commentaire_general, email_sent_at, updated_at ; unique(session_id, date)).
- `session_competences_vues` (id, session_id, competence_id → formation_competences cascade, journee_id → session_journees cascade ; **unique(session_id, competence_id)** : une compétence n'est vue qu'une fois par session).
- `session_journee_commentaires` (id, journee_id cascade, inscription_participant_id cascade, commentaire, updated_at ; unique(journee_id, inscription_participant_id)).
- RLS activée : lecture admin + formateur de la session ; compétences de formation lisibles par tout utilisateur connecté. Écritures uniquement par server actions (client service-role) après contrôle du rôle ; l'espace entreprise lit côté serveur après vérification que l'utilisateur est payeur d'une inscription confirmée de la session.

## Écrans
- **Admin — onglet Compétences** `/admin/formations/[id]/competences` : ajouter, renommer, supprimer, réordonner. Suppression d'une compétence déjà cochée : confirmation (l'historique de cette compétence disparaît).
- **Formateur — page session** : section « Journées de formation » (une ligne par date : à venir / à terminer / terminée le …) ;
  `/formateur/sessions/[id]/journees/[date]` (étape 1, compétences) puis `/formateur/sessions/[id]/journees/[date]/commentaires` (étape 2).
  L'email part à l'enregistrement de l'étape 2 (« Enregistrer » ou « Terminer sans commentaire »), une seule fois par journée.
- **Admin — page session** : section « Suivi des journées » en lecture (tous les commentaires).
- **Entreprise — tableau de bord** : cartes « Formation en cours » (jauge, frise, badges, lien) ; détail `/stagiaire/suivi/[sessionId]` (compétences acquises / à venir, puis journée par journée).

## Hors périmètre
- Compétences par stagiaire, évaluation des acquis.
- Correction du droit du formateur à passer une session en « terminée » (RLS `sessions` admin-only), proposé séparément.
