-- =============================================================================
-- Tests HACCP — Hygiène Alimentaire (SECU — Règl. CE 852/2004)
-- =============================================================================
-- Source : PDF Eval_HACCP.pdf — contient 2 tests :
--   1) Test de positionnement (auto-éval + positionnement + contexte pro)
--   2) Évaluation des acquis (QCM scorables + questions ouvertes, seuil 14/20)
-- Type 'quiz' pour les deux.
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : migration 20260524_question_followup.sql appliquée.
-- =============================================================================


-- =============================================================================
-- TEST 1 — TEST DE POSITIONNEMENT HACCP (18 questions)
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
    raise exception 'Formation HACCP introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Test de positionnement Hygiène Alimentaire — HACCP',
    'Évalue les connaissances initiales en hygiène alimentaire pour adapter la formation au contexte professionnel. Non noté. Durée : 15 min.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ============================================================
  -- PARTIE A — AUTO-ÉVALUATION (Q1-Q8, échelle Jamais fait/Notions/Pratique/Maîtrise)
  -- ============================================================
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1,
     'Je suis capable d''identifier les dangers biologiques, chimiques et physiques.',
     'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2,
     'Je suis capable de distinguer les aliments à risque des aliments stables.',
     'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 3,
     'Je suis capable de respecter la chaîne du froid et les températures réglementaires.',
     'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     'Je suis capable d''appliquer les règles de nettoyage et désinfection.',
     'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5,
     'Je suis capable de gérer la traçabilité et les DLC/DDM.',
     'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6,
     'Je suis capable d''identifier les points critiques (CCP) dans mon activité.',
     'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7,
     'Je suis capable de gérer une non-conformité alimentaire.',
     'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     'Je suis capable d''appliquer les bonnes pratiques d''hygiène personnelle.',
     'qcm_unique',
     '["Jamais fait","Notions de base","Je pratique","Je maîtrise"]'::jsonb,
     null, true, null, '[]'::jsonb),

  -- ============================================================
  -- PARTIE B — QUESTIONS DE POSITIONNEMENT (Q9-Q14)
  -- ============================================================
    (v_test_id, 9,
     'Que signifie HACCP ?',
     'qcm_unique',
     '["Hygiène Alimentaire et Contrôle des Conditions de Production","Hazard Analysis Critical Control Point","Haute Autorité de Contrôle des Conditions de Production","Aucune de ces réponses"]'::jsonb,
     null, true, '"Hazard Analysis Critical Control Point"'::jsonb, '[]'::jsonb),

    (v_test_id, 10,
     'À quelle température doit être conservé un produit réfrigéré (viande fraîche) ?',
     'qcm_unique',
     '["Entre 0°C et 4°C","Entre 4°C et 8°C","Entre -2°C et 2°C","En dessous de 10°C"]'::jsonb,
     null, true, '"Entre 0°C et 4°C"'::jsonb, '[]'::jsonb),

    (v_test_id, 11,
     'La DLC (Date Limite de Consommation) peut être dépassée si le produit semble encore bon.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 12,
     'Le nettoyage et la désinfection sont deux opérations identiques.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 13,
     'Citez 2 exemples de dangers biologiques pouvant contaminer un aliment.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 14,
     'Qu''est-ce que la marche en avant dans un laboratoire alimentaire ?',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ============================================================
  -- PARTIE C — CONTEXTE PROFESSIONNEL (Q15-Q18)
  -- ============================================================
    (v_test_id, 15,
     'Dans quel secteur exercez-vous ?',
     'qcm_unique',
     '["Restauration","Grande distribution","Agroalimentaire","Commerce de bouche","Autre"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 16,
     'Avez-vous déjà suivi une formation HACCP ?',
     'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null, '["Oui"]'::jsonb),

    (v_test_id, 17,
     'Faites-vous l''objet de contrôles sanitaires réguliers ?',
     'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 18,
     'Votre établissement a-t-il un plan de maîtrise sanitaire ?',
     'qcm_unique',
     '["Oui","Non","Je ne sais pas"]'::jsonb,
     null, true, null, '[]'::jsonb);

  raise notice 'OK — Test de positionnement HACCP créé (test_id=%) avec 18 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;


-- =============================================================================
-- TEST 2 — ÉVALUATION DES ACQUIS HACCP (15 questions, seuil 14/20)
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
    raise exception 'Formation HACCP introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation des acquis Hygiène Alimentaire — HACCP',
    'Évaluation de fin de formation. Score minimum requis : 14/20 (70%) pour la délivrance de l''attestation. Durée : 30 min. 10 QCM (1 pt) + 5 questions ouvertes (2 pts).',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ============================================================
  -- PARTIE A — QCM (Q1-Q10, 1 point par question)
  -- ============================================================
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1,
     'Quelles sont les 7 étapes de la méthode HACCP ?',
     'qcm_unique',
     '["Identifier, analyser, maîtriser, vérifier, documenter, réviser, former","Analyser les dangers, identifier les CCP, fixer les limites critiques, surveiller, actions correctives, vérifier, documenter","Nettoyer, désinfecter, surveiller, enregistrer, corriger, valider, former","Identifier, prévenir, corriger, surveiller, documenter, former, auditer"]'::jsonb,
     null, true,
     '"Analyser les dangers, identifier les CCP, fixer les limites critiques, surveiller, actions correctives, vérifier, documenter"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 2,
     'Quelle est la zone de danger bactériologique pour les aliments ?',
     'qcm_unique',
     '["Entre 0°C et 4°C","Entre 4°C et 63°C","Entre -18°C et 0°C","Au-dessus de 63°C"]'::jsonb,
     null, true, '"Entre 4°C et 63°C"'::jsonb, '[]'::jsonb),

    (v_test_id, 3,
     'Un CCP (Point Critique de Contrôle) est :',
     'qcm_unique',
     '["Un point de contrôle qualité","Une étape où une mesure de maîtrise peut être appliquée pour prévenir un danger alimentaire significatif","Un contrôle effectué par la DDPP","Un point de nettoyage obligatoire"]'::jsonb,
     null, true,
     '"Une étape où une mesure de maîtrise peut être appliquée pour prévenir un danger alimentaire significatif"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 4,
     'La DLC s''applique aux produits :',
     'qcm_unique',
     '["Stables à température ambiante","Très périssables nécessitant une conservation au froid","Surgelés","En conserve"]'::jsonb,
     null, true, '"Très périssables nécessitant une conservation au froid"'::jsonb, '[]'::jsonb),

    (v_test_id, 5,
     'Quelle température minimale doit atteindre un plat cuisiné pour être sûr ?',
     'qcm_unique',
     '["63°C","70°C","75°C à cœur","80°C"]'::jsonb,
     null, true, '"75°C à cœur"'::jsonb, '[]'::jsonb),

    (v_test_id, 6,
     'La traçabilité alimentaire est obligatoire :',
     'qcm_unique',
     '["Uniquement en restauration collective","Uniquement pour les produits carnés","Pour tous les opérateurs de la chaîne alimentaire","Uniquement à la demande de la DDPP"]'::jsonb,
     null, true, '"Pour tous les opérateurs de la chaîne alimentaire"'::jsonb, '[]'::jsonb),

    (v_test_id, 7,
     'Le nettoyage précède toujours la désinfection car :',
     'qcm_unique',
     '["C''est une obligation réglementaire","La saleté inactive les désinfectants","C''est plus rapide","Aucune raison particulière"]'::jsonb,
     null, true, '"La saleté inactive les désinfectants"'::jsonb, '[]'::jsonb),

    (v_test_id, 8,
     'Que faire en cas de rupture de chaîne du froid ?',
     'qcm_unique',
     '["Remettre immédiatement en froid et ne rien signaler","Évaluer la durée et la température, décider du devenir du produit, enregistrer","Jeter systématiquement tous les produits","Consommer immédiatement"]'::jsonb,
     null, true,
     '"Évaluer la durée et la température, décider du devenir du produit, enregistrer"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 9,
     'Les allergènes à déclaration obligatoire sont au nombre de :',
     'qcm_unique',
     '["7","10","14","20"]'::jsonb,
     null, true, '"14"'::jsonb, '[]'::jsonb),

    (v_test_id, 10,
     'Un plan de nettoyage-désinfection doit mentionner :',
     'qcm_unique',
     '["Le nom du responsable uniquement","Quoi, quand, comment, avec quoi, qui","Uniquement les produits utilisés","Uniquement la fréquence"]'::jsonb,
     null, true, '"Quoi, quand, comment, avec quoi, qui"'::jsonb, '[]'::jsonb),

  -- ============================================================
  -- PARTIE B — QUESTIONS OUVERTES (Q11-Q15, 2 points chacune)
  -- ============================================================
    (v_test_id, 11,
     'Expliquez la différence entre DLC et DDM. Donnez un exemple pour chacune.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 12,
     'Qu''est-ce qu''un plan de maîtrise sanitaire (PMS) ? Quels en sont les éléments principaux ?',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 13,
     'Décrivez la procédure à suivre en cas de découverte d''une non-conformité sur un produit reçu.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 14,
     'Citez 5 règles essentielles d''hygiène du personnel manipulant des denrées alimentaires.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 15,
     'Qu''est-ce que la marche en avant ? Pourquoi est-elle importante en restauration ?',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb);

  raise notice 'OK — Évaluation des acquis HACCP créée (test_id=%) avec 15 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
