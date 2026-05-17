-- =============================================================================
-- Évaluation Formateur — DUERP (Document Unique d'Évaluation des Risques Pro)
-- =============================================================================
-- Source : PDF Eval_DUERP.pdf — on n'extrait QUE les parties formateur :
--   - Partie C : Exercice pratique (5 critères, Réalisé/Partiel/Non réalisé)
--   - Partie D : Grille d'évaluation des compétences (10 compétences)
-- Type 'evaluation_formateur' — remplie par le formateur pour chaque stagiaire.
-- Le score /20 est calculé manuellement par le formateur.
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
  where slug = 'duerp'
     or slug ilike '%duerp%'
     or titre ilike '%duerp%'
     or titre ilike '%document%unique%évaluation%risques%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation DUERP introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation formateur — Exercice pratique + grille compétences DUERP',
    'Grille remplie par le formateur. Exercice pratique sur une situation de travail + grille globale d''évaluation des compétences. Score /20 calculé manuellement.',
    'evaluation_formateur', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    -- ============================================================
    -- PARTIE C — EXERCICE PRATIQUE (formateur fournit une situation de travail)
    -- ============================================================
    (v_test_id, 1,
     '[Exercice pratique] Identifier au moins 5 risques présents dans la situation',
     'qcm_unique', '["Réalisé","Partiel","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2,
     '[Exercice pratique] Coter chaque risque (gravité × probabilité)',
     'qcm_unique', '["Réalisé","Partiel","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3,
     '[Exercice pratique] Hiérarchiser les risques identifiés',
     'qcm_unique', '["Réalisé","Partiel","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     '[Exercice pratique] Proposer au moins 3 mesures de prévention adaptées',
     'qcm_unique', '["Réalisé","Partiel","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5,
     '[Exercice pratique] Rédiger une fiche d''unité de travail pour le DUERP',
     'qcm_unique', '["Réalisé","Partiel","Non réalisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6,
     '[Exercice pratique] Observations / situation de travail utilisée',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    -- ============================================================
    -- PARTIE D — GRILLE D'ÉVALUATION DES COMPÉTENCES (10 compétences)
    -- ============================================================
    (v_test_id, 7,
     '[Grille] Identifier les unités de travail de l''entreprise',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     '[Grille] Recenser les dangers pour chaque unité de travail',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 9,
     '[Grille] Évaluer et coter les risques (gravité × probabilité)',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 10,
     '[Grille] Hiérarchiser les risques selon leur criticité',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 11,
     '[Grille] Rédiger une unité de travail dans le DUERP',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 12,
     '[Grille] Élaborer un plan d''action de prévention',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 13,
     '[Grille] Connaître les 9 principes généraux de prévention',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 14,
     '[Grille] Distinguer danger et risque professionnel',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 15,
     '[Grille] Identifier les acteurs de la prévention (CSSCT, médecin travail, CARSAT)',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 16,
     '[Grille] Mettre en œuvre une démarche participative avec les salariés',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- RÉSULTAT FINAL
    -- ============================================================
    (v_test_id, 17,
     'Score total / 20 points',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 18,
     'Commentaires du formateur',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Évaluation formateur DUERP créée (test_id=%) avec 18 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
