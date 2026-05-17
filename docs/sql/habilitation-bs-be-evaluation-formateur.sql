-- =============================================================================
-- Évaluation Formateur — Habilitation Électrique BS / BE Manœuvre (SECU-05)
-- =============================================================================
-- Source : PDF Evaluation_BS_BE.docx.pdf (V1CA-11/2025)
--   Extraction Partie 4 — Mise en situation pratique (grille formateur, 20 pts).
--   + Récapitulatif des scores des 4 parties + avis NFC 18-510.
--   Parties 1, 2, 3 (théoriques stagiaire) : déjà en quiz stagiaire séparé.
-- Type 'evaluation_formateur'.
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : ALTER TYPE test_kind ADD VALUE 'evaluation_formateur' appliqué.
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  select id into v_formation_id
  from public.formations
  where slug = 'habilitation-electrique-bs-be-manoeuvre'
     or slug ilike '%habilitation%bs%be%'
     or slug ilike '%secu-05%'
     or titre ilike '%habilitation%bs%be%'
     or titre ilike '%habilitation%électrique%bs%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Habilitation BS/BE Manœuvre introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation formateur — Mise en situation pratique BS / BE Manœuvre',
    'Grille remplie par le formateur lors de la mise en situation individuelle : préparation, consignation/VAT, réalisation de l''intervention, conduite à tenir en cas d''accident simulé. 18 critères / 20 pts. Récapitulatif des 4 parties et avis NFC 18-510.',
    'evaluation_formateur', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    -- ============================================================
    -- 4.1 — PRÉPARATION ET ANALYSE PRÉALABLE (4 pts)
    -- ============================================================
    (v_test_id, 1,
     'Symbole(s) visé(s) par le stagiaire',
     'qcm_unique', '["BS","BE Manœuvre","Les deux"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2,
     '[4.1 Préparation] Prend connaissance du document de travail (fiche d''intervention / ordre de manœuvre) avant d''agir',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3,
     '[4.1 Préparation] Identifie les risques et les EPI nécessaires à son intervention',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     '[4.1 Préparation] Vérifie et met en place ses EPI correctement',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5,
     '[4.1 Préparation] Balise ou sécurise la zone si nécessaire',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- 4.2 — CONSIGNATION ET VAT (6 pts)
    -- ============================================================
    (v_test_id, 6,
     '[4.2 Consignation] Réalise les étapes de consignation dans le bon ordre (séparation, condamnation, identification, VAT, MALT si applicable)',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7,
     '[4.2 Consignation] La VAT est réalisée avec l''appareil adapté et de manière correcte',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     '[4.2 Consignation] Respecte les distances de sécurité réglementaires',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 9,
     '[4.2 Consignation] Communique les actions réalisées au chargé de travaux / formateur',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 10,
     '[4.2 Consignation] Attend la confirmation avant de commencer l''intervention',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- 4.3 — RÉALISATION DE L'INTERVENTION BS / MANŒUVRE BE (6 pts)
    -- ============================================================
    (v_test_id, 11,
     '[4.3 Intervention] L''intervention (remplacement ou raccordement) est réalisée hors tension',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 12,
     '[4.3 Intervention] Les gestes sont précis, maîtrisés et conformes aux consignes',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 13,
     '[4.3 Intervention] Signale verbalement tout incident ou anomalie constatée',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 14,
     '[4.3 Intervention] La remise sous tension est réalisée selon la procédure (vérifications, communication)',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 15,
     '[4.3 Intervention] Rédige ou complète le document de compte-rendu d''intervention',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- 4.4 — CONDUITE À TENIR EN CAS D'ACCIDENT SIMULÉ (4 pts)
    -- ============================================================
    (v_test_id, 16,
     '[4.4 Accident] Ne touche pas la victime sans avoir supprimé le risque électrique',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 17,
     '[4.4 Accident] Coupe ou fait couper l''alimentation en priorité',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 18,
     '[4.4 Accident] Appelle les secours avec les informations appropriées',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 19,
     '[4.4 Accident] Comportement global calme et conforme aux enseignements',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- COMMENTAIRES DU FORMATEUR
    -- ============================================================
    (v_test_id, 20,
     'Points forts du stagiaire',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 21,
     'Points à améliorer',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    -- ============================================================
    -- RÉCAPITULATIF DES SCORES (les 4 parties)
    -- ============================================================
    (v_test_id, 22,
     'Score Partie 1 — Réglementation et habilitations (sur 20)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 23,
     'Score Partie 2 — Risques électriques, sécurité et interventions (sur 45)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 24,
     'Score Partie 3 — Notions électriques appliquées (sur 15)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 25,
     'Score Partie 4 — Mise en situation pratique (sur 20)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 26,
     'TOTAL (sur 100)',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 27,
     'Résultat (seuil : 70/100)',
     'qcm_unique', '["ACQUIS (≥ 70/100)","EN COURS D''ACQUISITION (< 70/100)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 28,
     'Avis NFC 18-510',
     'qcm_unique', '["Favorable","Défavorable","À reformer sur les points suivants"]'::jsonb,
     null, true, null, '["À reformer sur les points suivants"]'::jsonb);

  raise notice 'OK — Évaluation formateur BS/BE créée (test_id=%) avec 28 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
