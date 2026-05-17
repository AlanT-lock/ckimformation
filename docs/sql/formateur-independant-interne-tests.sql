-- =============================================================================
-- Tests Formateur Indépendant et/ou Interne — Ingénierie de Formation (FOIND)
-- =============================================================================
-- 2 tests : positionnement (entrée formation) + évaluation des acquis (fin).
-- Type 'quiz' pour les deux (positionnement non éliminatoire, acquis seuil 14/20).
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : migration 20260524_question_followup.sql appliquée.
-- =============================================================================


-- =============================================================================
-- TEST 1 — TEST DE POSITIONNEMENT FORMATEUR INDÉPENDANT / INTERNE (18 questions)
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  select id into v_formation_id
  from public.formations
  where slug = 'formateur-independant-interne'
     or slug ilike '%formateur%independant%'
     or slug ilike '%formateur%interne%'
     or titre ilike '%formateur%indépendant%'
     or titre ilike '%formateur%interne%ingénierie%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Formateur Indépendant/Interne introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Test de positionnement Formateur Indépendant et/ou Interne',
    'Évaluation des compétences initiales en ingénierie de formation avant le parcours. Durée 20 min. Auto-évaluation + questions de positionnement + expérience. Non éliminatoire.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ---- Partie A : Auto-évaluation (8 items, sans bonne réponse)
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Je suis capable d''analyser les besoins en formation d''un commanditaire.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2, 'Je suis capable de définir des objectifs pédagogiques opérationnels.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3, 'Je suis capable de concevoir un programme de formation structuré.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4, 'Je suis capable d''animer une séquence pédagogique en présentiel.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5, 'Je suis capable de créer des supports pédagogiques adaptés au public adulte.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6, 'Je suis capable d''évaluer les acquis des apprenants.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7, 'Je suis capable de gérer la dynamique de groupe lors d''une formation.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8, 'Je connais les obligations réglementaires liées à la formation professionnelle (Qualiopi, CPF, OPCO).', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

  -- ---- Partie B : Questions de positionnement (6 QCM scorables + 2 texte libre)
    (v_test_id, 9, 'Qu''est-ce que l''andragogie ?', 'qcm_unique',
     '["La pédagogie appliquée aux enfants","La science de l''apprentissage des adultes","Une méthode d''évaluation des formations","Un label de qualité pour les formateurs"]'::jsonb,
     null, true, '"La science de l''apprentissage des adultes"'::jsonb, '[]'::jsonb),

    (v_test_id, 10, 'Un objectif pédagogique doit être SMART. Que signifie ce sigle ?', 'qcm_unique',
     '["Simple, Mesurable, Applicable, Réaliste, Temporel","Spécifique, Mesurable, Atteignable, Réaliste, Temporellement défini","Structuré, Méthodique, Adapté, Rigoureux, Transférable","Simple, Modulaire, Adapté, Réalisable, Traçable"]'::jsonb,
     null, true, '"Spécifique, Mesurable, Atteignable, Réaliste, Temporellement défini"'::jsonb, '[]'::jsonb),

    (v_test_id, 11, 'La méthode démonstrative consiste à :', 'qcm_unique',
     '["Faire faire à l''apprenant sous guidage","Montrer et expliquer devant les apprenants","Faire découvrir par l''apprenant lui-même","Exposer le contenu de façon magistrale"]'::jsonb,
     null, true, '"Montrer et expliquer devant les apprenants"'::jsonb, '[]'::jsonb),

    (v_test_id, 12, 'Qualiopi est obligatoire pour :', 'qcm_unique',
     '["Tous les formateurs indépendants","Les organismes de formation souhaitant percevoir des fonds publics ou mutualisés","Uniquement les organismes de plus de 10 salariés","Les centres de formation en alternance uniquement"]'::jsonb,
     null, true, '"Les organismes de formation souhaitant percevoir des fonds publics ou mutualisés"'::jsonb, '[]'::jsonb),

    (v_test_id, 13, 'L''évaluation formative sert à mesurer les acquis en fin de formation pour valider la certification.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 14, 'Un formateur interne est un salarié de l''entreprise qui assure des actions de formation pour ses collègues.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 15, 'Décrivez en quelques mots votre expérience actuelle en animation ou en transmission de savoirs.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 16, 'Quelles sont vos motivations pour devenir formateur et quelles thématiques souhaitez-vous enseigner ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ---- Partie C : Contexte professionnel (2 items)
    (v_test_id, 17, 'Quel statut visez-vous à l''issue de cette formation ?', 'qcm_unique',
     '["Formateur indépendant (auto-entrepreneur / société)","Formateur interne à mon entreprise","Les deux","Je ne sais pas encore"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 18, 'Commentaires / Attentes particulières pour ce parcours.', 'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Test de positionnement Formateur Indépendant/Interne créé (test_id=%) avec 18 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;


-- =============================================================================
-- TEST 2 — ÉVALUATION DES ACQUIS FORMATEUR INDÉPENDANT / INTERNE (15 questions)
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  select id into v_formation_id
  from public.formations
  where slug = 'formateur-independant-interne'
     or slug ilike '%formateur%independant%'
     or slug ilike '%formateur%interne%'
     or titre ilike '%formateur%indépendant%'
     or titre ilike '%formateur%interne%ingénierie%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Formateur Indépendant/Interne introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation des acquis Formateur Indépendant et/ou Interne',
    'Évaluation certificative de fin de formation. Score minimum requis : 14/20 (70%). Durée 40 min. 10 QCM théoriques + 5 questions pédagogiques ouvertes. La mise en situation d''animation (séquence 20 min) est évaluée par le formateur en présentiel.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ---- Partie A : 10 QCM théoriques (toutes scorables)
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Quelle est la différence entre un objectif pédagogique et un objectif opérationnel ?', 'qcm_unique',
     '["Il n''y a aucune différence","L''objectif pédagogique définit ce que le formateur va enseigner ; l''objectif opérationnel définit ce que l''apprenant sera capable de faire à l''issue de la formation","L''objectif opérationnel s''applique uniquement en formation distancielle","L''objectif pédagogique est établi par le commanditaire, l''opérationnel par le formateur"]'::jsonb,
     null, true,
     '"L''objectif pédagogique définit ce que le formateur va enseigner ; l''objectif opérationnel définit ce que l''apprenant sera capable de faire à l''issue de la formation"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 2, 'La loi impose aux organismes de formation bénéficiant de fonds publics d''être certifiés :', 'qcm_unique',
     '["ISO 9001","Qualiopi","NF Formation","AFNOR Service"]'::jsonb,
     null, true, '"Qualiopi"'::jsonb, '[]'::jsonb),

    (v_test_id, 3, 'Quelle méthode pédagogique favorise le plus l''autonomie et la découverte chez l''apprenant adulte ?', 'qcm_unique',
     '["La méthode magistrale (exposé)","La méthode affirmative (démonstration)","La méthode interrogative (questionnement)","La méthode active (résolution de problème, jeux de rôle)"]'::jsonb,
     null, true, '"La méthode active (résolution de problème, jeux de rôle)"'::jsonb, '[]'::jsonb),

    (v_test_id, 4, 'L''évaluation à chaud mesure :', 'qcm_unique',
     '["Les acquis des stagiaires 3 mois après la formation","La satisfaction des stagiaires immédiatement après la formation","Les résultats de la formation sur le terrain","La progression des stagiaires en cours de formation"]'::jsonb,
     null, true, '"La satisfaction des stagiaires immédiatement après la formation"'::jsonb, '[]'::jsonb),

    (v_test_id, 5, 'Le CPF (Compte Personnel de Formation) est financé par :', 'qcm_unique',
     '["L''employeur uniquement","L''État via les impôts","Les contributions des employeurs collectées par France Compétences","Le salarié lui-même uniquement"]'::jsonb,
     null, true, '"Les contributions des employeurs collectées par France Compétences"'::jsonb, '[]'::jsonb),

    (v_test_id, 6, 'Un déroulé pédagogique doit inclure : (plusieurs réponses)', 'qcm_multiple',
     '["Les séquences et leur durée","Les méthodes pédagogiques utilisées","Les modalités d''évaluation","Le salaire du formateur"]'::jsonb,
     null, true,
     '["Les séquences et leur durée","Les méthodes pédagogiques utilisées","Les modalités d''évaluation"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 7, 'Qu''est-ce que la pyramide de Miller appliquée à l''évaluation en formation ?', 'qcm_unique',
     '["Un modèle hiérarchique d''évaluation des compétences (savoir, comprendre, montrer, faire)","Un cadre réglementaire pour les formateurs certifiés","Une méthode d''animation par niveaux","Un outil de diagnostic des besoins"]'::jsonb,
     null, true,
     '"Un modèle hiérarchique d''évaluation des compétences (savoir, comprendre, montrer, faire)"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 8, 'Quelle est la durée légale minimale de conservation des documents liés à une action de formation (convocations, émargements, attestations) ?', 'qcm_unique',
     '["1 an","3 ans","5 ans","10 ans"]'::jsonb,
     null, true, '"3 ans"'::jsonb, '[]'::jsonb),

    (v_test_id, 9, 'En formation d''adultes, le formateur doit adapter son animation au profil des apprenants. Parmi les freins à l''apprentissage de l''adulte, lesquels sont les plus courants ? (plusieurs réponses)', 'qcm_multiple',
     '["Peur de l''échec ou d''être jugé","Manque de temps disponible","Résistance au changement","Envie d''apprendre trop élevée"]'::jsonb,
     null, true,
     '["Peur de l''échec ou d''être jugé","Manque de temps disponible","Résistance au changement"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 10, 'Un formateur indépendant peut facturer des prestations de formation sans être référencé sur DataDock ou certifié Qualiopi.', 'qcm_unique',
     '["VRAI, sans restriction","VRAI, mais uniquement à des clients privés qui ne mobilisent pas de fonds mutualisés","FAUX, c''est systématiquement interdit","VRAI, si la formation dure moins de 7 heures"]'::jsonb,
     null, true,
     '"VRAI, mais uniquement à des clients privés qui ne mobilisent pas de fonds mutualisés"'::jsonb,
     '[]'::jsonb),

  -- ---- Partie B : 5 questions pédagogiques ouvertes
    (v_test_id, 11, 'Décrivez les 4 étapes de la démarche d''ingénierie de formation (ADDIE ou équivalent).', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 12, 'Comment construisez-vous un questionnaire d''analyse des besoins avant une formation ? Quelles informations cherchez-vous à recueillir ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 13, 'Décrivez comment vous gérez un conflit ou une résistance d''un apprenant durant une séquence de formation.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 14, 'Quels indicateurs utilisez-vous pour mesurer l''efficacité d''une action de formation ? Citez les 4 niveaux du modèle de Kirkpatrick.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 15, 'Présentez un programme de formation de votre choix (thème libre) : titre, objectifs opérationnels (3 minimum), structure en modules, modalités d''évaluation.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb);

  raise notice 'OK — Évaluation des acquis Formateur Indépendant/Interne créée (test_id=%) avec 15 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
