# Design — Liens d'enquête à froid et financeur sans connexion

**Date :** 2026-10-16 · **Statut :** validé

## Constat
- **Enquête à froid** : le lien `/enquete/<token>` ne demande déjà pas de connexion ; le token (48 caractères hex, aléatoire) identifie le participant (`enquete_froid_envois.inscription_participant_id`) et reste valable jusqu'à la réponse (`responded_at`). Tous les tokens en base résolvent correctement.
- **Problème remonté : « Lien invalide / expiré ».** Les liens des emails sont construits avec `NEXT_PUBLIC_SITE_URL`. Dans la configuration de production téléchargée en local (mai 2026) cette variable vaut `https://ckim-formation.vercel.app`, adresse qui renvoie une **404 Vercel `DEPLOYMENT_NOT_FOUND`**. La même page sur `https://ckimformation.fr` fonctionne.
- 14 endroits du code redéfinissent chacun leur URL de site, avec des valeurs par défaut incohérentes (`ckim-formation.fr` avec tiret — mauvais domaine —, `localhost`, `project-0t9kh.vercel.app`…).
- **Enquête financeur** : connexion obligatoire (redirection vers `/login`, contrôle du payeur) → 0 réponse sur 3 envois.

## Décisions (validées)
- Les liens envoyés par email pointent vers **https://ckimformation.fr**.
- Enquête financeur : **même système que l'enquête à froid** — un lien par inscription, sans connexion, le token identifie l'inscription (donc l'entreprise payeuse) ; le lien reste valable tant que l'enquête n'a pas été envoyée. Les 3 liens déjà envoyés fonctionneront tels quels.

## Implémentation
1. `lib/site-url.ts` → `siteUrl()` unique :
   - `NEXT_PUBLIC_SITE_URL` si elle est définie **et** ne pointe pas vers un domaine `*.vercel.app` ;
   - sinon `https://ckimformation.fr` en production, `http://localhost:3000` en dev.
   Les 14 helpers locaux sont remplacés par ce module.
2. `/enquete-financeur/[token]` : plus de redirection vers la connexion ni de contrôle du compte ; affichage du nom de l'entreprise. `submitEnqueteFinanceur` ne vérifie plus que le token (non répondu), et annule la complétion si l'enregistrement des réponses échoue (comme l'enquête à froid).
3. Email financeur : suppression de la phrase « Vous devrez vous connecter à votre espace entreprise ».
4. Enquête à froid : si une complétion existe déjà pour ce participant et ce test (réponse donnée ailleurs), l'envoi est marqué comme répondu et la page affiche « déjà répondu » au lieu d'une erreur.
5. Tests unitaires de `siteUrl()`.

## Action manuelle recommandée
Dans Vercel → Settings → Environment Variables (Production), mettre `NEXT_PUBLIC_SITE_URL = https://ckimformation.fr`, et vérifier que `https://ckimformation.fr/**` figure dans les Redirect URLs de Supabase Auth.
