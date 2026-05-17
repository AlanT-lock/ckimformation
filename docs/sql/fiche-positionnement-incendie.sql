-- =============================================================================
-- Fiche de Positionnement — Formation Incendie, Extincteur et Évacuation (SECU-01)
-- =============================================================================
-- Source : PDF 01_Fiche_Positionnement_Formation_Incendie.docx.pdf (V1VP-11/2025)
-- 8 questions — 2 sections (situation de départ + attentes).
-- Identification du stagiaire : gérée par le profil utilisateur, non incluse ici.
-- Non noté — non éliminatoire.
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
    'Fiche de positionnement Formation Incendie, Extincteur et Évacuation',
    'Permet d''évaluer la situation de départ du stagiaire et de recueillir ses attentes avant la formation incendie. Non noté.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ============================================================
  -- SECTION A — ÉVALUATION DE LA SITUATION DE DÉPART (Q1-Q6)
  -- ============================================================
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1,
     'Avez-vous suivi une formation incendie auparavant ?',
     'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null, '["Oui"]'::jsonb),

    (v_test_id, 2,
     'Avez-vous une expérience dans la manipulation d''extincteurs ?',
     'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null, '["Oui"]'::jsonb),

    (v_test_id, 3,
     'Connaissez-vous les consignes d''évacuation de votre établissement ?',
     'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     'Avez-vous des difficultés de compréhension du français écrit ou parlé ?',
     'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null, '["Oui"]'::jsonb),

    (v_test_id, 5,
     'Avez-vous des difficultés motrices ou sensorielles ?',
     'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null, '["Oui"]'::jsonb),

    (v_test_id, 6,
     'Avez-vous besoin d''un aménagement particulier pour cette formation ?',
     'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null, '["Oui"]'::jsonb),

  -- ============================================================
  -- SECTION B — ATTENTES ET OBJECTIFS (Q7-Q8)
  -- ============================================================
    (v_test_id, 7,
     'Qu''attendez-vous de cette formation ?',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     'Avez-vous des objectifs professionnels particuliers ?',
     'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Fiche de positionnement Incendie créée (test_id=%) avec 8 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
