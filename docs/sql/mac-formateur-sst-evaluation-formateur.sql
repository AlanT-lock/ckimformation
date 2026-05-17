-- =============================================================================
-- Évaluation Formateur — MAC Formateur SST (Maintien et Actualisation 21h)
-- =============================================================================
-- Source : PDF Eval_MAC_FO_SST.pdf
--   Extraction Partie C (épreuve pratique, 10 critères × 1,5 pt)
--   + Partie D (grille globale compétences, 10 compétences).
--   Stagiaire QCM + questions ouvertes : déjà en quiz.
-- Type 'evaluation_formateur' — formateur référent INRS.
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
  where slug = 'mac-formateur-sst'
     or slug ilike '%mac%formateur%sst%'
     or slug ilike '%mac-formateur-sst%'
     or titre ilike '%mac%formateur%sst%'
     or titre ilike '%maintien%actualisation%formateur%sst%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation MAC Formateur SST introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation formateur — Épreuve pratique + Grille globale (MAC Formateur SST)',
    'Grilles remplies par le formateur référent INRS : épreuve pratique d''animation (20 min, conformité ERC 2021 + PISST) sur 10 critères + grille globale des compétences sur 10 compétences.',
    'evaluation_formateur', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    -- ============================================================
    -- PARTIE C — ÉPREUVE PRATIQUE D'ANIMATION
    -- ============================================================
    (v_test_id, 1,
     'Cas SST tiré au sort',
     'qcm_unique',
     '["ACR adulte","ACR avec DAE","Hémorragie","Inconscience/PLS","Malaise","Traumatisme","Brûlure"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2,
     '[Pratique] Mise en situation réaliste du cas SST',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3,
     '[Pratique] Conformité des gestes aux recommandations ERC 2021',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     '[Pratique] Utilisation correcte de la méthode PISST',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5,
     '[Pratique] Guidance technique des stagiaires (correction des gestes)',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6,
     '[Pratique] Clarté du discours et langage adapté',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7,
     '[Pratique] Gestion du timing de la séquence (20 min)',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     '[Pratique] Gestion du groupe et de la dynamique',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 9,
     '[Pratique] Correction bienveillante des erreurs',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 10,
     '[Pratique] Évaluation formative des stagiaires pendant la séquence',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 11,
     '[Pratique] Bilan final de séquence (points clés, messages essentiels)',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- PARTIE D — GRILLE GLOBALE DES COMPÉTENCES (10 compétences)
    -- ============================================================
    (v_test_id, 12,
     '[Grille] Maîtriser les gestes de premiers secours conformes ERC 2021',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 13,
     '[Grille] Utiliser un DAE en formation (adulte et enfant)',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 14,
     '[Grille] Appliquer la méthode PISST pour concevoir une séquence',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 15,
     '[Grille] Animer une formation SST avec pédagogie active',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 16,
     '[Grille] Utiliser les outils INRS (Tuto''Prev, PAP, PISST en ligne)',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 17,
     '[Grille] Évaluer les gestes techniques des stagiaires (grille INRS)',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 18,
     '[Grille] Intégrer les évolutions ERC 2021 dans ses formations',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 19,
     '[Grille] Gérer les situations difficiles en formation pratique SST',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 20,
     '[Grille] Rédiger un bilan de session conforme Qualiopi',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 21,
     '[Grille] Respecter les exigences de la certification INRS',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- RÉSULTAT FINAL
    -- ============================================================
    (v_test_id, 22,
     'Score épreuve pratique (sur 15) ramené sur 10',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 23,
     'TOTAL global (sur 20)',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 24,
     'Nom du formateur référent INRS + commentaires',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Évaluation formateur MAC Formateur SST créée (test_id=%) avec 24 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
