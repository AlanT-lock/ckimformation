-- =============================================================================
-- Évaluation Formative — Partie PRÉVENTION (SST)
-- =============================================================================
-- Source : PDF 2_Evaluation_Formative_Prevention.docx.pdf (V1CA-11/2025)
-- Type 'evaluation_formateur' — remplie par le formateur pour chaque stagiaire.
-- Score total /20 — Seuil de validation : 15/20.
-- 3 exercices + grille globale.
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
  where slug = 'sst'
     or slug = 'sauveteur-secouriste-travail'
     or slug ilike '%sauveteur%secouriste%'
     or slug ilike '%sst%'
     or titre ilike '%sauveteur%secouriste%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation SST introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation formative — Partie Prévention (formateur)',
    'Évaluation remplie par le formateur. 3 exercices (analyse situation, remontée info, QCM cadre juridique) + grille globale. Score /20. Seuil : 15/20. Durée 30 min.',
    'evaluation_formateur', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    -- ============================================================
    -- EXERCICE 1 — ANALYSE D'UNE SITUATION DE TRAVAIL (10 pts)
    -- Scénario : meuleuse sans EPI, câbles au sol humide, extincteur bloqué,
    -- armoire électrique ouverte, éclairage insuffisant
    -- ============================================================
    (v_test_id, 1,
     '[Ex1] Tableau d''analyse des risques rempli par le stagiaire (transcription / observations du formateur)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 2,
     '[Ex1] Identification d''au moins 3 dangers sur 5 (3 pts)',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3,
     '[Ex1] Pertinence de l''analyse (3 pts)',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     '[Ex1] Actions de prévention réalistes et hiérarchisées (4 pts)',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5,
     '[Ex1] Score Exercice 1 (sur 10) et observations',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    -- ============================================================
    -- EXERCICE 2 — MISE EN SITUATION : REMONTÉE D'INFORMATION (5 pts)
    -- Scénario : collègue utilise un escabeau endommagé, refuse de signaler
    -- ============================================================
    (v_test_id, 6,
     '[Ex2] Message rédigé par le stagiaire (transcription / observations du formateur)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 7,
     '[Ex2] Description claire et précise de la situation (2 pts)',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     '[Ex2] Identification correcte du risque (1 pt)',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 9,
     '[Ex2] Proposition de solution concrète (1 pt)',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 10,
     '[Ex2] Ton professionnel et bienveillant (1 pt)',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 11,
     '[Ex2] Score Exercice 2 (sur 5) et observations',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    -- ============================================================
    -- EXERCICE 3 — QCM : CADRE JURIDIQUE ET PRÉVENTION (5 pts)
    -- ============================================================
    (v_test_id, 12,
     '[Ex3 Q1] Dans la chaîne des secours, le SST intervient :',
     'qcm_unique',
     '["Avant l''arrivée des secours spécialisés","À la place des secours spécialisés","Uniquement si le médecin du travail est absent"]'::jsonb,
     null, true, '"Avant l''arrivée des secours spécialisés"'::jsonb, '[]'::jsonb),

    (v_test_id, 13,
     '[Ex3 Q2] Les 9 principes généraux de prévention sont définis par :',
     'qcm_unique',
     '["Le Code du travail","Le règlement intérieur de l''entreprise","L''INRS uniquement"]'::jsonb,
     null, true, '"Le Code du travail"'::jsonb, '[]'::jsonb),

    (v_test_id, 14,
     '[Ex3 Q3] Face à un danger grave et imminent, le salarié peut :',
     'qcm_unique',
     '["Exercer son droit de retrait","Attendre les consignes de son responsable","Continuer à travailler sous sa propre responsabilité"]'::jsonb,
     null, true, '"Exercer son droit de retrait"'::jsonb, '[]'::jsonb),

    (v_test_id, 15,
     '[Ex3 Q4] La démarche de prévention doit privilégier :',
     'qcm_unique',
     '["Les protections collectives avant les protections individuelles","Les protections individuelles en priorité","Les deux de manière strictement égale"]'::jsonb,
     null, true, '"Les protections collectives avant les protections individuelles"'::jsonb, '[]'::jsonb),

    (v_test_id, 16,
     '[Ex3 Q5] Un accident du travail doit être déclaré à l''employeur sous :',
     'qcm_unique',
     '["24 heures","48 heures","5 jours ouvrés","1 semaine"]'::jsonb,
     null, true, '"24 heures"'::jsonb, '[]'::jsonb),

    (v_test_id, 17,
     '[Ex3] Score Exercice 3 (sur 5)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    -- ============================================================
    -- GRILLE D'ÉVALUATION GLOBALE
    -- ============================================================
    (v_test_id, 18,
     '[Grille] Identifie les dangers et les risques dans une situation de travail',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 19,
     '[Grille] Propose des actions de prévention pertinentes et hiérarchisées',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 20,
     '[Grille] Connaît le cadre juridique de son rôle de SST',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 21,
     '[Grille] Communique efficacement sur les situations à risque',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 22,
     '[Grille] Applique les principes généraux de prévention',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- RÉSULTAT FINAL
    -- ============================================================
    (v_test_id, 23,
     'Score total / 20 points',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 24,
     'Résultat (seuil de validation : 15/20)',
     'qcm_unique', '["VALIDÉ (≥ 15/20)","NON VALIDÉ (< 15/20)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 25,
     'Commentaires du formateur',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Évaluation formative PRÉVENTION créée (test_id=%) avec 25 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
