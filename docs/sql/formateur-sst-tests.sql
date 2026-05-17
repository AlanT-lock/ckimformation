-- =============================================================================
-- Tests Formateur SST Certification INRS — 56h (8 jours)
-- =============================================================================
-- 2 tests : positionnement (entrée formation) + évaluation des acquis (fin).
-- Certification INRS délivrée par organisme habilité.
-- Type 'quiz' pour les deux (positionnement non éliminatoire, acquis seuil 14/20).
-- Parties C et D de l'évaluation (épreuve pratique d'animation + grille globale
-- des compétences) exclues — formateur référent INRS en présentiel.
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : migration 20260524_question_followup.sql appliquée.
-- =============================================================================


-- =============================================================================
-- TEST 1 — TEST DE POSITIONNEMENT FORMATEUR SST (23 questions)
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  select id into v_formation_id
  from public.formations
  where slug = 'formateur-sst'
     or slug ilike '%formateur-sst%'
     or slug ilike '%formateur%sst%'
     or titre ilike '%formateur sst%'
     or titre ilike '%formateur%sst%inrs%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Formateur SST introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Test de positionnement Formateur SST',
    'Évaluation des connaissances initiales avant la formation de Formateur SST INRS (56h). Durée 20 min. Auto-évaluation + questions de positionnement + expérience pédagogique. Non éliminatoire.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ---- Partie A : Auto-évaluation (10 items, sans bonne réponse)
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Je suis capable de réaliser les gestes de premiers secours (PLS, RCP, DAE).', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2, 'Je suis capable d''expliquer la chaîne de survie et le rôle du SST.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3, 'Je suis capable d''animer une séquence de formation en face-à-face.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4, 'Je suis capable de concevoir un scénario pédagogique SST.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5, 'Je suis capable d''utiliser les outils INRS (PISST, PAP, Tuto''Prev).', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6, 'Je suis capable d''évaluer les acquis des stagiaires SST.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7, 'Je suis capable d''adapter ma posture de formateur selon le public.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8, 'Je maîtrise les aspects réglementaires du SST.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 9, 'Je suis capable de gérer un groupe en formation pratique.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 10, 'Je suis capable de rédiger un bilan de session de formation.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

  -- ---- Partie B : Questions de positionnement (4 QCM scorables + 3 texte libre)
    (v_test_id, 11, 'Que signifie SST ?', 'qcm_unique',
     '["Sécurité et Santé au Travail","Sauveteur Secouriste du Travail","Service de Soins au Travail","Système de Sécurité Totale"]'::jsonb,
     null, true, '"Sauveteur Secouriste du Travail"'::jsonb, '[]'::jsonb),

    (v_test_id, 12, 'Quelle est la durée minimale de la formation SST initiale ?', 'qcm_unique',
     '["7 heures","10 heures","14 heures","21 heures"]'::jsonb,
     null, true, '"14 heures"'::jsonb, '[]'::jsonb),

    (v_test_id, 13, 'La formation SST est obligatoire dans toutes les entreprises en France.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 14, 'Le formateur SST doit obligatoirement être certifié par l''INRS.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 15, 'Décrivez les étapes de la conduite à tenir face à une victime inconsciente qui respire.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 16, 'Qu''est-ce que la méthode PISST ? À quoi sert-elle dans la formation SST ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 17, 'Comment évaluez-vous les acquis de vos stagiaires en formation SST ? Citez vos méthodes.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ---- Partie C : Expérience pédagogique (5 contextuels + 1 attentes)
    (v_test_id, 18, 'Êtes-vous déjà certifié SST ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null,
     '["Oui"]'::jsonb),  -- follow-up : date de certification

    (v_test_id, 19, 'Avez-vous déjà animé des formations ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null,
     '["Oui"]'::jsonb),  -- follow-up : lesquelles

    (v_test_id, 20, 'Avez-vous déjà utilisé un DAE ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 21, 'Connaissez-vous les outils INRS (PISST, PAP) ?', 'qcm_unique',
     '["Oui","Partiellement","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 22, 'Avez-vous une expérience en gestion de groupe ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 23, 'Attentes particulières pour cette formation.', 'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Test de positionnement Formateur SST créé (test_id=%) avec 23 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;


-- =============================================================================
-- TEST 2 — ÉVALUATION DES ACQUIS FORMATEUR SST (15 questions)
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  select id into v_formation_id
  from public.formations
  where slug = 'formateur-sst'
     or slug ilike '%formateur-sst%'
     or slug ilike '%formateur%sst%'
     or titre ilike '%formateur sst%'
     or titre ilike '%formateur%sst%inrs%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Formateur SST introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation des acquis Formateur SST',
    'Évaluation certificative de fin de formation. Score minimum requis : 14/20 (70%). Durée 45 min. 10 QCM théoriques + 5 questions pédagogiques ouvertes. L''épreuve pratique d''animation (séquence 20 min) et la grille globale des compétences sont conduites par le formateur référent INRS en présentiel.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ---- Partie A : 10 QCM théoriques (toutes scorables)
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Quelle est la fréquence de recyclage du certificat SST ?', 'qcm_unique',
     '["Tous les ans","Tous les 2 ans","Tous les 3 ans","Il n''expire pas"]'::jsonb,
     null, true, '"Tous les 2 ans"'::jsonb, '[]'::jsonb),

    (v_test_id, 2, 'La méthode pédagogique INRS pour former les SST s''appelle :', 'qcm_unique',
     '["HACCP","PISST — Pédagogie Intégrée pour la formation SST","PAP — Plan d''Action Pédagogique","Aucune des réponses"]'::jsonb,
     null, true, '"PISST — Pédagogie Intégrée pour la formation SST"'::jsonb, '[]'::jsonb),

    (v_test_id, 3, 'Face à un arrêt cardio-respiratoire, quelle est la fréquence de compression thoracique ?', 'qcm_unique',
     '["60 à 80 compressions/min","80 à 100 compressions/min","100 à 120 compressions/min","120 à 140 compressions/min"]'::jsonb,
     null, true, '"100 à 120 compressions/min"'::jsonb, '[]'::jsonb),

    (v_test_id, 4, 'Le ratio compressions/insufflations en RCP adulte est de :', 'qcm_unique',
     '["15/2","30/2","30/1","15/1"]'::jsonb,
     null, true, '"30/2"'::jsonb, '[]'::jsonb),

    (v_test_id, 5, 'Quelle est la profondeur des compressions thoraciques chez l''adulte ?', 'qcm_unique',
     '["2 à 3 cm","3 à 4 cm","4 à 5 cm","5 à 6 cm"]'::jsonb,
     null, true, '"5 à 6 cm"'::jsonb, '[]'::jsonb),

    (v_test_id, 6, 'Le DAE (Défibrillateur Automatisé Externe) peut être utilisé par :', 'qcm_unique',
     '["Uniquement les médecins","Uniquement les secouristes certifiés","Toute personne, professionnel de santé ou non","Uniquement les pompiers"]'::jsonb,
     null, true, '"Toute personne, professionnel de santé ou non"'::jsonb, '[]'::jsonb),

    (v_test_id, 7, 'La PLS (Position Latérale de Sécurité) s''applique à une victime :', 'qcm_unique',
     '["En arrêt cardio-respiratoire","Inconsciente qui respire","Consciente qui se plaint","En état de choc hémorragique"]'::jsonb,
     null, true, '"Inconsciente qui respire"'::jsonb, '[]'::jsonb),

    (v_test_id, 8, 'Un formateur SST doit obligatoirement :', 'qcm_unique',
     '["Être médecin du travail","Être certifié par l''INRS et son organisme de formation habilité","Avoir 10 ans d''expérience en entreprise","Être titulaire du BAFA"]'::jsonb,
     null, true, '"Être certifié par l''INRS et son organisme de formation habilité"'::jsonb, '[]'::jsonb),

    (v_test_id, 9, 'La protection de la victime consiste à :', 'qcm_unique',
     '["La déplacer immédiatement","Baliser la zone et supprimer le danger sans se mettre en danger","Appeler les secours avant toute action","Lui donner de l''eau"]'::jsonb,
     null, true, '"Baliser la zone et supprimer le danger sans se mettre en danger"'::jsonb, '[]'::jsonb),

    (v_test_id, 10, 'La chaîne de survie comprend combien de maillons ?', 'qcm_unique',
     '["3 maillons","4 maillons","5 maillons","6 maillons"]'::jsonb,
     null, true, '"5 maillons"'::jsonb, '[]'::jsonb),

  -- ---- Partie B : 5 questions pédagogiques ouvertes
    (v_test_id, 11, 'Décrivez la conduite à tenir face à une victime qui saigne abondamment (CAT hémorragie).', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 12, 'Qu''est-ce que la méthode PISST ? Expliquez ses 4 phases et leurs objectifs.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 13, 'Comment préparez-vous une séquence de formation SST sur un cas concret d''entreprise ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 14, 'Quelle est la différence entre une évaluation formative et une évaluation sommative en formation SST ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 15, 'Comment gérez-vous un stagiaire en difficulté (panique, blocage, mauvaise technique) lors d''un exercice pratique ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb);

  raise notice 'OK — Évaluation des acquis Formateur SST créée (test_id=%) avec 15 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
