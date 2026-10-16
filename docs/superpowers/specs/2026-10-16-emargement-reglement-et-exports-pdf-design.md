# Design — Acceptation du règlement avant émargement + exports PDF par stagiaire

**Date :** 2026-10-16
**Statut :** validé (design)

## 1. Acceptation obligatoire avant l'émargement

### Besoin
Avant de signer son premier émargement d'une session, le stagiaire coche obligatoirement :

> J'ai reçu le [règlement intérieur], pris connaissance du [livret d'accueil] et été informé(e) du cadre de respect mutuel et des moyens de signaler une situation de violence, de harcèlement ou de discrimination (référent : Camel ATIL, 06 62 51 55 59).

Les deux liens ouvrent `/reglement-interieur` et `/livret-accueil` dans un nouvel onglet.

### Décisions (validées)
- **Portée : par session** (= par `inscription_participants`). Un recyclage redemande l'acceptation.
- **Sessions en cours :** si l'acceptation manque, elle est demandée avant le **prochain** émargement, même si ce n'est pas le premier.
- **Horodatage :** date et heure du clic sur « Valider » (et non de la signature).

### Modèle de données
Migration `20261016_reglement_acceptation.sql` :
```sql
alter table public.inscription_participants
  add column if not exists reglement_accepte_at timestamptz;
```
Écriture uniquement côté serveur (client service-role) après vérification que l'utilisateur est bien le participant. Aucune nouvelle policy RLS.

### Flux
1. `parcours/page.tsx` charge `reglement_accepte_at` et passe au client la liste des sessions déjà acceptées.
2. Dans la pop-up d'émargement (non fermable) : si la session n'est pas acceptée, on affiche d'abord l'étape « case à cocher » ; le bouton « Valider et passer à l'émargement » reste désactivé tant que la case n'est pas cochée.
3. Server action `acceptReglementForCurrentUser(sessionId)` : vérifie le participant (même logique que la signature), écrit `reglement_accepte_at = now()` seulement s'il est nul (le premier horodatage fait foi).
4. `signCreneauForCurrentUser` refuse la signature si `reglement_accepte_at` est nul (garde-fou serveur).

Le texte de la case est centralisé dans `lib/reglement/acceptation.ts` (pop-up, fiche admin, PDF).

## 2. Exports PDF

### Feuille d'émargement individuelle (existante, enrichie)
- Nouvelle colonne **Formateur** : signature du formateur sur le créneau (`formateur_emargements`).
- Nouveau bloc **Règlement intérieur & livret d'accueil** : texte de la case + « Accepté le JJ/MM/AAAA à HH:MM », ou « Non accepté ».

### Feuille d'émargement collective de session (nouvelle)
- Route `GET /api/pdf/emargements/session/[sessionId]` (admin ou formateur de la session).
- Un tableau par créneau : stagiaire, entreprise, signé le, signature ; ligne formateur en fin de tableau ; « Absent » si marqué absent.
- Tableau récapitulatif des acceptations du règlement (stagiaire → date/heure).
- Bouton « Feuille collective (PDF) » sur la page session admin (section Feuille d'émargement) et sur la page session formateur.

### Un PDF par test / enquête
- La route existante `GET /api/pdf/tests/[participantId]?session=…` accepte `&completion=<id>` pour ne rendre qu'une complétion.
- Le chargement des données est extrait dans `lib/pdf/tests-data.ts` (réutilisé par le point 6).
- **Enquête financeur** : si l'entreprise a répondu pour l'inscription du stagiaire, sa complétion est exportable via le même paramètre `completion` (contrôle : la complétion appartient au participant, ou c'est l'enquête financeur de son inscription).

### Fiche stagiaire de la session (`/admin/sessions/[id]/participants/[participantId]`)
- Bloc **Règlement intérieur** : accepté le … / non accepté.
- Tableau des émargements : ajout de la colonne « Signé le » (date + heure).
- Chaque test / enquête a son bouton **PDF** ; le bouton « Toutes les réponses (PDF) » est conservé.
- Section **Enquête financeur** (si répondue) avec son bouton PDF.
- Correction du libellé « Informatif » affiché pour les évaluations formateur.
- Les noms de la liste « Stagiaires » de la page session deviennent des liens vers cette fiche (aujourd'hui seule la table des demandes y mène).

## Hors périmètre
- Export groupé tests & enquêtes par stagiaire / tous stagiaires (point 6).
- Mode « tablette » où le formateur fait signer les stagiaires.
