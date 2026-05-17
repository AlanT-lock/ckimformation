-- =============================================================================
-- Tests DUERP — Document Unique d'Évaluation des Risques Professionnels
-- =============================================================================
-- 2 tests : positionnement (entrée formation) + évaluation des acquis (fin).
-- Type 'quiz' pour les deux ; positionnement non éliminatoire, acquis seuil 14/20.
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : migration 20260524_question_followup.sql appliquée.
-- =============================================================================


-- =============================================================================
-- TEST 1 — TEST DE POSITIONNEMENT DUERP (19 questions)
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
     or titre ilike '%document unique%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation DUERP introuvable. Vérifiez le slug dans la table public.formations.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Test de positionnement DUERP',
    'Évaluation des connaissances initiales sur la prévention des risques professionnels et le DUERP. Durée 15 min. Auto-évaluation + questions de positionnement + contexte entreprise.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ---- Partie A : Auto-évaluation (8 items, sans bonne réponse)
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Je suis capable d''identifier les risques professionnels dans mon entreprise.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2, 'Je suis capable d''évaluer la probabilité et la gravité d''un risque.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3, 'Je suis capable de rédiger ou mettre à jour un Document Unique.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4, 'Je suis capable de hiérarchiser les risques par cotation.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5, 'Je suis capable de proposer des actions de prévention adaptées.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6, 'Je suis capable de distinguer prévention primaire, secondaire et tertiaire.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7, 'Je connais les obligations légales de l''employeur en matière de prévention.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8, 'Je suis capable d''impliquer les salariés dans la démarche de prévention.', 'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

  -- ---- Partie B : Questions de positionnement (6 questions)
    (v_test_id, 9, 'Le DUERP (Document Unique d''Évaluation des Risques Professionnels) est obligatoire pour :', 'qcm_unique',
     '["Les entreprises de plus de 50 salariés uniquement","Toutes les entreprises ayant au moins 1 salarié","Les entreprises de plus de 10 salariés","Uniquement les entreprises industrielles"]'::jsonb,
     null, true,
     '"Toutes les entreprises ayant au moins 1 salarié"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 10, 'À quelle fréquence minimum le DUERP doit-il être mis à jour ?', 'qcm_unique',
     '["Tous les 5 ans","Tous les 3 ans","Chaque année et lors de tout changement","À la demande de l''inspection du travail"]'::jsonb,
     null, true,
     '"Chaque année et lors de tout changement"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 11, 'L''évaluation des risques professionnels est une démarche facultative pour l''employeur.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 12, 'Les salariés doivent être associés à la démarche d''évaluation des risques.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 13, 'Citez 3 types de risques professionnels que vous avez identifiés dans votre entreprise.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 14, 'Qu''est-ce qu''un plan d''action de prévention ? À quoi sert-il ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ---- Partie C : Contexte entreprise (5 questions, sans bonne réponse)
    (v_test_id, 15, 'Votre entreprise dispose-t-elle d''un DUERP ?', 'qcm_unique',
     '["Oui","Non","Je ne sais pas"]'::jsonb,
     null, true, null,
     '["Oui"]'::jsonb),  -- follow-up : date de dernière mise à jour

    (v_test_id, 16, 'Un accident du travail est-il survenu ces 12 derniers mois ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 17, 'Avez-vous un CSE ou un représentant du personnel ?', 'qcm_unique',
     '["Oui","Non","Non applicable"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 18, 'Un référent sécurité est-il désigné dans votre entreprise ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 19, 'Attentes particulières / Risques prioritaires dans votre entreprise.', 'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Test de positionnement DUERP créé (test_id=%) avec 19 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;


-- =============================================================================
-- TEST 2 — ÉVALUATION DES ACQUIS DUERP (15 questions)
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
     or titre ilike '%document unique%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation DUERP introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation des acquis DUERP',
    'Évaluation de fin de formation. Score minimum requis : 14/20 (70%). Durée 30 min. 10 QCM scorables + 5 questions ouvertes. La partie pratique en présentiel et la grille d''évaluation des compétences sont conduites par le formateur.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ---- Partie A : 10 QCM (toutes scorables)
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'L''obligation d''évaluation des risques professionnels est définie par :', 'qcm_unique',
     '["L''article L.4121-3 du Code du travail","Le Code de la sécurité sociale","La directive européenne 2002/44/CE","Le règlement intérieur de l''entreprise"]'::jsonb,
     null, true,
     '"L''article L.4121-3 du Code du travail"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 2, 'La cotation d''un risque s''effectue généralement en croisant :', 'qcm_unique',
     '["La fréquence et le coût","La gravité et la probabilité d''occurrence","Le nombre de salariés et l''ancienneté","La durée et l''intensité du travail"]'::jsonb,
     null, true,
     '"La gravité et la probabilité d''occurrence"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 3, 'Quel est le principe fondamental de la prévention selon le Code du travail ?', 'qcm_unique',
     '["Protéger d''abord les salariés puis les équipements","Éviter les risques à la source avant de les réduire","Former les salariés avant toute intervention","Assurer les salariés contre les accidents"]'::jsonb,
     null, true,
     '"Éviter les risques à la source avant de les réduire"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 4, 'Le DUERP doit être conservé pendant :', 'qcm_unique',
     '["5 ans","10 ans","40 ans minimum","1 an"]'::jsonb,
     null, true,
     '"40 ans minimum"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 5, 'Qui est responsable de l''élaboration du DUERP ?', 'qcm_unique',
     '["Le médecin du travail","L''inspection du travail","L''employeur","Le CSE"]'::jsonb,
     null, true,
     '"L''employeur"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 6, 'Les 9 principes généraux de prévention sont définis dans :', 'qcm_unique',
     '["L''article L.4121-2 du Code du travail","Le Code de la sécurité sociale","La norme ISO 45001","Le règlement CE 1907/2006"]'::jsonb,
     null, true,
     '"L''article L.4121-2 du Code du travail"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 7, 'Un accident de travail doit être déclaré à la CPAM dans un délai de :', 'qcm_unique',
     '["24 heures","48 heures","72 heures","8 jours ouvrables"]'::jsonb,
     null, true,
     '"48 heures"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 8, 'Depuis la loi du 2 août 2021, le DUERP doit être accessible :', 'qcm_unique',
     '["Uniquement à l''inspection du travail","Aux salariés, anciens salariés et leurs ayants droit","Uniquement au CSE","Uniquement à l''employeur"]'::jsonb,
     null, true,
     '"Aux salariés, anciens salariés et leurs ayants droit"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 9, 'La prévention primaire consiste à :', 'qcm_unique',
     '["Soigner les victimes d''accidents","Réduire les conséquences d''un risque","Éliminer ou réduire le risque à la source","Former les secouristes"]'::jsonb,
     null, true,
     '"Éliminer ou réduire le risque à la source"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 10, 'Le plan d''action de prévention doit mentionner :', 'qcm_unique',
     '["Uniquement les mesures techniques","L''action, le responsable, le délai, les moyens et les indicateurs","Uniquement le coût des mesures","Le nombre d''accidents de l''année précédente"]'::jsonb,
     null, true,
     '"L''action, le responsable, le délai, les moyens et les indicateurs"'::jsonb,
     '[]'::jsonb),

  -- ---- Partie B : 5 questions ouvertes (texte libre)
    (v_test_id, 11, 'Décrivez les étapes de la démarche d''évaluation des risques professionnels (méthode DUERP).', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 12, 'Quelle est la différence entre danger et risque professionnel ? Donnez un exemple pour chacun.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 13, 'Quelles sont les obligations de l''employeur en matière de prévention des risques professionnels ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 14, 'Comment impliquer les salariés dans la démarche d''évaluation des risques ? Citez 3 méthodes.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 15, 'Qu''est-ce qu''un arbre des causes ? Dans quel contexte l''utilise-t-on ?', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb);

  raise notice 'OK — Évaluation des acquis DUERP créée (test_id=%) avec 15 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
