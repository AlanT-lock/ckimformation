-- =============================================================================
-- Évaluation Formative N°2 — MAC SST (Actualisation des gestes de secours)
-- =============================================================================
-- Formation : Maintien et Actualisation des Compétences Sauveteur Secouriste du Travail.
-- Section A du PDF uniquement : 5 questions QCM théoriques (4 qcm_unique + 1 qcm_multiple).
-- Section B (grilles d'observation pratique sur 4 ateliers) et Bilan global :
-- réservés au formateur en présentiel → exclus de la plateforme.
-- Type 'quiz' (correction).
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
  where slug = 'mac-sst'
     or slug ilike '%mac-sst%'
     or slug ilike '%mac%sst%'
     or titre ilike '%maintien%actualisation%sst%'
     or titre ilike '%mac sst%'
     or titre ilike '%mac-sst%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation MAC SST introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'EF2 — Actualisation des gestes de secours',
    'Évaluation formative n°2 du MAC SST — Section A théorique (QCM). 5 questions sur les gestes de secours actualisés : compression directe, PLS, RCP, obstruction, DAE. Les 4 ateliers pratiques (Section B) et le bilan global sont conduits par le formateur en présentiel.',
    'quiz', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1,
     'Lors d''une compression directe sur une plaie qui saigne abondamment, vous devez :',
     'qcm_unique',
     '["Comprimer jusqu''à l''arrêt du saignement puis relâcher","Maintenir la compression sans relâcher jusqu''à la prise en charge par les secours","Poser un garrot en premier lieu","Nettoyer la plaie avant de comprimer"]'::jsonb,
     null, true,
     '"Maintenir la compression sans relâcher jusqu''à la prise en charge par les secours"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 2,
     'Pour une victime inconsciente qui respire, la PLS doit être réalisée :',
     'qcm_unique',
     '["Uniquement si la victime vomit","Systématiquement, pour maintenir les voies aériennes libres","Seulement sur ordre des secours","Après avoir pratiqué le bouche-à-bouche"]'::jsonb,
     null, true,
     '"Systématiquement, pour maintenir les voies aériennes libres"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 3,
     'Pour une victime adulte en arrêt cardiaque, le ratio massage/insufflations est :',
     'qcm_unique',
     '["15 compressions / 2 insufflations","30 compressions / 2 insufflations","20 compressions / 1 insufflation","Continu (sans insufflations) si vous n''êtes pas formé au bouche-à-bouche"]'::jsonb,
     null, true,
     '"30 compressions / 2 insufflations"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 4,
     'Pour une victime qui s''étouffe (obstruction totale), la séquence correcte chez l''adulte est :',
     'qcm_unique',
     '["5 claques dans le dos, puis 5 compressions abdominales (Heimlich)","5 compressions abdominales, puis 5 claques dans le dos","Uniquement les claques dans le dos, jamais les compressions abdominales","Appeler le 15 avant de commencer les gestes"]'::jsonb,
     null, true,
     '"5 claques dans le dos, puis 5 compressions abdominales (Heimlich)"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 5,
     'Concernant l''utilisation du DAE (défibrillateur automatisé externe) : (plusieurs réponses possibles)',
     'qcm_multiple',
     '["Il peut être utilisé par n''importe qui, même sans formation","Il doit être mis en œuvre dès qu''il est disponible, sans interrompre le massage plus de 10 secondes","Il ne doit pas être utilisé sur un enfant de moins de 8 ans","Après le choc, il faut reprendre immédiatement le massage cardiaque"]'::jsonb,
     null, true,
     '["Il peut être utilisé par n''importe qui, même sans formation","Il doit être mis en œuvre dès qu''il est disponible, sans interrompre le massage plus de 10 secondes","Après le choc, il faut reprendre immédiatement le massage cardiaque"]'::jsonb,
     '[]'::jsonb);

  raise notice 'OK — EF2 MAC SST créée (test_id=%) avec 5 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
