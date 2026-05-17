-- =============================================================================
-- Évaluation Formateur — Formation de Formateur SST (Certification INRS, 56h)
-- =============================================================================
-- Source : PDF Eval_FO_SST.pdf (V1CA-11/2025)
--   On extrait Partie C (épreuve pratique d'animation, 10 critères × 1,5 pt)
--   + Partie D (grille globale des compétences, 10 compétences)
--   + Résultat final.
--   Parties A QCM et B questions ouvertes : déjà en quiz stagiaire.
-- Type 'evaluation_formateur' — remplie par le formateur référent INRS.
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
  where slug = 'formateur-sst'
     or slug ilike '%formateur%sst%'
     or titre ilike '%formateur%sst%'
     or titre ilike '%formation%formateur%sst%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Formateur SST introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation formateur — Épreuve pratique + Grille globale (Formateur SST)',
    'Grilles remplies par le formateur référent INRS : épreuve pratique d''animation (20 min sur cas concret SST) sur 10 critères + grille globale des compétences sur 10 compétences.',
    'evaluation_formateur', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    -- ============================================================
    -- PARTIE C — ÉPREUVE PRATIQUE D'ANIMATION
    -- Cas tiré au sort + 10 critères d'évaluation
    -- ============================================================
    (v_test_id, 1,
     'Cas tiré au sort',
     'qcm_unique',
     '["Hémorragie","Inconscience","ACR","Malaise","Traumatisme","Brûlure","Autre"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2,
     'Durée de la séquence (en minutes) et nombre de stagiaires joués',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 3,
     '[Pratique] Présentation du cas et mise en situation',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     '[Pratique] Démonstration technique correcte des gestes',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5,
     '[Pratique] Guidance des stagiaires (posture, gestes)',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6,
     '[Pratique] Gestion du timing (20 min)',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7,
     '[Pratique] Langage adapté au public',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     '[Pratique] Correction des erreurs techniques',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 9,
     '[Pratique] Utilisation de la méthode PISST',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 10,
     '[Pratique] Gestion du groupe et de la dynamique',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 11,
     '[Pratique] Évaluation formative des stagiaires',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 12,
     '[Pratique] Bilan de séquence (points clés, apprentissages)',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- PARTIE D — GRILLE GLOBALE DES COMPÉTENCES (10 compétences)
    -- ============================================================
    (v_test_id, 13,
     '[Grille] Maîtriser les gestes de premiers secours (RCP, PLS, DAE, hémorragie)',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 14,
     '[Grille] Connaître le cadre réglementaire du SST (obligations, recyclage)',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 15,
     '[Grille] Concevoir une séquence pédagogique SST (cas concret)',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 16,
     '[Grille] Animer une formation SST avec la méthode PISST',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 17,
     '[Grille] Utiliser les outils INRS (PISST, PAP, Tuto''Prev, Drive FO SST)',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 18,
     '[Grille] Évaluer les acquis des stagiaires (formative + sommative)',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 19,
     '[Grille] Gérer les situations difficiles en formation pratique',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 20,
     '[Grille] Adapter sa posture pédagogique selon le public',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 21,
     '[Grille] Rédiger un bilan de session de formation',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 22,
     '[Grille] Respecter les exigences Qualiopi en tant que formateur interne',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- RÉSULTAT FINAL
    -- ============================================================
    (v_test_id, 23,
     'Score épreuve pratique (sur 15) ramené sur 10',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 24,
     'TOTAL global (sur 20)',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 25,
     'Nom du formateur référent INRS + commentaires',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Évaluation formateur Formateur SST créée (test_id=%) avec 25 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
