-- =============================================================================
-- Tests MAC Formateur SST — Maintien et Actualisation des Compétences 21h (3 jours)
-- =============================================================================
-- 2 tests : positionnement (entrée formation) + évaluation des acquis (fin).
-- Type 'quiz' pour les deux (positionnement non éliminatoire, acquis seuil 14/20).
-- Parties C et D de l'évaluation (épreuve pratique d'animation + grille globale
-- des compétences) exclues — formateur référent INRS en présentiel.
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : migration 20260524_question_followup.sql appliquée.
-- =============================================================================


-- =============================================================================
-- TEST 1 — TEST DE POSITIONNEMENT MAC FORMATEUR SST (22 questions)
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  select id into v_formation_id
  from public.formations
  where slug = 'mac-formateur-sst'
     or slug ilike '%mac-formateur-sst%'
     or slug ilike '%mac%formateur%sst%'
     or titre ilike '%mac formateur sst%'
     or titre ilike '%maintien%actualisation%formateur%sst%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation MAC Formateur SST introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Test de positionnement MAC Formateur SST',
    'Évaluation de l''état des compétences de Formateur SST avant le recyclage MAC. Durée 20 min. Bilan de pratique depuis la dernière certification + auto-évaluation des compétences actuelles + questions de positionnement. Non éliminatoire.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ---- Partie A : Bilan de pratique depuis la dernière certification (8 items, sans bonne réponse)
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Depuis ma dernière certification, j''ai animé des formations SST initiales.', 'qcm_unique',
     '["Jamais","1 à 2 fois","3 à 5 fois","Régulièrement"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2, 'Depuis ma dernière certification, j''ai réalisé des MAC SST (recyclages).', 'qcm_unique',
     '["Jamais","1 à 2 fois","3 à 5 fois","Régulièrement"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3, 'Depuis ma dernière certification, j''ai utilisé les outils INRS (PISST, PAP, Tuto''Prev).', 'qcm_unique',
     '["Jamais","1 à 2 fois","3 à 5 fois","Régulièrement"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4, 'Depuis ma dernière certification, j''ai pratiqué la RCP sur mannequin.', 'qcm_unique',
     '["Jamais","1 à 2 fois","3 à 5 fois","Régulièrement"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5, 'Depuis ma dernière certification, j''ai utilisé un DAE en formation.', 'qcm_unique',
     '["Jamais","1 à 2 fois","3 à 5 fois","Régulièrement"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6, 'Depuis ma dernière certification, j''ai mis à jour mes connaissances réglementaires SST.', 'qcm_unique',
     '["Jamais","1 à 2 fois","3 à 5 fois","Régulièrement"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7, 'Depuis ma dernière certification, j''ai évalué des stagiaires SST avec une grille.', 'qcm_unique',
     '["Jamais","1 à 2 fois","3 à 5 fois","Régulièrement"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8, 'Depuis ma dernière certification, j''ai rédigé un bilan de session de formation.', 'qcm_unique',
     '["Jamais","1 à 2 fois","3 à 5 fois","Régulièrement"]'::jsonb,
     null, true, null, '[]'::jsonb),

  -- ---- Partie B : Auto-évaluation des compétences actuelles (8 items, sans bonne réponse)
    (v_test_id, 9, 'Je suis capable de réaliser une RCP adulte conforme aux recommandations ERC 2021.', 'qcm_unique',
     '["Jamais fait","Incertain","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 10, 'Je suis capable d''utiliser un DAE en toute sécurité.', 'qcm_unique',
     '["Jamais fait","Incertain","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 11, 'Je suis capable d''appliquer la conduite à tenir face à une hémorragie.', 'qcm_unique',
     '["Jamais fait","Incertain","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 12, 'Je suis capable de mettre en PLS une victime inconsciente qui respire.', 'qcm_unique',
     '["Jamais fait","Incertain","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 13, 'Je suis capable d''animer une séquence SST avec la méthode PISST.', 'qcm_unique',
     '["Jamais fait","Incertain","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 14, 'Je suis capable d''utiliser les outils numériques INRS (Tuto''Prev, PISST en ligne).', 'qcm_unique',
     '["Jamais fait","Incertain","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 15, 'Je suis capable d''évaluer les gestes techniques des stagiaires SST.', 'qcm_unique',
     '["Jamais fait","Incertain","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 16, 'Je suis capable d''expliquer les évolutions réglementaires du SST.', 'qcm_unique',
     '["Jamais fait","Incertain","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

  -- ---- Partie C : Questions de positionnement (4 QCM scorables + 2 texte libre)
    (v_test_id, 17, 'Selon les recommandations ERC 2021, la fréquence des compressions thoraciques est de :', 'qcm_unique',
     '["60 à 80/min","80 à 100/min","100 à 120/min","120 à 140/min"]'::jsonb,
     null, true, '"100 à 120/min"'::jsonb, '[]'::jsonb),

    (v_test_id, 18, 'Le MAC SST doit être réalisé tous les :', 'qcm_unique',
     '["1 an","2 ans","3 ans","5 ans"]'::jsonb,
     null, true, '"2 ans"'::jsonb, '[]'::jsonb),

    (v_test_id, 19, 'Les recommandations de la RCP peuvent évoluer entre deux certifications du formateur SST.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 20, 'Un formateur SST peut animer des formations sans avoir réalisé son MAC dans les délais.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 21, 'Quelles évolutions avez-vous constatées dans vos pratiques de formateur SST depuis votre dernière certification ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 22, 'Quelles sont vos principales difficultés en tant que formateur SST ? Sur quels points souhaitez-vous vous améliorer ?', 'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Test de positionnement MAC Formateur SST créé (test_id=%) avec 22 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;


-- =============================================================================
-- TEST 2 — ÉVALUATION DES ACQUIS MAC FORMATEUR SST (15 questions)
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  select id into v_formation_id
  from public.formations
  where slug = 'mac-formateur-sst'
     or slug ilike '%mac-formateur-sst%'
     or slug ilike '%mac%formateur%sst%'
     or titre ilike '%mac formateur sst%'
     or titre ilike '%maintien%actualisation%formateur%sst%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation MAC Formateur SST introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation des acquis MAC Formateur SST',
    'Évaluation certificative de fin de MAC. Score minimum requis : 14/20 (70%). Durée 45 min. 10 QCM théoriques + 5 questions pédagogiques ouvertes. L''épreuve pratique d''animation (séquence 20 min) et la grille globale des compétences sont conduites par le formateur référent INRS en présentiel.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ---- Partie A : 10 QCM théoriques (toutes scorables)
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Selon les recommandations ERC 2021, le ratio compressions/insufflations en RCP adulte est :', 'qcm_unique',
     '["15/2","30/2","30/1","15/1"]'::jsonb,
     null, true, '"30/2"'::jsonb, '[]'::jsonb),

    (v_test_id, 2, 'La profondeur des compressions thoraciques chez l''adulte est de :', 'qcm_unique',
     '["2 à 3 cm","3 à 4 cm","4 à 5 cm","5 à 6 cm"]'::jsonb,
     null, true, '"5 à 6 cm"'::jsonb, '[]'::jsonb),

    (v_test_id, 3, 'Face à une hémorragie externe, la première action est :', 'qcm_unique',
     '["Appeler le 15","Comprimer directement et fortement la plaie","Allonger la victime","Mettre des gants avant toute action"]'::jsonb,
     null, true, '"Comprimer directement et fortement la plaie"'::jsonb, '[]'::jsonb),

    (v_test_id, 4, 'Le DAE peut être utilisé sur un enfant de moins de 8 ans :', 'qcm_unique',
     '["Non, jamais","Oui, avec des électrodes pédiatriques si disponibles","Uniquement par un médecin","Oui, sans adaptation nécessaire"]'::jsonb,
     null, true, '"Oui, avec des électrodes pédiatriques si disponibles"'::jsonb, '[]'::jsonb),

    (v_test_id, 5, 'La méthode PISST signifie :', 'qcm_unique',
     '["Programme Intégré de Soins et de Secours au Travail","Pédagogie Intégrée pour la formation SST","Plan Interne de Sécurité et Santé au Travail","Protocole INRS de Simulation et de Secours au Travail"]'::jsonb,
     null, true, '"Pédagogie Intégrée pour la formation SST"'::jsonb, '[]'::jsonb),

    (v_test_id, 6, 'Le recyclage MAC SST est valable :', 'qcm_unique',
     '["1 an","2 ans","3 ans","5 ans"]'::jsonb,
     null, true, '"2 ans"'::jsonb, '[]'::jsonb),

    (v_test_id, 7, 'Un formateur SST dont le MAC est périmé peut :', 'qcm_unique',
     '["Continuer à former pendant 6 mois","Former uniquement en présence d''un formateur certifié","Ne plus animer de formations SST — il doit revalider","Former uniquement des groupes de moins de 5 personnes"]'::jsonb,
     null, true, '"Ne plus animer de formations SST — il doit revalider"'::jsonb, '[]'::jsonb),

    (v_test_id, 8, 'L''outil Tuto''Prev de l''INRS permet de :', 'qcm_unique',
     '["Générer des attestations SST automatiquement","Créer des situations de travail simulées pour la formation SST","Évaluer le niveau des formateurs SST","Déclarer les accidents du travail en ligne"]'::jsonb,
     null, true, '"Créer des situations de travail simulées pour la formation SST"'::jsonb, '[]'::jsonb),

    (v_test_id, 9, 'En cas de victime inconsciente qui ne respire pas, on doit :', 'qcm_unique',
     '["La mettre en PLS et appeler le 15","Débuter immédiatement la RCP et demander un DAE","Attendre l''arrivée des secours","Lui donner de l''eau et surveiller"]'::jsonb,
     null, true, '"Débuter immédiatement la RCP et demander un DAE"'::jsonb, '[]'::jsonb),

    (v_test_id, 10, 'L''obligation légale de former des SST en entreprise est :', 'qcm_unique',
     '["1 SST pour 50 salariés","1 SST pour 20 salariés","1 SST pour 10 salariés (recommandation INRS)","Aucune obligation légale"]'::jsonb,
     null, true, '"1 SST pour 10 salariés (recommandation INRS)"'::jsonb, '[]'::jsonb),

  -- ---- Partie B : 5 questions pédagogiques ouvertes
    (v_test_id, 11, 'Quelles sont les principales évolutions des recommandations ERC 2021 par rapport aux versions précédentes ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 12, 'Décrivez la conduite à tenir face à une victime en arrêt cardio-respiratoire (ACR) étape par étape.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 13, 'Comment utilisez-vous l''outil PISST pour concevoir une séquence de formation SST sur un cas concret ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 14, 'Comment évaluez-vous l''efficacité de vos formations SST ? Quels indicateurs utilisez-vous ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 15, 'Qu''est-ce que le PAP (Plan d''Action Pédagogique) INRS ? Comment le construisez-vous pour votre entreprise ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb);

  raise notice 'OK — Évaluation des acquis MAC Formateur SST créée (test_id=%) avec 15 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
