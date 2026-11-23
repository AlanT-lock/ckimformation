-- =============================================================================
--  Mention d'habilitation / d'agrément propre à une formation
-- =============================================================================
--  - formations.mention_documents : texte libre saisi par l'admin (onglet
--    « Compétences » de la formation), repris dans l'encadré « Habilitation,
--    agrément et certification » de l'attestation de fin de formation.
--    Exemples : habilitation INRS (SST), agrément préfectoral (SSIAP),
--    enregistrement DRAAF (hygiène alimentaire), code RNCP / RS et
--    certificateur, organisme testeur (CACES). Vide = aucune mention : le NDA
--    et Qualiopi, portés par l'en-tête de tous les documents, suffisent.
--  - Pré-remplit l'habilitation INRS pour SST et MAC SST (sans écraser une
--    mention déjà saisie).
--  À exécuter UNE FOIS dans le SQL Editor de Supabase. Idempotent.
-- =============================================================================

alter table public.formations
  add column if not exists mention_documents text;

update public.formations
   set mention_documents =
       'C-KIM SÉCURITÉ FORMATION est habilité par l''INRS à dispenser les formations SST et MAC SST : habilitation n° H38732/2026/SST-1/O/07, obtenue le 26/03/2026, valable jusqu''au 26/03/2031.'
 where slug in ('sst-initiale', 'mac-sst')
   and (mention_documents is null or btrim(mention_documents) = '');
