-- =============================================================================
-- Test de Positionnement — Habilitation Électrique H0 / B0 (SECU-06)
-- =============================================================================
-- 1 seul test : positionnement (entrée formation) — non éliminatoire.
-- L'évaluation des acquis est dans habilitation-h0-b0-evaluation-acquis.sql.
-- 18 questions : auto-évaluation + positionnement technique + expérience.
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
  where slug = 'habilitation-electrique-h0-b0'
     or slug ilike '%habilitation%h0%b0%'
     or slug ilike '%secu-06%'
     or titre ilike '%habilitation%h0%b0%'
     or titre ilike '%habilitation%électrique%h0%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Habilitation H0/B0 introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Test de positionnement Habilitation Électrique H0 / B0',
    'Évaluation des connaissances initiales en sécurité électrique avant la formation. Durée 15 min. Auto-évaluation + questions de positionnement + expérience professionnelle. Non éliminatoire.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ---- Partie A : Auto-évaluation (8 items, sans bonne réponse)
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Je suis capable de distinguer les domaines de tension (TBT, BT, HT).', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2, 'Je suis capable d''expliquer ce qu''est une habilitation électrique.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3, 'Je suis capable d''identifier les risques électriques principaux (électrisation, brûlures, amorçage).', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4, 'Je suis capable de citer les EPI électriques de base.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5, 'Je suis capable de décrire la procédure de consignation électrique.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6, 'Je suis capable de distinguer un travail d''ordre électrique et d''ordre non électrique.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7, 'Je suis capable d''identifier les zones de voisinage autour d''une installation électrique.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8, 'Je suis capable de donner les premiers secours en cas d''accident électrique.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

  -- ---- Partie B : Questions de positionnement (6 QCM scorables)
    (v_test_id, 9, 'Que signifie le symbole H0 dans la nomenclature des habilitations ?', 'qcm_unique',
     '["Travailleur électricien en Haute Tension","Exécutant de travaux d''ordre non électrique en domaine HT","Chargé d''habilitation HT","Travailleur sous tension HT"]'::jsonb,
     null, true, '"Exécutant de travaux d''ordre non électrique en domaine HT"'::jsonb, '[]'::jsonb),

    (v_test_id, 10, 'Un titulaire de l''habilitation B0 peut intervenir sur des installations électriques sous tension.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 11, 'Qui est responsable de délivrer l''habilitation électrique au salarié ?', 'qcm_unique',
     '["L''organisme de formation","L''inspection du travail","L''employeur","Le formateur"]'::jsonb,
     null, true, '"L''employeur"'::jsonb, '[]'::jsonb),

    (v_test_id, 12, 'Quel texte encadre les habilitations électriques en France ?', 'qcm_unique',
     '["Le Code de la construction","La norme NFC 18-510 et le Décret du 14 novembre 1988","La norme ISO 45001","L''arrêté du 30 juillet 2003"]'::jsonb,
     null, true, '"La norme NFC 18-510 et le Décret du 14 novembre 1988"'::jsonb, '[]'::jsonb),

    (v_test_id, 13, 'Le courant électrique peut traverser le corps humain et provoquer des brûlures, une tétanisation ou un arrêt cardiaque.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 14, 'Quelle est la première action à réaliser avant d''intervenir à proximité d''une installation électrique ?', 'qcm_unique',
     '["Mettre ses EPI","Prévenir verbalement ses collègues","S''assurer que l''installation est hors tension et consignée","Appeler le chargé de travaux"]'::jsonb,
     null, true, '"S''assurer que l''installation est hors tension et consignée"'::jsonb, '[]'::jsonb),

    (v_test_id, 15, 'Décrivez en quelques mots ce que vous comprenez par « travail d''ordre non électrique ».', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 16, 'Citez deux risques liés au travail à proximité d''une installation électrique.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ---- Partie C : Expérience professionnelle (2 questions contextuelles)
    (v_test_id, 17, 'Avez-vous déjà été amené(e) à travailler à proximité d''installations électriques ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null,
     '["Oui"]'::jsonb),  -- follow-up : dans quel contexte

    (v_test_id, 18, 'Commentaires / Attentes particulières pour cette formation.', 'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Test de positionnement Habilitation H0/B0 créé (test_id=%) avec 18 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
