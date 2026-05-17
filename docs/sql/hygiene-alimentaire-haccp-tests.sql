-- =============================================================================
-- Tests Hygiène Alimentaire — Méthode HACCP (SECU-05 ref hygiene)
-- =============================================================================
-- 2 tests : positionnement (entrée formation) + évaluation des acquis (fin).
-- Type 'quiz' pour les deux (positionnement non éliminatoire, acquis seuil 14/20).
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : migration 20260524_question_followup.sql appliquée.
-- =============================================================================


-- =============================================================================
-- TEST 1 — TEST DE POSITIONNEMENT HYGIÈNE ALIMENTAIRE HACCP (16 questions)
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
    raise exception 'Formation Hygiène Alimentaire HACCP introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Test de positionnement Hygiène Alimentaire HACCP',
    'Évaluation des connaissances initiales en hygiène alimentaire avant la formation. Durée 15 min. Auto-évaluation + questions de positionnement. Non éliminatoire.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ---- Partie A : Auto-évaluation (6 items, sans bonne réponse)
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Je suis capable d''expliquer les obligations réglementaires en matière d''hygiène alimentaire.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2, 'Je suis capable d''identifier les principaux micro-organismes pathogènes alimentaires.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3, 'Je suis capable de décrire les bonnes pratiques d''hygiène (BPH) en cuisine.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4, 'Je suis capable d''expliquer ce qu''est un Point Critique de Contrôle (CCP).', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5, 'Je suis capable d''appliquer la règle de la marche en avant en cuisine.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6, 'Je suis capable de gérer correctement la chaîne du froid.', 'qcm_unique',
     '["Jamais entendu parler","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

  -- ---- Partie B : Questions de positionnement (8 QCM scorables + 2 texte libre)
    (v_test_id, 7, 'Quel règlement européen encadre l''hygiène des denrées alimentaires ?', 'qcm_unique',
     '["Règlement CE 178/2002","Règlement CE 852/2004","Directive UE 2019/1152","Règlement CE 1169/2011"]'::jsonb,
     null, true, '"Règlement CE 852/2004"'::jsonb, '[]'::jsonb),

    (v_test_id, 8, 'Que signifie l''acronyme HACCP ?', 'qcm_unique',
     '["Hygiène Alimentaire et Contrôle des Conditions de Production","Hazard Analysis Critical Control Point","Hygienic Analysis and Consumer Care Plan","Health and Agri-food Control Certification Program"]'::jsonb,
     null, true, '"Hazard Analysis Critical Control Point"'::jsonb, '[]'::jsonb),

    (v_test_id, 9, 'La température de conservation des produits réfrigérés doit être maintenue en dessous de :', 'qcm_unique',
     '["4°C","8°C","12°C","0°C"]'::jsonb,
     null, true, '"4°C"'::jsonb, '[]'::jsonb),

    (v_test_id, 10, 'Une TIAC (Toxi-Infection Alimentaire Collective) est déclenchée lorsqu''au moins deux personnes présentent des symptômes similaires après avoir consommé un même aliment.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 11, 'La méthode de nettoyage en cuisine comporte 5 étapes. Laquelle est la première ?', 'qcm_unique',
     '["Désinfecter","Pré-rincer","Détacher / pré-nettoyer","Rincer abondamment"]'::jsonb,
     null, true, '"Détacher / pré-nettoyer"'::jsonb, '[]'::jsonb),

    (v_test_id, 12, 'La traçabilité des denrées alimentaires est obligatoire pour les exploitants du secteur alimentaire.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 13, 'Quel micro-organisme est principalement associé aux intoxications alimentaires par la viande de volaille insuffisamment cuite ?', 'qcm_unique',
     '["Listeria monocytogenes","Salmonella spp.","Staphylococcus aureus","Clostridium botulinum"]'::jsonb,
     null, true, '"Salmonella spp."'::jsonb, '[]'::jsonb),

    (v_test_id, 14, 'La marche en avant consiste à organiser les flux pour éviter que les produits propres et les produits sales ne se croisent.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 15, 'Citez deux bonnes pratiques d''hygiène personnelle indispensables en cuisine.', 'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 16, 'Dans quel contexte professionnel travaillez-vous ? Quelles sont vos attentes pour cette formation ?', 'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Test de positionnement Hygiène Alimentaire HACCP créé (test_id=%) avec 16 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;


-- =============================================================================
-- TEST 2 — ÉVALUATION DES ACQUIS HYGIÈNE ALIMENTAIRE HACCP (20 questions)
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
    raise exception 'Formation Hygiène Alimentaire HACCP introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation des acquis Hygiène Alimentaire HACCP',
    'Évaluation certificative de fin de formation. Barème 100 points, seuil de validation 70/100. Durée 30 min. QCM + questions ouvertes. Conforme au Règlement CE 852/2004 et à l''arrêté du 5 octobre 2011.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ============================================================
  -- PARTIE 1 — RÉGLEMENTATION & MICROBIOLOGIE (Q1-Q8)
  -- ============================================================
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1,
     'Quel texte réglementaire impose la formation en hygiène alimentaire dans la restauration commerciale en France ?',
     'qcm_unique',
     '["Règlement CE 852/2004","Arrêté du 5 octobre 2011","Directive 2006/42/CE","Code rural article L.231-1"]'::jsonb,
     null, true,
     '"Arrêté du 5 octobre 2011"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 2,
     'Combien de principes comporte la méthode HACCP ?',
     'qcm_unique',
     '["5","7","9","12"]'::jsonb,
     null, true, '"7"'::jsonb, '[]'::jsonb),

    (v_test_id, 3,
     'Qu''est-ce qu''un CCP (Point Critique de Contrôle) ?',
     'qcm_unique',
     '["Un poste de contrôle de qualité des produits à la livraison","Une étape du procédé à laquelle une mesure de maîtrise peut être appliquée pour prévenir, éliminer ou réduire un danger alimentaire à un niveau acceptable","Un document de traçabilité obligatoire","Une zone de nettoyage prioritaire en cuisine"]'::jsonb,
     null, true,
     '"Une étape du procédé à laquelle une mesure de maîtrise peut être appliquée pour prévenir, éliminer ou réduire un danger alimentaire à un niveau acceptable"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 4,
     'Les dangers alimentaires peuvent être de nature biologique, chimique et physique.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 5,
     'Quelle bactérie est principalement responsable de la listériose, particulièrement dangereuse pour les femmes enceintes ?',
     'qcm_unique',
     '["Salmonella enteritidis","Listeria monocytogenes","Escherichia coli O157:H7","Staphylococcus aureus"]'::jsonb,
     null, true, '"Listeria monocytogenes"'::jsonb, '[]'::jsonb),

    (v_test_id, 6,
     'Quelles sont les conditions favorables au développement des bactéries ? (plusieurs réponses)',
     'qcm_multiple',
     '["Température entre 4°C et 63°C (zone de danger)","Humidité élevée","Présence de nutriments (sucres, protéines)","Température inférieure à -18°C"]'::jsonb,
     null, true,
     '["Température entre 4°C et 63°C (zone de danger)","Humidité élevée","Présence de nutriments (sucres, protéines)"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 7,
     'Expliquez la différence entre nettoyage et désinfection.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     'Qu''est-ce que la traçabilité alimentaire et pourquoi est-elle obligatoire ? Donnez un exemple concret.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ============================================================
  -- PARTIE 2 — BONNES PRATIQUES D'HYGIÈNE (Q9-Q14)
  -- ============================================================
    (v_test_id, 9,
     'Quelle est la température minimale de cuisson à cœur recommandée pour les volailles ?',
     'qcm_unique',
     '["60°C","70°C","75°C","80°C"]'::jsonb,
     null, true, '"75°C"'::jsonb, '[]'::jsonb),

    (v_test_id, 10,
     'Le lavage des mains doit être effectué : (plusieurs réponses)',
     'qcm_multiple',
     '["Avant de manipuler des aliments","Après avoir touché des déchets ou des emballages souillés","Après être allé aux toilettes","Une seule fois en début de service suffit"]'::jsonb,
     null, true,
     '["Avant de manipuler des aliments","Après avoir touché des déchets ou des emballages souillés","Après être allé aux toilettes"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 11,
     'Les produits de nettoyage et les denrées alimentaires peuvent être stockés dans le même local si les contenants sont bien fermés.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 12,
     'La chaîne du froid est rompue si un produit réfrigéré dépasse :', 'qcm_unique',
     '["0°C","4°C","8°C","12°C"]'::jsonb,
     null, true, '"8°C"'::jsonb, '[]'::jsonb),

    (v_test_id, 13,
     'Décrivez le principe de la « marche en avant » et son objectif en hygiène alimentaire.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 14,
     'Que faire si un salarié présente des symptômes de maladie infectieuse (diarrhées, vomissements) lors de sa prise de poste ?',
     'qcm_unique',
     '["Il peut travailler avec un masque","Il doit être écarté de la manipulation des denrées alimentaires","Il peut travailler uniquement sur des postes sans contact direct avec les aliments","Aucune restriction si les symptômes sont légers"]'::jsonb,
     null, true,
     '"Il doit être écarté de la manipulation des denrées alimentaires"'::jsonb,
     '[]'::jsonb),

  -- ============================================================
  -- PARTIE 3 — MISE EN PRATIQUE HACCP (Q15-Q20)
  -- ============================================================
    (v_test_id, 15,
     'Décrivez les 7 principes de la méthode HACCP dans l''ordre.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 16,
     'Qu''est-ce qu''un diagramme de fabrication et à quoi sert-il dans la démarche HACCP ?',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 17,
     'Lors de la réception de marchandises réfrigérées, quelles vérifications doit-on effectuer ? (plusieurs réponses)',
     'qcm_multiple',
     '["Contrôle de la température à la livraison","Vérification de la DLC / DDM","Contrôle de l''état des emballages et des étiquetages","Signature du bon de livraison sans vérification si le livreur est pressé"]'::jsonb,
     null, true,
     '["Contrôle de la température à la livraison","Vérification de la DLC / DDM","Contrôle de l''état des emballages et des étiquetages"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 18,
     'Un plan de nettoyage et de désinfection doit préciser : (plusieurs réponses)',
     'qcm_multiple',
     '["Les surfaces et équipements concernés","La fréquence de nettoyage","Les produits et dilutions à utiliser","Le nom du fournisseur du restaurant uniquement"]'::jsonb,
     null, true,
     '["Les surfaces et équipements concernés","La fréquence de nettoyage","Les produits et dilutions à utiliser"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 19,
     'Sur votre lieu de travail, identifiez un CCP (Point Critique de Contrôle) et décrivez : la limite critique, le système de surveillance et l''action corrective en cas de dépassement.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 20,
     'Comment gérer une non-conformité (rupture de chaîne du froid, produit périmé) découverte en cours de service ? Décrivez la procédure.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb);

  raise notice 'OK — Évaluation des acquis Hygiène Alimentaire HACCP créée (test_id=%) avec 20 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
