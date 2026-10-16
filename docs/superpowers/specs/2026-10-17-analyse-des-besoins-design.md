# Design — Analyse des besoins configurable par formation (point 12)

**Date :** 2026-10-17 · **Statut :** validé

## Constat
Aujourd'hui, à l'inscription (particulier ou entreprise), un seul champ libre « Analyse des besoins (obligatoire) »,
stocké dans `inscriptions.analyse_besoins` (affiché sur la demande admin, la fiche demande du stagiaire et l'email admin).
Les sessions dédiées ont leur propre champ libre (`session_reserved_details.analyse_besoins`).

## Besoin
- Onglet **« Analyse des besoins »** sur la page formation (admin) pour configurer les questions.
- Ces questions remplacent le champ libre à l'inscription (particulier **et** entreprise) et sur les sessions dédiées.
- Les réponses sont visibles sur la demande d'inscription (admin).

## Décisions (validées)
| Sujet | Décision |
|---|---|
| Types de questions | Comme les tests : choix unique / multiple, texte libre, échelle, liste, « précisez », obligatoire ou non (même éditeur `QuestionsManager`) |
| Formation sans question | **Questions par défaut** communes, modifiables, utilisées tant que la formation n'a pas les siennes |
| Entreprise | Un seul questionnaire par demande, rempli par l'entreprise pour tous ses salariés |
| Sessions dédiées | Même questionnaire (celui de la formation), rempli par l'entreprise |

## Modèle de données
- Nouvelle valeur d'enum `test_kind` : `analyse_besoins`. Un questionnaire = une ligne `tests` (kind `analyse_besoins`) :
  `formation_id` renseigné = questionnaire propre à la formation ; `formation_id` NULL = **questionnaire par défaut** (unique).
  Les questions vivent dans `questions` (réutilisation de l'éditeur existant).
- Nouvelle table `besoins_reponses` : `inscription_id` (demande) **ou** `session_id` (session dédiée), `test_id`,
  `answers` jsonb = **instantané** des questions et réponses (libellé, type, réponse lisible) pour que la trace reste exacte même si
  les questions changent ensuite (preuve Qualiopi, indicateur 4). Lecture : admin ; écriture : server actions (service-role).
- `inscriptions.analyse_besoins` / `session_reserved_details.analyse_besoins` reçoivent en plus un **résumé texte**
  (« 1. Question — Réponse ») : les écrans et l'email existants continuent de fonctionner, et les anciennes demandes restent lisibles.
- Le questionnaire par défaut est créé à la volée (avec 6 questions génériques) au premier besoin, comme l'enquête financeur.

## Questions par défaut
1. Contexte de la demande (choix multiple : obligation réglementaire, prise de poste, montée en compétences, recyclage, projet personnel / reconversion, autre)
2. Poste ou fonction du/des participant(s) (texte)
3. Niveau actuel sur le sujet (choix unique : débutant, notions, déjà pratiqué, recyclage)
4. Objectifs et compétences attendus (texte)
5. Besoin d'adaptation — handicap, apprentissage, santé, langue (Oui / Non / Préfère en parler par téléphone ; « précisez » si Oui)
6. Contraintes particulières : dates, horaires, lieu, matériel (texte, facultatif)

## Écrans
- **Admin — onglet « Analyse des besoins »** : questions propres à la formation (éditeur) ou, à défaut, aperçu des questions par
  défaut + « Personnaliser pour cette formation » (copie) + « Modifier les questions par défaut ». Retour aux questions par défaut possible.
- **Inscription particulier / entreprise** : le champ libre est remplacé par le questionnaire ; validation des questions obligatoires côté client et serveur.
- **Session dédiée** (entreprise) : le questionnaire remplace le champ libre ; enregistrement possible plusieurs fois.
- **Demande admin** : réponses structurées (ou ancien texte libre pour les demandes antérieures). **Session admin (dédiée)** : idem.
- L'espace formateur n'affiche jamais ces questionnaires (exclusion dans la liste des tests déclenchables).

## Migration `20261018_analyse_besoins.sql`
`alter type test_kind add value if not exists 'analyse_besoins'` + table `besoins_reponses` + RLS. Le script n'utilise pas la nouvelle
valeur (PostgreSQL l'interdit dans la même transaction) : la création du questionnaire par défaut se fait côté application.
