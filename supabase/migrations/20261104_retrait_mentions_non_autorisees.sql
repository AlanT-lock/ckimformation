-- =============================================================================
--  Retrait des mentions non autorisées dans les fiches formation
-- =============================================================================
--  - AFNOR (C-KIM n'a pas de certification AFNOR) et « auditeur AFNOR »
--  - Normes : NF C18-510 / UTE C 18-510 (habilitations électriques), APSAD R6
--    (incendie) → seules les références au Code du travail sont conservées
--  - HACCP dans les textes de la fiche Hygiène alimentaire
--    (le slug /formations/hygiene-alimentaire-haccp est volontairement conservé)
--
--  Remplacements ciblés (phrase exacte → nouvelle phrase) sur toutes les
--  colonnes texte affichées, pour ne pas écraser d'éventuelles retouches faites
--  depuis l'admin. Idempotent : peut être relancé sans effet de bord.
--
--  À exécuter dans le SQL Editor Supabase du projet C-KIM Formation.
--  La requête finale liste les mentions restantes éventuelles (texte modifié
--  à la main dans l'admin) : si elle renvoie des lignes, les corriger depuis
--  Admin → Formations.
-- =============================================================================

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- Habilitation électrique H0-B0
      (1,  'Tous les 3 ans (préconisation NF C18-510)',
           'Tous les 3 ans (recommandé)'),
      (2,  'et de respecter les prescriptions de sécurité définies par la publication UTE C 18-510.',
           'et de respecter les prescriptions de sécurité prévues par le Code du travail.'),
      (3,  'Publication UTE C 18-510 et normes électriques',
           'Cadre réglementaire : Code du travail (articles R4544-9 et R4544-10)'),
      (4,  'Norme NF C18-510 — Décret du 14 novembre 1988 (version consolidée) — Publication UTE C 18-510 — Articles R4544-9 et R4544-10 du Code du travail.',
           'Articles R4544-9 et R4544-10 du Code du travail.'),
      (5,  'Formation Habilitation Électrique H0-B0 conforme NF C18-510. 7h,',
           'Formation Habilitation Électrique H0-B0. 7h,'),

      -- Habilitation électrique BS / BE Manœuvre
      (6,  'Recyclage recommandé tous les 3 ans (NF C 18-510)',
           'Recyclage recommandé tous les 3 ans'),
      (7,  'dans le respect des textes et de la norme NF C 18-510.',
           'dans le respect des prescriptions de sécurité du Code du travail.'),
      (8,  'Avis après formation conforme à la norme NF C 18-510, attestation',
           'Avis après formation, attestation'),
      (9,  'La norme NF C 18-510 préconise un recyclage tous les 3 ans.',
           'Un recyclage est recommandé tous les 3 ans.'),
      (10, '14h, présentiel, conforme NF C 18-510. Pour',
           '14h, présentiel. Pour'),

      -- Habilitation électrique B1V / B2V
      (11, 'en basse tension conformément à la norme NF C18-510. La formation',
           'en basse tension dans le respect des prescriptions de sécurité du Code du travail. La formation'),
      (12, 'Réglementation : norme NF C18-510 et Code du travail',
           'Réglementation : Code du travail (articles R4544-9 et R4544-10)'),
      (13, 'Épreuves théorique et pratique conformes NF C18-510.',
           'Épreuves théorique et pratique.'),
      (14, 'Norme NF C18-510 (décret du 14/11/2011) — Articles R4544-9 et R4544-10 du Code du travail — Arrêté du 26 avril 2012.',
           'Articles R4544-9 et R4544-10 du Code du travail.'),
      (15, 'B1V/B2V conforme NF C18-510 à Draguignan (PACA).',
           'B1V/B2V à Draguignan (PACA).'),

      -- Incendie — Extincteur & Évacuation
      (16, ' (formation à la sécurité) — Recommandation APSAD R6.',
           ' (formation à la sécurité).'),

      -- Préparer un contrôle qualité (Qualiopi)
      (17, 'Présentiel — 60 % de pratique — animée par un auditeur AFNOR',
           'Présentiel — 60 % de pratique'),
      (18, 'Préparer son audit Qualiopi avec un auditeur AFNOR : 7 critères RNQ,',
           'Préparer son audit Qualiopi : 7 critères RNQ,'),

      -- Hygiène alimentaire (textes uniquement, slug inchangé)
      (19, 'de mettre en œuvre la méthode HACCP et de prévenir',
           'de mettre en œuvre une démarche d''analyse des dangers et de maîtrise des points critiques, et de prévenir'),
      (20, 'Hygiène Alimentaire HACCP',
           'Hygiène Alimentaire'),
      (21, 'Méthode HACCP',
           'Bonnes pratiques d''hygiène et maîtrise des dangers'),
      (22, 'bonnes pratiques d''hygiène HACCP',
           'bonnes pratiques d''hygiène'),
      (23, 'J2 : HACCP',
           'J2 : Analyse des dangers'),
      (24, 'Les 7 principes HACCP',
           'Les 7 étapes de l''analyse des dangers'),
      (25, 'exercices pratiques HACCP.',
           'exercices pratiques d''analyse des dangers.'),
      (26, 'Formation HACCP obligatoire pour la restauration',
           'Formation hygiène alimentaire obligatoire pour la restauration')
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
      programme                 = replace(programme::text, r.ancien, r.nouveau)::jsonb,
      tarifs                    = replace(tarifs::text, r.ancien, r.nouveau)::jsonb,
      formations_recommandees   = replace(formations_recommandees::text, r.ancien, r.nouveau)::jsonb
    WHERE position(r.ancien IN concat_ws(' | ',
      titre, sous_titre, hero_alt, duree, public_concerne, public_detail, prerequis,
      prix_indicatif, modalite, inscription, recyclage, objectifs, evaluation,
      references_reglementaires, seo_title, seo_description,
      programme::text, tarifs::text, formations_recommandees::text
    )) > 0;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
--  Contrôle : mentions restantes (doit renvoyer 0 ligne)
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
WHERE v.valeur ~* '(afnor|apsad|haccp|\mNF\M|C ?18-510|auditeur|subrogation)'
ORDER BY f.slug, v.colonne;
