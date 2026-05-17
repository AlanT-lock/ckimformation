-- =============================================================================
-- Évaluation Formateur — Formateur Sécurité Incendie 28h (4 jours)
-- =============================================================================
-- Source : PDF Eval_FO_Incendie.pdf (V1CA-11/2025)
--   On extrait Partie C (épreuve pratique formateur, 10 critères × 1,5 pt)
--   + Partie D (grille globale des compétences, 10 compétences)
--   + Résultat final.
--   Parties A QCM et B questions ouvertes : déjà en quiz stagiaire séparé.
-- Type 'evaluation_formateur' — remplie par le formateur pour chaque stagiaire.
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
  where slug = 'formateur-incendie-gestes-postures'
     or slug = 'formateur-securite-incendie'
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
    'Évaluation formateur — Épreuve pratique + Grille globale (Formateur Sécurité Incendie)',
    'Grilles remplies par le formateur : épreuve pratique (animation séquence + exercice extincteur ou simulation évacuation) sur 10 critères + grille globale des compétences sur 10 compétences.',
    'evaluation_formateur', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    -- ============================================================
    -- PARTIE C — ÉPREUVE PRATIQUE
    -- Le stagiaire anime une séquence de 20 minutes (théorie + exercice
    -- extincteur ou simulation évacuation). 10 critères × 1,5 pt max.
    -- ============================================================
    (v_test_id, 1,
     'Épreuve choisie',
     'qcm_unique',
     '["Animation théorique (triangle du feu / classes)","Exercice extincteur","Simulation évacuation"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2,
     '[Pratique] Introduction et mise en contexte de la séquence',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3,
     '[Pratique] Maîtrise technique du contenu (triangle du feu, classes…)',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     '[Pratique] Démonstration correcte de l''utilisation de l''extincteur',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5,
     '[Pratique] Organisation et chronologie de l''évacuation',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6,
     '[Pratique] Clarté et pédagogie du discours (langage adapté)',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7,
     '[Pratique] Gestion du groupe et des questions',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     '[Pratique] Respect des consignes de sécurité pendant l''exercice',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 9,
     '[Pratique] Correction des erreurs des participants',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 10,
     '[Pratique] Réalisme et qualité de la mise en situation',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 11,
     '[Pratique] Bilan de séquence (points clés, retour d''expérience)',
     'qcm_unique',
     '["Insuffisant (0 pt)","En cours (0,5 pt)","Satisfaisant (1 pt)","Excellent (1,5 pt)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- PARTIE D — GRILLE GLOBALE DES COMPÉTENCES (10 compétences)
    -- ============================================================
    (v_test_id, 12,
     '[Grille] Maîtriser la théorie du feu (triangle, classes, phénomènes)',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 13,
     '[Grille] Identifier et utiliser les équipements de lutte incendie',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 14,
     '[Grille] Manier correctement un extincteur (dégoupiller, viser, presser)',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 15,
     '[Grille] Manier un RIA — technique et sécurité',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 16,
     '[Grille] Organiser et diriger une évacuation complète',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 17,
     '[Grille] Connaître les obligations réglementaires (Code du travail, ERP)',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 18,
     '[Grille] Concevoir et animer une formation incendie adaptée',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 19,
     '[Grille] Rédiger un rapport d''exercice d''évacuation',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 20,
     '[Grille] Adapter la formation aux risques spécifiques de l''établissement',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 21,
     '[Grille] Évaluer les acquis des participants (formative + pratique)',
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
     'Commentaires du formateur',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Évaluation formateur Formateur Incendie créée (test_id=%) avec 24 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
