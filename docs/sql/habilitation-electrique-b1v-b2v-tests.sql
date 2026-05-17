-- =============================================================================
-- Tests Habilitation Électrique B1V / B2V — Norme NF C 18-510
-- =============================================================================
-- 2 tests : positionnement (entrée formation) + évaluation des acquis (fin).
-- Type 'quiz' pour les deux (positionnement non éliminatoire, acquis seuil 14/20).
-- Partie C de l'évaluation (grille compétences) exclue — réservée au formateur.
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : migration 20260524_question_followup.sql appliquée.
-- =============================================================================


-- =============================================================================
-- TEST 1 — TEST DE POSITIONNEMENT HABILITATION ÉLECTRIQUE B1V/B2V (21 questions)
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  select id into v_formation_id
  from public.formations
  where slug = 'habilitation-electrique-b1v-b2v'
     or slug ilike '%habilitation%electrique%b1v%'
     or slug ilike '%habilitation%electrique%'
     or titre ilike '%habilitation%électrique%b1v%'
     or titre ilike '%habilitation%électrique%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Habilitation Électrique B1V/B2V introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Test de positionnement Habilitation Électrique B1V/B2V',
    'Évaluation des connaissances initiales en électricité avant la formation. Durée 15 min. Auto-évaluation + questions de positionnement + expérience professionnelle. Non éliminatoire.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ---- Partie A : Auto-évaluation (8 items, sans bonne réponse)
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Je suis capable d''identifier les différents types de courants électriques (AC/DC).', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2, 'Je suis capable de nommer les grandeurs électriques (tension, intensité, résistance).', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3, 'Je suis capable de lire un schéma électrique simple.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4, 'Je suis capable d''identifier les zones de travail sous tension.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5, 'Je suis capable d''appliquer une procédure de consignation électrique.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6, 'Je suis capable de distinguer les domaines de tension (BTB, BTA, HTA, HTB).', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7, 'Je suis capable d''utiliser les EPI électriques adaptés.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8, 'Je suis capable de rédiger un avis d''habilitation.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

  -- ---- Partie B : Questions de positionnement (6 QCM scorables + 2 texte libre)
    (v_test_id, 9, 'Que signifie l''indice B dans la symbolique d''habilitation ?', 'qcm_unique',
     '["Travaux sous tension","Basse tension","Travailleur non électricien","Travailleur électricien"]'::jsonb,
     null, true, '"Travailleur électricien"'::jsonb, '[]'::jsonb),

    (v_test_id, 10, 'Quel est le domaine de tension de la Basse Tension B (BTB) ?', 'qcm_unique',
     '["> 50V et ≤ 500V CA","> 500V et ≤ 1000V CA","> 1000V et ≤ 50kV CA","≤ 50V CA"]'::jsonb,
     null, true, '"> 500V et ≤ 1000V CA"'::jsonb, '[]'::jsonb),

    (v_test_id, 11, 'Combien d''étapes comporte une consignation électrique ?', 'qcm_unique',
     '["2 étapes","3 étapes","4 étapes","5 étapes"]'::jsonb,
     null, true, '"4 étapes"'::jsonb, '[]'::jsonb),

    (v_test_id, 12, 'Que signifie l''indice V dans B1V ?', 'qcm_unique',
     '["Vérification","Travaux au voisinage de pièces nues sous tension","Visite","Validation"]'::jsonb,
     null, true, '"Travaux au voisinage de pièces nues sous tension"'::jsonb, '[]'::jsonb),

    (v_test_id, 13, 'Un travailleur habilité B0 peut effectuer des travaux sous tension.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 14, 'Le port des EPI électriques est obligatoire dès lors qu''on intervient à proximité de pièces nues sous tension.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 15, 'Qu''est-ce qu''une zone de voisinage simple (ZVS) ? Décrivez-la en quelques mots.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 16, 'Citez 3 EPI spécifiques aux travaux électriques que vous connaissez.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ---- Partie C : Expérience professionnelle (4 contextuels + 1 attentes)
    (v_test_id, 17, 'Avez-vous déjà travaillé sur ou à proximité d''installations électriques ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 18, 'Êtes-vous déjà titulaire d''une habilitation électrique ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null,
     '["Oui"]'::jsonb),  -- follow-up : laquelle

    (v_test_id, 19, 'Depuis combien de temps exercez-vous votre métier actuel ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 20, 'Avez-vous suivi une formation électrique auparavant ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null,
     '["Oui"]'::jsonb),  -- follow-up : date

    (v_test_id, 21, 'Commentaires / Attentes particulières pour cette formation.', 'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Test de positionnement Habilitation Électrique B1V/B2V créé (test_id=%) avec 21 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;


-- =============================================================================
-- TEST 2 — ÉVALUATION DES ACQUIS HABILITATION ÉLECTRIQUE B1V/B2V (15 questions)
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  select id into v_formation_id
  from public.formations
  where slug = 'habilitation-electrique-b1v-b2v'
     or slug ilike '%habilitation%electrique%b1v%'
     or slug ilike '%habilitation%electrique%'
     or titre ilike '%habilitation%électrique%b1v%'
     or titre ilike '%habilitation%électrique%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Habilitation Électrique B1V/B2V introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation des acquis Habilitation Électrique B1V/B2V',
    'Évaluation certificative de fin de formation. Score minimum requis : 14/20 (70%). Durée 30 min. Documents interdits. 10 QCM + 5 questions ouvertes. La grille d''évaluation des compétences est complétée par le formateur en présentiel.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ---- Partie A : 10 QCM (toutes scorables)
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Quelle habilitation permet d''effectuer des travaux d''ordre électrique en BT au voisinage ?', 'qcm_unique',
     '["B0","B1V","BR","BC"]'::jsonb,
     null, true, '"B1V"'::jsonb, '[]'::jsonb),

    (v_test_id, 2, 'La distance limite de voisinage simple (DLVS) en BT est de :', 'qcm_unique',
     '["0,30 m","0,50 m","1,50 m","3,00 m"]'::jsonb,
     null, true, '"0,50 m"'::jsonb, '[]'::jsonb),

    (v_test_id, 3, 'Combien d''étapes comporte une consignation complète ?', 'qcm_unique',
     '["2","3","4","5"]'::jsonb,
     null, true, '"4"'::jsonb, '[]'::jsonb),

    (v_test_id, 4, 'Que signifie VAT ?', 'qcm_unique',
     '["Vérification d''Absence de Tension","Validation des Actes Techniques","Vérification des Appareils de Test","Aucune de ces réponses"]'::jsonb,
     null, true, '"Vérification d''Absence de Tension"'::jsonb, '[]'::jsonb),

    (v_test_id, 5, 'Quel EPI est obligatoire pour travailler au voisinage de pièces nues BT ?', 'qcm_unique',
     '["Gants isolants classe 00 minimum","Lunettes de soleil","Casque de chantier","Chaussures de sécurité simples"]'::jsonb,
     null, true, '"Gants isolants classe 00 minimum"'::jsonb, '[]'::jsonb),

    (v_test_id, 6, 'Qui peut délivrer l''habilitation électrique ?', 'qcm_unique',
     '["Le formateur","L''inspection du travail","L''employeur","CONSUEL"]'::jsonb,
     null, true, '"L''employeur"'::jsonb, '[]'::jsonb),

    (v_test_id, 7, 'Quelle est la tension de sécurité en milieu mouillé ?', 'qcm_unique',
     '["50V","25V","12V","6V"]'::jsonb,
     null, true, '"25V"'::jsonb, '[]'::jsonb),

    (v_test_id, 8, 'Le titre d''habilitation doit être renouvelé tous les :', 'qcm_unique',
     '["1 an","2 ans","3 ans","Il n''a pas de durée limite"]'::jsonb,
     null, true, '"Il n''a pas de durée limite"'::jsonb, '[]'::jsonb),

    (v_test_id, 9, 'En B2V, l''opérateur est responsable de :', 'qcm_unique',
     '["Exécuter les travaux uniquement","Diriger des travailleurs habilités B1V","Établir les consignations","Délivrer les habilitations"]'::jsonb,
     null, true, '"Diriger des travailleurs habilités B1V"'::jsonb, '[]'::jsonb),

    (v_test_id, 10, 'Que faut-il faire avant tout travail sur une installation électrique ?', 'qcm_unique',
     '["Prévenir le chef","Appliquer les 4 étapes de consignation","Couper uniquement le disjoncteur","Mettre des gants"]'::jsonb,
     null, true, '"Appliquer les 4 étapes de consignation"'::jsonb, '[]'::jsonb),

  -- ---- Partie B : 5 questions ouvertes
    (v_test_id, 11, 'Décrivez les 4 étapes de la consignation électrique dans l''ordre correct.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 12, 'Quelle est la différence entre un travailleur habilité B1V et B2V ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 13, 'Citez les EPI obligatoires pour des travaux au voisinage en BT et décrivez leur rôle.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 14, 'Que faites-vous si vous découvrez une anomalie sur une installation électrique ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 15, 'Qu''est-ce que la MALT/CCT ? Dans quel cas est-elle obligatoire ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb);

  raise notice 'OK — Évaluation des acquis Habilitation Électrique B1V/B2V créée (test_id=%) avec 15 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
