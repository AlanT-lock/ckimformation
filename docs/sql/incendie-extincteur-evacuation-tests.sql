-- =============================================================================
-- Test de Positionnement — Incendie Extincteur & Évacuation (SECU-01)
-- =============================================================================
-- 1 seul test : positionnement (entrée formation) — non éliminatoire.
-- L'évaluation des acquis est dans secu01-evaluation-acquis.sql.
-- 15 questions : auto-évaluation + positionnement technique + contexte.
-- Type 'quiz'.
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : migration 20260524_question_followup.sql appliquée.
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  select id into v_formation_id
  from public.formations
  where slug = 'incendie-extincteur-evacuation'
     or slug ilike '%secu-01%'
     or slug ilike '%incendie%extincteur%'
     or titre ilike '%incendie%extincteur%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Incendie Extincteur & Évacuation introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Test de positionnement Incendie Extincteur & Évacuation',
    'Évaluation des connaissances initiales sur la prévention incendie avant la formation. Durée 10 min. Auto-évaluation + questions de positionnement. Non éliminatoire.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ---- Partie A : Auto-évaluation (5 items, sans bonne réponse)
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Je suis capable d''expliquer le principe du triangle du feu.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2, 'Je suis capable d''identifier les différentes classes de feux.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3, 'Je suis capable de choisir le bon extincteur selon le type de feu.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4, 'Je suis capable de mettre en œuvre un extincteur portable.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5, 'Je connais les procédures d''évacuation de mon établissement.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

  -- ---- Partie B : Questions de positionnement (8 QCM scorables + 2 texte libre)
    (v_test_id, 6, 'Quels sont les trois éléments constitutifs du triangle du feu ?', 'qcm_unique',
     '["Eau, air, chaleur","Combustible, comburant, source d''inflammation","Flamme, fumée, chaleur","Gaz, liquide, solide"]'::jsonb,
     null, true, '"Combustible, comburant, source d''inflammation"'::jsonb, '[]'::jsonb),

    (v_test_id, 7, 'Pour éteindre un feu de classe B (liquide inflammable), quel extincteur utilise-t-on ?', 'qcm_unique',
     '["Extincteur à eau pure","Extincteur à eau pulvérisée","Extincteur CO2 ou poudre BC","N''importe quel extincteur"]'::jsonb,
     null, true, '"Extincteur CO2 ou poudre BC"'::jsonb, '[]'::jsonb),

    (v_test_id, 8, 'Un extincteur à eau peut être utilisé sur un feu d''origine électrique.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 9, 'Quelle est la première action à effectuer en cas de découverte d''un début d''incendie ?', 'qcm_unique',
     '["Tenter d''éteindre immédiatement sans prévenir personne","Déclencher l''alarme incendie et alerter les secours","Évacuer sans prévenir les collègues","Ouvrir les fenêtres pour faire sortir la fumée"]'::jsonb,
     null, true, '"Déclencher l''alarme incendie et alerter les secours"'::jsonb, '[]'::jsonb),

    (v_test_id, 10, 'En cas d''évacuation, il faut utiliser les ascenseurs pour évacuer plus rapidement.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 11, 'Un extincteur à poudre ABC peut être utilisé sur des feux de type A (solides).', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 12, 'Le rôle du serre-file lors d''une évacuation est de :', 'qcm_unique',
     '["Guider les personnes vers la sortie de secours","Fermer les portes et s''assurer que personne ne reste dans la zone","Appeler les pompiers","Gérer le point de rassemblement"]'::jsonb,
     null, true, '"Fermer les portes et s''assurer que personne ne reste dans la zone"'::jsonb, '[]'::jsonb),

    (v_test_id, 13, 'Quel est le numéro d''urgence pour appeler les sapeurs-pompiers ?', 'qcm_unique',
     '["15","17","18","112 ou 18"]'::jsonb,
     null, true, '"112 ou 18"'::jsonb, '[]'::jsonb),

    (v_test_id, 14, 'Décrivez en quelques mots comment mettre en œuvre un extincteur portable.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 15, 'Avez-vous déjà participé à un exercice d''évacuation ou manipulé un extincteur ? Si oui, dans quel contexte ?', 'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Test de positionnement Incendie Extincteur & Évacuation créé (test_id=%) avec 15 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
