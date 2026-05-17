-- =============================================================================
-- Évaluation Formative — Partie SECOURIR (SST)
-- =============================================================================
-- Source : PDF 3_Evaluation_Formative_Secourir.docx.pdf (V1CA-11/2025)
-- Type 'evaluation_formateur' — remplie par le formateur pour chaque stagiaire.
-- Score total /20 points.
-- 3 mises en situation + évaluation transversale de l'alerte + grille globale.
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : migration 20260525_evaluation_formateur.sql appliquée.
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  select id into v_formation_id
  from public.formations
  where slug = 'sst'
     or slug = 'sauveteur-secouriste-travail'
     or slug ilike '%sauveteur%secouriste%'
     or slug ilike '%sst%'
     or titre ilike '%sauveteur%secouriste%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation SST introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation formative — Partie Secourir (formateur)',
    'Évaluation pratique remplie par le formateur. 3 mises en situation (saignement, inconscience, arrêt cardiaque) + alerte + grille de validation. Score /20. Durée 45 min.',
    'evaluation_formateur', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    -- ============================================================
    -- MISE EN SITUATION 1 — SAIGNEMENT ABONDANT (5 pts)
    -- Scénario : collègue coupé profondément à l'avant-bras
    -- ============================================================
    (v_test_id, 1,
     '[Saignement abondant] Protège la zone et sécurise l''environnement (0,5 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2,
     '[Saignement abondant] Se protège avec des gants ou un plastique (1 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3,
     '[Saignement abondant] Réalise une compression directe sur la plaie (1 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     '[Saignement abondant] Maintient la compression de manière efficace (≥ 10 min) (1 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5,
     '[Saignement abondant] Fait alerter ou alerte les secours (15, 18 ou 112) (1 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6,
     '[Saignement abondant] Surveille la victime jusqu''à la prise en charge (0,5 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7,
     '[Saignement abondant] Score (sur 5) et observations',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    -- ============================================================
    -- MISE EN SITUATION 2 — VICTIME INCONSCIENTE QUI RESPIRE (6 pts)
    -- Scénario : collègue allongé au sol, inconscient, respire normalement
    -- ============================================================
    (v_test_id, 8,
     '[Inconscient qui respire] Protège la zone et s''assure de la sécurité (0,5 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 9,
     '[Inconscient qui respire] Vérifie la conscience : interpelle et stimule doucement (VAS) (1 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 10,
     '[Inconscient qui respire] Appelle à l''aide immédiatement (0,5 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 11,
     '[Inconscient qui respire] Bascule la tête en arrière pour libérer les voies aériennes (1 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 12,
     '[Inconscient qui respire] Vérifie la respiration (regarder, écouter, sentir — 10 secondes) (1 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 13,
     '[Inconscient qui respire] Installe correctement la victime en PLS (1 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 14,
     '[Inconscient qui respire] Alerte ou fait alerter les secours avec message complet (0,5 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 15,
     '[Inconscient qui respire] Surveille la respiration jusqu''à l''arrivée des secours (0,5 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 16,
     '[Inconscient qui respire] Score (sur 6) et observations',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    -- ============================================================
    -- MISE EN SITUATION 3 — ARRÊT CARDIAQUE (9 pts)
    -- Scénario : personne effondrée, ne respire pas, DAE à 20m, collègue présent
    -- ============================================================
    (v_test_id, 17,
     '[Arrêt cardiaque] Protège la zone et sécurise l''environnement (0,5 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 18,
     '[Arrêt cardiaque] Vérifie la conscience (VAS : Vérifier, Appeler, Stimuler) (0,5 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 19,
     '[Arrêt cardiaque] Vérifie l''absence de respiration (10 secondes max) (1 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 20,
     '[Arrêt cardiaque] Fait alerter le 15 / 18 / 112 par le collègue (0,5 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 21,
     '[Arrêt cardiaque] Envoie le collègue chercher le DAE (0,5 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 22,
     '[Arrêt cardiaque] Positionne correctement les mains (centre du thorax) (0,5 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 23,
     '[Arrêt cardiaque] Compressions thoraciques efficaces (5-6 cm de profondeur) (1 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 24,
     '[Arrêt cardiaque] Rythme correct (100-120 compressions/min) (1 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 25,
     '[Arrêt cardiaque] Insufflations correctes — 2 insufflations (si formé) (0,5 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 26,
     '[Arrêt cardiaque] Ratio 30 compressions / 2 insufflations respecté (1 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 27,
     '[Arrêt cardiaque] Met en œuvre le DAE dès disponibilité (0,5 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 28,
     '[Arrêt cardiaque] Suit les consignes vocales du DAE (0,5 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 29,
     '[Arrêt cardiaque] Continue la RCP jusqu''à la relève par les secours (0,5 pt)',
     'qcm_unique', '["Réalisé","Non réalisé / Erreur"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 30,
     '[Arrêt cardiaque] Score (sur 9) et observations',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    -- ============================================================
    -- ÉVALUATION DE L'ALERTE (transversale, observée sur toutes les situations)
    -- ============================================================
    (v_test_id, 31,
     '[Alerte] Numéro de téléphone depuis lequel on appelle',
     'qcm_unique', '["Présent","Absent"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 32,
     '[Alerte] Localisation précise de l''accident',
     'qcm_unique', '["Présent","Absent"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 33,
     '[Alerte] Nature de l''accident ou du malaise',
     'qcm_unique', '["Présent","Absent"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 34,
     '[Alerte] Nombre de victimes',
     'qcm_unique', '["Présent","Absent"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 35,
     '[Alerte] État apparent de la/des victime(s)',
     'qcm_unique', '["Présent","Absent"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 36,
     '[Alerte] Gestes de secours déjà effectués',
     'qcm_unique', '["Présent","Absent"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 37,
     '[Alerte] Attend les consignes avant de raccrocher',
     'qcm_unique', '["Présent","Absent"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- GRILLE DE VALIDATION GLOBALE (compétences)
    -- ============================================================
    (v_test_id, 38,
     '[Grille] Protège, sécurise la zone (toutes situations)',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 39,
     '[Grille] Examine et évalue l''état de la victime',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 40,
     '[Grille] Alerte efficacement les secours',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 41,
     '[Grille] Réalise le geste adapté — Saignement abondant',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 42,
     '[Grille] Réalise le geste adapté — Victime inconsciente',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 43,
     '[Grille] Réalise le geste adapté — Arrêt cardiaque',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- RÉSULTAT FINAL
    -- ============================================================
    (v_test_id, 44,
     'Score total / 20 points',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 45,
     'Résultat global',
     'qcm_unique',
     '["APTE — Toutes les compétences acquises, gestes adaptés et efficaces","APTE AVEC RÉSERVE — Légères hésitations mais gestes globalement adaptés","NON APTE — Erreurs majeures ou gestes inadaptés → Rattrapage nécessaire"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 46,
     'Commentaires du formateur',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Évaluation formative SECOURIR créée (test_id=%) avec 46 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
