-- =============================================================================
-- Évaluation Formateur — Hygiène Alimentaire HACCP
-- =============================================================================
-- Source : PDF Eval_HACCP.pdf
--   Extraction Partie C — Grille d'évaluation des compétences (formateur, 10 compétences).
--   + Total /20.
--   Parties A QCM et B questions ouvertes : déjà en quiz stagiaire (haccp-tests.sql).
-- Type 'evaluation_formateur'.
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
  where slug = 'hygiene-alimentaire-haccp'
     or slug ilike '%hygiene%alimentaire%'
     or slug ilike '%haccp%'
     or titre ilike '%hygiène%alimentaire%'
     or titre ilike '%haccp%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation HACCP introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation formateur — Grille d''évaluation des compétences HACCP',
    'Grille remplie par le formateur : 10 compétences (dangers, principes HACCP, températures, traçabilité, nettoyage, non-conformités, allergènes, hygiène, PMS, marche en avant). Total /20.',
    'evaluation_formateur', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1,
     '[Grille] Identifier les dangers biologiques, chimiques et physiques',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2,
     '[Grille] Appliquer les 7 principes HACCP',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3,
     '[Grille] Respecter les températures réglementaires',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     '[Grille] Assurer la traçabilité des produits (DLC/DDM/lots)',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5,
     '[Grille] Appliquer les procédures de nettoyage-désinfection',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6,
     '[Grille] Gérer les non-conformités et actions correctives',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7,
     '[Grille] Connaître les 14 allergènes majeurs',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     '[Grille] Appliquer les règles d''hygiène du personnel',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 9,
     '[Grille] Comprendre et utiliser le plan de maîtrise sanitaire (PMS)',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 10,
     '[Grille] Organiser la marche en avant dans l''espace de travail',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 11,
     'TOTAL (sur 20)',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 12,
     'Commentaires du formateur',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Évaluation formateur HACCP créée (test_id=%) avec 12 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
