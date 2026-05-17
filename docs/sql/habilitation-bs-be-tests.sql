-- =============================================================================
-- Test de Positionnement — Habilitation Électrique BS / BE Manœuvre (SECU-05)
-- =============================================================================
-- 1 seul test : positionnement (entrée formation) — non éliminatoire.
-- L'évaluation des acquis est dans habilitation-bs-be-evaluation-acquis.sql.
-- 20 questions : auto-évaluation + positionnement technique + expérience.
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
  where slug = 'habilitation-electrique-bs-be-manoeuvre'
     or slug ilike '%habilitation%bs%be%'
     or slug ilike '%secu-05%'
     or titre ilike '%habilitation%bs%be%'
     or titre ilike '%habilitation%électrique%bs%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Habilitation BS/BE Manœuvre introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Test de positionnement Habilitation Électrique BS / BE Manœuvre',
    'Évaluation des connaissances initiales en électricité BT avant la formation. Durée 20 min. Auto-évaluation + questions de positionnement + expérience professionnelle. Non éliminatoire.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ---- Partie A : Auto-évaluation (8 items, sans bonne réponse)
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Je suis capable d''expliquer les effets du courant électrique sur le corps humain.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2, 'Je suis capable d''identifier les différents domaines de tension (BT, HT).', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3, 'Je suis capable d''appliquer une procédure de consignation électrique en BT.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4, 'Je suis capable d''utiliser un multimètre pour effectuer une VAT.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5, 'Je suis capable de remplacer un fusible BT en sécurité.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6, 'Je suis capable de raccorder un équipement électrique hors tension.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7, 'Je suis capable de sélectionner les EPI adaptés à une intervention électrique BT.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8, 'Je suis capable d''effectuer des manœuvres sur appareillage BT (disjoncteurs, sectionneurs).', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

  -- ---- Partie B : Questions de positionnement (8 QCM scorables + 2 texte libre)
    (v_test_id, 9, 'Que signifie le symbole BS dans la nomenclature des habilitations ?', 'qcm_unique',
     '["Basse Sécurité","Intervenant électrique Basse Tension pour interventions élémentaires","Chargé de sécurité en BT","Sous-traitant en BT"]'::jsonb,
     null, true, '"Intervenant électrique Basse Tension pour interventions élémentaires"'::jsonb, '[]'::jsonb),

    (v_test_id, 10, 'Un titulaire de l''habilitation BS peut réaliser des raccordements sous tension.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 11, 'Quelle est la plage de tension de la basse tension (BT) en courant alternatif ?', 'qcm_unique',
     '["0 à 50 V","50 V à 1 000 V","1 000 V à 50 000 V","Au-delà de 50 000 V"]'::jsonb,
     null, true, '"50 V à 1 000 V"'::jsonb, '[]'::jsonb),

    (v_test_id, 12, 'Que signifie VAT ?', 'qcm_unique',
     '["Vérification d''Absence de Tension","Validation des Actes Techniques","Vérification des Appareils de Test","Visa d''Aptitude Technique"]'::jsonb,
     null, true, '"Vérification d''Absence de Tension"'::jsonb, '[]'::jsonb),

    (v_test_id, 13, 'L''habilitation BE Manœuvre autorise son titulaire à effectuer des manœuvres sur appareillage BT et HT.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 14, 'Parmi ces actions, laquelle est autorisée pour un titulaire BS ?', 'qcm_unique',
     '["Travailler sur une installation sous tension","Remplacer un fusible BT après mise hors tension et VAT","Consigner une installation HT","Réaliser un câblage en armoire sous tension avec gants isolants"]'::jsonb,
     null, true, '"Remplacer un fusible BT après mise hors tension et VAT"'::jsonb, '[]'::jsonb),

    (v_test_id, 15, 'À partir de quelle intensité le courant alternatif est-il considéré comme dangereux pour le cœur ?', 'qcm_unique',
     '["1 mA","10 mA","30 mA","100 mA"]'::jsonb,
     null, true, '"30 mA"'::jsonb, '[]'::jsonb),

    (v_test_id, 16, 'L''habilitation électrique est valable à vie une fois obtenue.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 17, 'Citez deux EPI que vous connaissez pour des interventions électriques en BT.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 18, 'Qu''est-ce qu''une consignation électrique ? Décrivez-la en quelques mots.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ---- Partie C : Expérience professionnelle (2 questions contextuelles)
    (v_test_id, 19, 'Avez-vous déjà effectué des interventions électriques (fusibles, raccordements, manœuvres) dans votre activité professionnelle ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null,
     '["Oui"]'::jsonb),  -- follow-up : lesquelles

    (v_test_id, 20, 'Commentaires / Attentes particulières pour cette formation.', 'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Test de positionnement Habilitation BS/BE Manœuvre créé (test_id=%) avec 20 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
