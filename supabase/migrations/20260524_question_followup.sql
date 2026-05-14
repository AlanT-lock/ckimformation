-- =============================================================================
--  Questions : champ libre conditionnel (follow-up)
-- =============================================================================
--  - follow_up_options : liste d'options (texte) qui déclenchent l'affichage
--    d'un champ libre supplémentaire dans le formulaire front.
--  - Exemple : pour une question Oui/Non, on peut indiquer ["Oui"] : si le
--    stagiaire répond Oui, un textarea apparaît pour qu'il précise.
--  - La précision est stockée dans `responses.valeur_json.followup` à côté
--    de `value` (pour qcm_unique).
-- =============================================================================

alter table public.questions
  add column if not exists follow_up_options jsonb not null default '[]'::jsonb;
