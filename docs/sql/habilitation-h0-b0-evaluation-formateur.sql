-- =============================================================================
-- Évaluation Formateur — Habilitation Électrique H0 / B0 (SECU-06)
-- =============================================================================
-- Source : PDF Evaluation_H0B0.docx.pdf (V1CA-11/2025)
--   Extraction Partie 4 — Mise en situation pratique (grille formateur, 30 pts).
--   + Récapitulatif des scores des 4 parties.
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
  where slug = 'habilitation-electrique-h0-b0'
     or slug ilike '%habilitation%h0%b0%'
     or slug ilike '%secu-06%'
     or titre ilike '%habilitation%h0%b0%'
     or titre ilike '%habilitation%électrique%h0%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Habilitation H0/B0 introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation formateur — Mise en situation pratique H0 / B0',
    'Grille remplie par le formateur lors de la mise en situation individuelle : identification des risques, réaction à une consignation simulée, conduite à tenir face à un accident. 15 critères / 30 pts. Récap des 4 parties + résultat ACQUIS / EN COURS.',
    'evaluation_formateur', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    -- ============================================================
    -- 4.1 — IDENTIFICATION DES RISQUES ET ANALYSE DE SITUATION (8 pts)
    -- ============================================================
    (v_test_id, 1,
     '[4.1] Identifie correctement les zones à risque électrique sur l''installation présentée',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2,
     '[4.1] Reconnaît les symboles et balisages de sécurité électrique',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3,
     '[4.1] Détermine le domaine de tension concerné (BT / HT)',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     '[4.1] Identifie les EPI nécessaires avant toute approche',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- 4.2 — RÉACTION FACE À UNE CONSIGNATION SIMULÉE (10 pts)
    -- ============================================================
    (v_test_id, 5,
     '[4.2] Vérifie que l''installation est hors tension avant de s''approcher',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6,
     '[4.2] Réalise ou contrôle correctement la VAT (Vérification d''Absence de Tension)',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7,
     '[4.2] Respecte les distances de sécurité réglementaires (DMA, DLVS)',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     '[4.2] Utilise correctement les EPI mis à disposition',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 9,
     '[4.2] Communique avec le chargé de consignation de façon appropriée',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- 4.3 — CONDUITE À TENIR FACE À UN ACCIDENT SIMULÉ (12 pts)
    -- ============================================================
    (v_test_id, 10,
     '[4.3] Ne touche pas la victime sans avoir coupé le courant',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 11,
     '[4.3] Coupe ou fait couper l''alimentation électrique en priorité',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 12,
     '[4.3] Appelle les secours avec les informations appropriées (nature, lieu, état de la victime)',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 13,
     '[4.3] Adopte la position correcte pour sécuriser la victime dans l''attente des secours',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 14,
     '[4.3] Comportement global calme, méthodique et conforme aux enseignements',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 15,
     '[4.3] Sait identifier et utiliser un extincteur adapté si nécessaire',
     'qcm_unique', '["Réalisé","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- COMMENTAIRES DU FORMATEUR
    -- ============================================================
    (v_test_id, 16,
     'Points forts du stagiaire',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 17,
     'Points à améliorer',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    -- ============================================================
    -- RÉCAPITULATIF DES SCORES
    -- ============================================================
    (v_test_id, 18,
     'Score Partie 1 — Réglementation et habilitation (sur 25)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 19,
     'Score Partie 2 — Risques électriques et prévention (sur 35)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 20,
     'Score Partie 3 — Notions élémentaires d''électricité (sur 10)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 21,
     'Score Partie 4 — Mise en situation pratique (sur 30)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 22,
     'TOTAL (sur 100)',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 23,
     'Résultat (seuil : 70/100)',
     'qcm_unique', '["ACQUIS (≥ 70/100)","EN COURS D''ACQUISITION (< 70/100)"]'::jsonb,
     null, true, null, '[]'::jsonb);

  raise notice 'OK — Évaluation formateur H0/B0 créée (test_id=%) avec 23 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
