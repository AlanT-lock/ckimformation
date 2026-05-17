-- =============================================================================
-- Évaluation des acquis — Incendie, Extincteur et Évacuation (SECU-01)
-- =============================================================================
-- 8 questions QCM unique (partie théorique).
-- Partie pratique (grille d'observation) exclue — réservée au formateur en présentiel.
-- Type 'quiz' avec correction.
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : migration 20260524_question_followup.sql appliquée.
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  -- Trouve la formation SECU-01 (slug ou titre)
  select id into v_formation_id
  from public.formations
  where slug = 'incendie-extincteur-evacuation'
     or slug ilike '%secu-01%'
     or slug ilike '%incendie%extincteur%'
     or titre ilike '%incendie%extincteur%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation SECU-01 (Incendie, Extincteur, Évacuation) introuvable. Vérifiez le slug.';
  end if;

  -- Crée le test
  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation des acquis SECU-01',
    'Évaluation des acquis en fin de formation Incendie, Extincteur et Évacuation. 8 questions à choix unique sur les fondamentaux théoriques. La partie pratique (grille d''observation) est conduite en présentiel par le formateur.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- 8 questions QCM unique
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Quels sont les trois éléments nécessaires pour qu''un incendie se déclare ?', 'qcm_unique',
     '["L''oxygène, la chaleur et le combustible","L''eau, la lumière et le combustible","La chaleur, le gaz et l''électricité"]'::jsonb,
     null, true, '"L''oxygène, la chaleur et le combustible"'::jsonb, '[]'::jsonb),

    (v_test_id, 2, 'Quel est le premier réflexe en cas d''incendie ?', 'qcm_unique',
     '["Éteindre le feu immédiatement","Déclencher l''alarme incendie","Faire sortir les personnes"]'::jsonb,
     null, true, '"Déclencher l''alarme incendie"'::jsonb, '[]'::jsonb),

    (v_test_id, 3, 'Quel type d''extincteur utilise-t-on pour un feu de classe A (bois, papier) ?', 'qcm_unique',
     '["Extincteur CO2","Extincteur à eau pulvérisée","Extincteur poudre sèche"]'::jsonb,
     null, true, '"Extincteur à eau pulvérisée"'::jsonb, '[]'::jsonb),

    (v_test_id, 4, 'Qu''est-ce que la RABC pour utiliser un extincteur ?', 'qcm_unique',
     '["Retirer, Ajuster, Braquer, Comprimer","Retirer la goupille, Ajuster la pression, Braquer le tuyau, Comprimer la poignée","Remplir, Appuyer, Brûler, Contrôler"]'::jsonb,
     null, true, '"Retirer la goupille, Ajuster la pression, Braquer le tuyau, Comprimer la poignée"'::jsonb, '[]'::jsonb),

    (v_test_id, 5, 'À quelle distance minimale du feu doit-on se tenir en utilisant un extincteur ?', 'qcm_unique',
     '["0.5 m","1 à 1.5 m","3 m"]'::jsonb,
     null, true, '"1 à 1.5 m"'::jsonb, '[]'::jsonb),

    (v_test_id, 6, 'Que faire si vous ne pouvez pas maîtriser le feu ?', 'qcm_unique',
     '["Continuer à essayer","Évacuer immédiatement","Attendre les pompiers"]'::jsonb,
     null, true, '"Évacuer immédiatement"'::jsonb, '[]'::jsonb),

    (v_test_id, 7, 'Quel gaz produit par l''incendie est particulièrement dangereux ?', 'qcm_unique',
     '["L''oxyde de carbone","Le monoxyde de carbone","Le dioxyde de carbone"]'::jsonb,
     null, true, '"Le monoxyde de carbone"'::jsonb, '[]'::jsonb),

    (v_test_id, 8, 'En cas d''évacuation, où doit-on se rassembler ?', 'qcm_unique',
     '["À la sortie de l''établissement","Au point de rassemblement désigné","En dehors de la zone de danger"]'::jsonb,
     null, true, '"Au point de rassemblement désigné"'::jsonb, '[]'::jsonb);

  raise notice 'OK — Test "Évaluation des acquis SECU-01" créé (test_id=%) avec 8 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
