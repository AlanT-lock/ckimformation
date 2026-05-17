-- =============================================================================
-- Tests Formateur Sécurité Incendie 28h (4 jours)
-- =============================================================================
-- 2 tests : positionnement (entrée formation) + évaluation des acquis (fin).
-- Réf. Art. R.4227-28 Code du travail.
-- Type 'quiz' pour les deux (positionnement non éliminatoire, acquis seuil 14/20).
-- Grilles d'observation pratique (Parties C et D du test 2) exclues — formateur
-- en présentiel.
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : migration 20260524_question_followup.sql appliquée.
-- =============================================================================


-- =============================================================================
-- TEST 1 — TEST DE POSITIONNEMENT FORMATEUR SÉCURITÉ INCENDIE (23 questions)
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  select id into v_formation_id
  from public.formations
  where slug = 'formateur-securite-incendie'
     or slug ilike '%formateur%securite%incendie%'
     or slug ilike '%formateur%incendie%'
     or titre ilike '%formateur%sécurité%incendie%'
     or titre ilike '%formateur%incendie%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Formateur Sécurité Incendie introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Test de positionnement Formateur Sécurité Incendie',
    'Évaluation des connaissances initiales en sécurité incendie avant la formation de formateur (28h). Durée 20 min. Auto-évaluation + questions de positionnement + contexte professionnel. Non éliminatoire.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ---- Partie A : Auto-évaluation (10 items, sans bonne réponse)
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Je suis capable d''expliquer le triangle du feu et les classes de feux.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2, 'Je suis capable d''utiliser un extincteur adapté au type de feu.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3, 'Je suis capable de diriger une évacuation d''urgence (guide-file / serre-file).', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4, 'Je suis capable de lire et expliquer un plan d''évacuation.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5, 'Je suis capable d''identifier les équipements de lutte contre l''incendie.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6, 'Je suis capable de manier un RIA (Robinet d''Incendie Armé).', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7, 'Je suis capable d''animer une formation incendie en face-à-face.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8, 'Je suis capable de concevoir un exercice d''évacuation réaliste.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 9, 'Je connais les obligations réglementaires incendie (ERP / IGH).', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 10, 'Je suis capable de rédiger un rapport d''exercice d''évacuation.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

  -- ---- Partie B : Questions de positionnement (4 QCM scorables + 3 texte libre)
    (v_test_id, 11, 'Quels sont les 3 éléments du triangle du feu ?', 'qcm_unique',
     '["Chaleur, combustible, fumée","Comburant, combustible, énergie d''activation","Oxygène, chaleur, fumée","Combustion, chaleur, énergie"]'::jsonb,
     null, true,
     '"Comburant, combustible, énergie d''activation"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 12, 'Quelle classe de feu correspond aux feux de métaux ?', 'qcm_unique',
     '["Classe A","Classe B","Classe D","Classe F"]'::jsonb,
     null, true, '"Classe D"'::jsonb, '[]'::jsonb),

    (v_test_id, 13, 'Un extincteur CO2 est adapté pour éteindre un feu de classe A (bois, papier).', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 14, 'Le guide-file est la dernière personne à quitter une zone lors d''une évacuation.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 15, 'Quels sont les rôles du guide-file et du serre-file lors d''une évacuation ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 16, 'Citez les obligations réglementaires de l''employeur en matière de sécurité incendie.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 17, 'Comment préparez-vous et animez-vous un exercice d''évacuation ? Décrivez les étapes.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ---- Partie C : Contexte professionnel (5 contextuels + 1 texte libre, sans bonne réponse)
    (v_test_id, 18, 'Avez-vous déjà animé une formation incendie ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null,
     '["Oui"]'::jsonb),  -- follow-up : combien de fois

    (v_test_id, 19, 'Votre établissement est-il classé ERP ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null,
     '["Oui"]'::jsonb),  -- follow-up : catégorie

    (v_test_id, 20, 'Avez-vous déjà utilisé un extincteur en situation réelle ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 21, 'Connaissez-vous les classes de feux ?', 'qcm_unique',
     '["Oui","Partiellement","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 22, 'Un exercice d''évacuation est-il réalisé dans votre entreprise ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null,
     '["Oui"]'::jsonb),  -- follow-up : fréquence

    (v_test_id, 23, 'Attentes particulières pour cette formation.', 'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Test de positionnement Formateur Sécurité Incendie créé (test_id=%) avec 23 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;


-- =============================================================================
-- TEST 2 — ÉVALUATION DES ACQUIS FORMATEUR SÉCURITÉ INCENDIE (15 questions)
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  select id into v_formation_id
  from public.formations
  where slug = 'formateur-securite-incendie'
     or slug ilike '%formateur%securite%incendie%'
     or slug ilike '%formateur%incendie%'
     or titre ilike '%formateur%sécurité%incendie%'
     or titre ilike '%formateur%incendie%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Formateur Sécurité Incendie introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation des acquis Formateur Sécurité Incendie',
    'Évaluation de fin de formation. Score minimum requis : 14/20 (70%). 10 QCM scorables + 5 questions pédagogiques ouvertes. La partie pratique (animation d''une séquence + exercice extincteur) et la grille globale des compétences sont conduites par le formateur en présentiel.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ---- Partie A : 10 QCM (toutes scorables)
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Le triangle du feu nécessite la réunion de :', 'qcm_unique',
     '["2 éléments","3 éléments","4 éléments","5 éléments"]'::jsonb,
     null, true, '"3 éléments"'::jsonb, '[]'::jsonb),

    (v_test_id, 2, 'Les feux de classe B sont des feux de :', 'qcm_unique',
     '["Bois, papier, carton","Liquides et solides liquéfiables inflammables","Gaz inflammables","Métaux"]'::jsonb,
     null, true, '"Liquides et solides liquéfiables inflammables"'::jsonb, '[]'::jsonb),

    (v_test_id, 3, 'Quel extincteur est adapté aux feux électriques ?', 'qcm_unique',
     '["Eau pulvérisée","Poudre ABC","CO2 (dioxyde de carbone)","Mousse"]'::jsonb,
     null, true, '"CO2 (dioxyde de carbone)"'::jsonb, '[]'::jsonb),

    (v_test_id, 4, 'La règle des "3 extinctions" pour utiliser un extincteur est :', 'qcm_unique',
     '["Dégoupiller, viser la flamme, presser","Dégoupiller, viser la base du feu, presser en balayant","Ouvrir, viser, appuyer","Retirer la goupille, appuyer, recharger"]'::jsonb,
     null, true,
     '"Dégoupiller, viser la base du feu, presser en balayant"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 5, 'L''obligation de former le personnel à la sécurité incendie est définie par :', 'qcm_unique',
     '["L''article L.4121-1 du Code du travail","L''article R.4227-28 du Code du travail","La norme EN 3","Le règlement CE 1272/2008"]'::jsonb,
     null, true,
     '"L''article R.4227-28 du Code du travail"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 6, 'Un ERP de 1ère catégorie accueille :', 'qcm_unique',
     '["Moins de 200 personnes","200 à 500 personnes","Plus de 1500 personnes","50 à 200 personnes"]'::jsonb,
     null, true, '"Plus de 1500 personnes"'::jsonb, '[]'::jsonb),

    (v_test_id, 7, 'Le serre-file est chargé de :', 'qcm_unique',
     '["Ouvrir la marche de l''évacuation","Fermer la marche et s''assurer que personne ne reste en arrière","Alerter les secours","Utiliser les extincteurs"]'::jsonb,
     null, true,
     '"Fermer la marche et s''assurer que personne ne reste en arrière"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 8, 'Un exercice d''évacuation doit être réalisé :', 'qcm_unique',
     '["Tous les 5 ans","Tous les 3 ans","Au moins une fois par an","Uniquement à la demande du SDIS"]'::jsonb,
     null, true, '"Au moins une fois par an"'::jsonb, '[]'::jsonb),

    (v_test_id, 9, 'Le RIA (Robinet d''Incendie Armé) est :', 'qcm_unique',
     '["Un extincteur mobile à eau","Un dispositif fixe d''extinction à eau relié au réseau","Un système de détection incendie","Un équipement de protection individuelle"]'::jsonb,
     null, true,
     '"Un dispositif fixe d''extinction à eau relié au réseau"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 10, 'La distance d''attaque avec un extincteur doit être :', 'qcm_unique',
     '["La plus grande possible pour sa sécurité","Adaptée au type d''extincteur — généralement 1 à 3 mètres","Toujours inférieure à 50 cm","La même quelle que soit la situation"]'::jsonb,
     null, true,
     '"Adaptée au type d''extincteur — généralement 1 à 3 mètres"'::jsonb,
     '[]'::jsonb),

  -- ---- Partie B : 5 questions pédagogiques ouvertes
    (v_test_id, 11, 'Décrivez les 5 classes de feux (A, B, C, D, F) et donnez un exemple pour chacune.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 12, 'Comment organisez-vous un exercice d''évacuation dans une entreprise ? Décrivez toutes les étapes (avant, pendant, après).', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 13, 'Quelles sont les règles de sécurité à respecter lors d''une intervention avec un extincteur ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 14, 'Quels sont les équipements de lutte contre l''incendie obligatoires dans les ERP ? Expliquez leur rôle.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 15, 'Comment adaptez-vous votre formation incendie aux risques spécifiques d''un établissement (restaurant, EHPAD, entrepôt) ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb);

  raise notice 'OK — Évaluation des acquis Formateur Sécurité Incendie créée (test_id=%) avec 15 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
