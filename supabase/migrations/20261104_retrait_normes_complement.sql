-- =============================================================================
--  Complément : retrait des normes NF C 18-510 / NF C 18-550 restantes
-- =============================================================================
--  Textes saisis ou retouchés depuis l'admin (absents du code), relevés sur le
--  site en production le 04/11/2026 :
--    - descriptions SEO des fiches B1V/B2V et BS/BE Manœuvre
--    - fiches véhicules électriques et hybrides (B0L, B1L/B2L, BCL/BRL/BEL) :
--      titre de module, programme, références réglementaires, description SEO
--
--  Même principe que 20261104_retrait_mentions_non_autorisees.sql :
--  remplacements de phrases exactes, idempotent, puis requête de contrôle
--  (doit renvoyer 0 ligne).
--
--  À exécuter dans le SQL Editor Supabase du projet C-KIM Formation.
-- =============================================================================

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- B1V / B2V — description SEO
      (1,  'B1V/B2V conforme NF C18-510 à Draguignan',
           'B1V/B2V à Draguignan'),
      (2,  'Travaux d''ordre électrique, norme NF C 18-510, voisinage',
           'Travaux d''ordre électrique, voisinage'),

      -- BS / BE Manœuvre — description SEO
      (3,  'Région PACA. Norme NF C 18-510, intervention',
           'Région PACA. Intervention'),

      -- Véhicules électriques — références réglementaires (ligne de norme retirée,
      -- les lignes INRS ED 6313 et Code du travail sont conservées)
      (4,  E'• NF C 18-550 – Opérations sur véhicules et engins à énergie électrique embarquée – Prévention du risque électrique.\n',
           ''),
      (5,  E'• NF C 18-550 – Opérations sur véhicules et engins à énergie électrique embarquée – Prévention du\nrisque électrique.\n',
           ''),
      (6,  E'NF C18-510 – Opérations sur véhicules et engins à énergie électrique embarquée – Prévention du\nrisque électrique.\n',
           ''),

      -- Véhicules électriques — programme
      (7,  'Habilitation électrique – NF C 18-550',
           'Habilitation électrique – Véhicules électriques et hybrides'),
      (8,  '• Principes de l''habilitation électrique et présentation de la NF C 18-550.',
           '• Principes de l''habilitation électrique sur véhicules et engins à énergie électrique embarquée.'),

      -- Véhicules électriques — descriptions SEO (listes de mots-clés)
      (9,  'habilitation électrique NF C 18-550',
           'habilitation électrique véhicule hybride'),
      (10, 'formation NF C 18-550 ',
           'formation habilitation électrique ')
    ) AS t(ordre, ancien, nouveau)
    ORDER BY ordre
  LOOP
    UPDATE public.formations SET
      titre                     = replace(titre, r.ancien, r.nouveau),
      sous_titre                = replace(sous_titre, r.ancien, r.nouveau),
      hero_alt                  = replace(hero_alt, r.ancien, r.nouveau),
      duree                     = replace(duree, r.ancien, r.nouveau),
      public_concerne           = replace(public_concerne, r.ancien, r.nouveau),
      public_detail             = replace(public_detail, r.ancien, r.nouveau),
      prerequis                 = replace(prerequis, r.ancien, r.nouveau),
      prix_indicatif            = replace(prix_indicatif, r.ancien, r.nouveau),
      modalite                  = replace(modalite, r.ancien, r.nouveau),
      inscription               = replace(inscription, r.ancien, r.nouveau),
      recyclage                 = replace(recyclage, r.ancien, r.nouveau),
      objectifs                 = replace(objectifs, r.ancien, r.nouveau),
      evaluation                = replace(evaluation, r.ancien, r.nouveau),
      references_reglementaires = replace(references_reglementaires, r.ancien, r.nouveau),
      seo_title                 = replace(seo_title, r.ancien, r.nouveau),
      seo_description           = replace(seo_description, r.ancien, r.nouveau),
      -- programme : le texte JSON encode les retours à la ligne en \n, on
      -- applique donc la version encodée JSON de la phrase.
      programme                 = replace(programme::text,
                                    substr(to_jsonb(r.ancien)::text, 2, length(to_jsonb(r.ancien)::text) - 2),
                                    substr(to_jsonb(r.nouveau)::text, 2, length(to_jsonb(r.nouveau)::text) - 2))::jsonb,
      tarifs                    = replace(tarifs::text,
                                    substr(to_jsonb(r.ancien)::text, 2, length(to_jsonb(r.ancien)::text) - 2),
                                    substr(to_jsonb(r.nouveau)::text, 2, length(to_jsonb(r.nouveau)::text) - 2))::jsonb,
      formations_recommandees   = replace(formations_recommandees::text,
                                    substr(to_jsonb(r.ancien)::text, 2, length(to_jsonb(r.ancien)::text) - 2),
                                    substr(to_jsonb(r.nouveau)::text, 2, length(to_jsonb(r.nouveau)::text) - 2))::jsonb
    WHERE position(r.ancien IN concat_ws(' | ',
      titre, sous_titre, hero_alt, duree, public_concerne, public_detail, prerequis,
      prix_indicatif, modalite, inscription, recyclage, objectifs, evaluation,
      references_reglementaires, seo_title, seo_description
    )) > 0
       OR position(substr(to_jsonb(r.ancien)::text, 2, length(to_jsonb(r.ancien)::text) - 2) IN concat_ws(' | ',
      programme::text, tarifs::text, formations_recommandees::text
    )) > 0;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
--  Contrôle : mentions restantes, toutes fiches confondues (doit renvoyer 0 ligne)
-- -----------------------------------------------------------------------------
SELECT f.slug, v.colonne, v.valeur
FROM public.formations f
CROSS JOIN LATERAL (VALUES
  ('titre', f.titre),
  ('sous_titre', f.sous_titre),
  ('hero_alt', f.hero_alt),
  ('duree', f.duree),
  ('public_concerne', f.public_concerne),
  ('public_detail', f.public_detail),
  ('prerequis', f.prerequis),
  ('prix_indicatif', f.prix_indicatif),
  ('modalite', f.modalite),
  ('inscription', f.inscription),
  ('recyclage', f.recyclage),
  ('objectifs', f.objectifs),
  ('evaluation', f.evaluation),
  ('references_reglementaires', f.references_reglementaires),
  ('seo_title', f.seo_title),
  ('seo_description', f.seo_description),
  ('programme', f.programme::text),
  ('tarifs', f.tarifs::text),
  ('formations_recommandees', f.formations_recommandees::text)
) AS v(colonne, valeur)
WHERE v.valeur ~* '(afnor|apsad|haccp|\mNF\M|C ?18-5[0-9]{2}|auditeur|subrogation|p[oô]le ?emploi)'
ORDER BY f.slug, v.colonne;
