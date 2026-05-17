-- =============================================================================
-- Évaluation Formateur — Habilitation Électrique B1V / B2V (NF C 18-510)
-- =============================================================================
-- Source : PDF Eval_HE_B1V_B2V.pdf
--   On extrait Partie C (grille d'évaluation des compétences, 10 compétences)
--   + résultat /20. Parties A QCM et B questions ouvertes : déjà en quiz stagiaire.
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
  where slug = 'habilitation-electrique-b1v-b2v'
     or slug ilike '%habilitation%b1v%b2v%'
     or slug ilike '%habilitation%electrique%b1v%'
     or slug ilike '%b1v%b2v%'
     or titre ilike '%habilitation%électrique%b1v%'
     or titre ilike '%b1v%b2v%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Habilitation B1V/B2V introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation formateur — Grille d''évaluation des compétences (B1V/B2V)',
    'Grille remplie par le formateur : 10 compétences évaluées (symboles, domaines de tension, consignation, EPI, gestes secours, etc.). Score /20.',
    'evaluation_formateur', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1,
     '[Grille] Identifier les symboles et niveaux d''habilitation',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2,
     '[Grille] Distinguer les domaines de tension BT/HT',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3,
     '[Grille] Connaître les zones de travail et distances de sécurité',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     '[Grille] Appliquer la procédure de consignation complète',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5,
     '[Grille] Utiliser les EPI électriques adaptés',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6,
     '[Grille] Rédiger un avis d''habilitation',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7,
     '[Grille] Appliquer les gestes de premiers secours en cas d''électrisation',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     '[Grille] Respecter les règles de sécurité lors des interventions',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 9,
     '[Grille] Identifier les risques spécifiques au voisinage',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 10,
     '[Grille] Communiquer avec le chargé de consignation',
     'qcm_unique', '["Non atteint","En cours d''acquisition","Atteint","Maîtrisé"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 11,
     'TOTAL (sur 20)',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 12,
     'Commentaires du formateur',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Évaluation formateur B1V/B2V créée (test_id=%) avec 12 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
