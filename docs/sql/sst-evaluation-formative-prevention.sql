-- =============================================================================
-- Évaluation formative — Partie Prévention (SST)
-- =============================================================================
-- Formation : Sauveteur Secouriste du Travail (même formation que le test de
-- positionnement, mais test DIFFÉRENT : évaluation formative en cours/fin de
-- formation, seuil 15/20).
-- 9 questions : 4 texte libre (analyse situation + message à rédiger) + 5 QCM.
-- Grille d'évaluation globale exclue (réservée au formateur).
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : migration 20260524_question_followup.sql appliquée.
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  -- Trouve la formation SST (par slug ou titre)
  select id into v_formation_id
  from public.formations
  where slug = 'sauveteur-secouriste-du-travail'
     or slug ilike '%sst%'
     or titre ilike '%sauveteur%secouriste%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation SST introuvable. Vérifiez le slug dans la table public.formations.';
  end if;

  -- Crée le test
  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation formative SST — Prévention',
    'Évaluation formative de la partie Prévention. Durée 30 min, total 20 points, seuil de validation 15/20. Analyse d''une situation de travail, rédaction d''une remontée d''information et QCM sur le cadre juridique.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- Questions
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    -- ----- EXERCICE 1 : Analyse de situation (atelier maintenance)
    (v_test_id, 1,
     'Exercice 1 — Dans un atelier de maintenance, vous observez : un salarié utilise une meuleuse sans lunettes ; des câbles électriques traînent sur sol humide près d''une machine ; un extincteur est bloqué par des cartons ; une armoire électrique est ouverte et accessible ; l''éclairage est insuffisant. Identifiez au moins 3 dangers présents dans la situation. Pour chacun, précisez qui/quoi est exposé et les dommages possibles.',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 2,
     'Exercice 1 (suite) — Pour les dangers que vous avez identifiés, proposez des actions de prévention concrètes et hiérarchisées (protections collectives avant protections individuelles).',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    -- ----- EXERCICE 2 : Remontée d'information (escabeau endommagé)
    (v_test_id, 3,
     'Exercice 2 — Votre collègue utilise régulièrement un escabeau endommagé (barreau cassé, absence de sabots antidérapants) et refuse de le signaler. Indiquez l''objet du message que vous adressez à votre responsable hiérarchique.',
     'liste', '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     'Exercice 2 (suite) — Rédigez le corps du message à votre responsable : description précise de la situation, risque identifié, proposition de solution concrète, ton professionnel et bienveillant.',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    -- ----- EXERCICE 3 : QCM cadre juridique (5 questions scorables)
    (v_test_id, 5,
     'Dans la chaîne des secours, le SST intervient :',
     'qcm_unique',
     '["Avant l''arrivée des secours spécialisés","À la place des secours spécialisés","Uniquement si le médecin du travail est absent"]'::jsonb,
     null, true,
     '"Avant l''arrivée des secours spécialisés"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 6,
     'Les 9 principes généraux de prévention sont définis par :',
     'qcm_unique',
     '["Le Code du travail","Le règlement intérieur de l''entreprise","L''INRS uniquement"]'::jsonb,
     null, true,
     '"Le Code du travail"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 7,
     'Face à un danger grave et imminent, le salarié peut :',
     'qcm_unique',
     '["Exercer son droit de retrait","Attendre les consignes de son responsable","Continuer à travailler sous sa propre responsabilité"]'::jsonb,
     null, true,
     '"Exercer son droit de retrait"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 8,
     'La démarche de prévention doit privilégier :',
     'qcm_unique',
     '["Les protections collectives avant les protections individuelles","Les protections individuelles en priorité","Les deux de manière strictement égale"]'::jsonb,
     null, true,
     '"Les protections collectives avant les protections individuelles"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 9,
     'Un accident du travail doit être déclaré à l''employeur sous :',
     'qcm_unique',
     '["24 heures","48 heures","5 jours ouvrés","1 semaine"]'::jsonb,
     null, true,
     '"24 heures"'::jsonb,
     '[]'::jsonb);

  raise notice 'OK — "Évaluation formative SST — Prévention" créée (test_id=%) avec 9 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
