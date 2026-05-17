-- =============================================================================
-- Évaluation Formateur — Formation Incendie, Extincteur et Évacuation (SECU-01)
-- =============================================================================
-- Source : PDF 02_Evaluation_des_Acquis.docx.pdf (V1VP-11/2025)
--   On n'extrait QUE la partie pratique (grille remplie par le formateur).
--   La partie théorique (QCM stagiaire) existe déjà en kind 'quiz'.
-- Type 'evaluation_formateur' — remplie par le formateur pour chaque stagiaire.
-- 9 compétences (Acquis / En cours / Non acquis) + notation générale + observations.
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
  where slug = 'incendie-extincteur-evacuation'
     or slug ilike '%incendie%extincteur%'
     or slug ilike '%incendie%evacuation%'
     or slug ilike '%secu-01%'
     or titre ilike '%incendie%extincteur%évacuation%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Incendie/Extincteur/Évacuation introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation pratique formateur — Incendie / Extincteur / Évacuation',
    'Grille d''observation pratique remplie par le formateur lors des exercices et mises en situation. 9 compétences + résultat global.',
    'evaluation_formateur', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    -- ============================================================
    -- PARTIE PRATIQUE — GRILLE D'ÉVALUATION EN SITUATION (9 compétences)
    -- ============================================================
    (v_test_id, 1,
     'Déclenche correctement l''alarme incendie',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2,
     'Utilise correctement un extincteur (RABC)',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3,
     'Dirige le jet vers la base du feu',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     'Adopte une posture sécurisée',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5,
     'Sait quand abandonner le sinistre',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6,
     'Participe à l''évacuation en ordre',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7,
     'Respecte le point de rassemblement',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     'Applique les consignes de sécurité',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 9,
     'Assure la sécurité d''autrui',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- RÉSULTAT GLOBAL
    -- ============================================================
    (v_test_id, 10,
     'Notation générale',
     'qcm_unique', '["Acquis","En cours d''acquisition","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 11,
     'Observations du formateur',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Évaluation pratique formateur Incendie créée (test_id=%) avec 11 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
