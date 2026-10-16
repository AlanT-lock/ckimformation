# Design — CPF : participation forfaitaire

**Date :** 2026-10-16 · **Statut :** validé

Sur `/financement` (section CPF), le montant fixe « 100 € » du reste à charge est remplacé par la mention
« une participation forfaitaire, revalorisée chaque année », pour ne pas afficher un montant qui change chaque année.

Emplacements : carte « Combien sur votre compte ? » et ligne « Reste à charge » du tableau comparatif.
Plan : modifier `app/(public)/financement/page.tsx`, vérifier le rendu, commit + push.
