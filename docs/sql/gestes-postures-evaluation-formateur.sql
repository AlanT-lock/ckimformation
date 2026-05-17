-- =============================================================================
-- Évaluation Formateur — Gestes et Postures (SECU-02)
-- =============================================================================
-- Source : PDF Evaluation_Finale_Gestes_Postures.docx (V1CA-11/2025)
--   Extraction Partie 4 — Mise en situation pratique (grille formateur, 40 pts).
--   + Récapitulatif des scores des 4 parties.
--   Parties 1, 2, 3 stagiaire : déjà en quiz stagiaire séparé.
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
  where slug = 'gestes-et-postures'
     or slug ilike '%gestes%postures%'
     or slug ilike '%secu-02%'
     or titre ilike '%gestes et postures%'
     or titre ilike '%prévention%tms%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Gestes et Postures introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation formateur — Mise en situation pratique Gestes et Postures',
    'Grille remplie par le formateur lors de la mise en situation individuelle : préparation, lever depuis le sol, transport et dépose, postures et automatismes. 20 critères / 40 pts. Récap des 4 parties + résultat ACQUIS / EN COURS.',
    'evaluation_formateur', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    -- ============================================================
    -- 4.1 — PRÉPARATION DE L'INTERVENTION (8 pts)
    -- ============================================================
    (v_test_id, 1,
     '[4.1 Préparation] Analyse la charge avant de la saisir (poids, forme, stabilité)',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2,
     '[4.1 Préparation] Évalue le trajet et vérifie que la voie est dégagée',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3,
     '[4.1 Préparation] Sélectionne l''aide mécanique adaptée si nécessaire',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     '[4.1 Préparation] Choisit et met en place les EPI appropriés (gants, chaussures…)',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- 4.2 — TECHNIQUE DE LEVER DEPUIS LE SOL (12 pts)
    -- ============================================================
    (v_test_id, 5,
     '[4.2 Lever] Approche de la charge : pieds écartés à la largeur des épaules, un pied légèrement avancé',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6,
     '[4.2 Lever] Descente en fléchissant les genoux, dos droit et contracté',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7,
     '[4.2 Lever] Saisie ferme de la charge, au plus près du corps',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     '[4.2 Lever] Montée par extension des jambes, sans à-coups',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 9,
     '[4.2 Lever] Dos maintenu droit tout au long du lever',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 10,
     '[4.2 Lever] Absence de torsion du tronc pendant le mouvement',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- 4.3 — TRANSPORT ET DÉPOSE (10 pts)
    -- ============================================================
    (v_test_id, 11,
     '[4.3 Transport] Charge maintenue proche du corps, à hauteur du bassin',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 12,
     '[4.3 Transport] Déplacement avec les jambes (pas de dandinement du buste)',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 13,
     '[4.3 Transport] Changement de direction par déplacement des pieds (sans vriller le dos)',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 14,
     '[4.3 Transport] Dépose contrôlée : flexion des genoux, charge posée sans lâcher',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 15,
     '[4.3 Transport] Vérification de la stabilité de la charge après dépose',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- 4.4 — POSTURES ET AUTOMATISMES (10 pts)
    -- ============================================================
    (v_test_id, 16,
     '[4.4 Postures] Posture de travail debout : équilibre du bassin, poids équilibré sur les deux pieds',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 17,
     '[4.4 Postures] Pas de cambrure excessive ni de dos voûté en position debout',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 18,
     '[4.4 Postures] Hauteur du plan de travail adaptée à la taille du stagiaire',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 19,
     '[4.4 Postures] Comportement global : application des principes tout au long de la mise en situation',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 20,
     '[4.4 Postures] Communication : signalement verbal d''une difficulté ou d''un risque identifié',
     'qcm_unique', '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- COMMENTAIRES DU FORMATEUR
    -- ============================================================
    (v_test_id, 21,
     'Points forts observés',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 22,
     'Points à améliorer / axes de progression',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 23,
     'Recommandations spécifiques au poste de travail',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    -- ============================================================
    -- RÉCAPITULATIF DES SCORES
    -- ============================================================
    (v_test_id, 24,
     'Score Partie 1 — Connaissances théoriques (sur 20)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 25,
     'Score Partie 2 — Analyse de situations (sur 20)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 26,
     'Score Partie 3 — Manutention et techniques pratiques (sur 20)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 27,
     'Score Partie 4 — Mise en situation pratique (sur 40)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 28,
     'TOTAL (sur 100)',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 29,
     'Résultat de l''évaluation (seuil : 70/100)',
     'qcm_unique', '["ACQUIS (≥ 70/100)","EN COURS D''ACQUISITION (< 70/100)"]'::jsonb,
     null, true, null, '[]'::jsonb);

  raise notice 'OK — Évaluation formateur Gestes et Postures créée (test_id=%) avec 29 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
