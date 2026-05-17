-- =============================================================================
-- Évaluations formatives — Gestes et Postures
-- =============================================================================
-- 3 tests séparés (EF1, EF2, EF3) déclenchés à 3 moments différents de la journée.
-- Kind 'quiz' (correction QCM + score), mention "non éliminatoire" portée par
-- la description.
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : migration 20260524_question_followup.sql appliquée.
-- =============================================================================


-- =============================================================================
-- TEST 1 — EF1 : TMS, anatomie, risques (6 questions)
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  select id into v_formation_id
  from public.formations
  where slug = 'gestes-et-postures'
     or slug ilike '%gestes%postures%'
     or titre ilike '%gestes%postures%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation "Gestes et Postures" introuvable. Vérifiez le slug dans la table public.formations.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'EF1 — TMS, anatomie, risques',
    'Évaluation formative n°1 — à réaliser après le module anatomie (11h10, ~10 min). Non éliminatoire : permet de vérifier la compréhension des mécanismes corporels exposés aux risques.',
    'quiz', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Parmi les structures suivantes, laquelle est la plus exposée lors du port de charges ?', 'qcm_unique',
     '["Les ligaments des poignets","Les disques intervertébraux","Les tendons des épaules","Les muscles du mollet"]'::jsonb,
     null, true, '"Les disques intervertébraux"'::jsonb, '[]'::jsonb),

    (v_test_id, 2, 'Un geste répétitif effectué sans pause est susceptible de provoquer en premier lieu :', 'qcm_unique',
     '["Une fracture osseuse","Un trouble musculo-squelettique (TMS)","Une baisse de la tension artérielle","Une hyperthermie"]'::jsonb,
     null, true, '"Un trouble musculo-squelettique (TMS)"'::jsonb, '[]'::jsonb),

    (v_test_id, 3, 'Quelle contrainte mécanique est la plus importante lorsqu''on se penche en avant avec une charge dans les bras ?', 'qcm_unique',
     '["Compression des vertèbres cervicales","Force musculaire × bras de levier (distance de la charge au rachis)","Pression sur les genoux","Tension des ligaments du pied"]'::jsonb,
     null, true, '"Force musculaire × bras de levier (distance de la charge au rachis)"'::jsonb, '[]'::jsonb),

    (v_test_id, 4, 'Le gainage musculaire ne joue aucun rôle dans la protection du rachis lombaire.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 5, 'Un accident du travail (AT) peut être la conséquence directe de mauvaises postures répétées.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 6, 'La colonne vertébrale comporte 7 vertèbres cervicales, 12 thoraciques et 5 lombaires.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb);

  raise notice 'OK — EF1 créée (test_id=%) avec 6 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;


-- =============================================================================
-- TEST 2 — EF2 : Ergonomie & réglages du poste (4 questions)
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  select id into v_formation_id
  from public.formations
  where slug = 'gestes-et-postures'
     or slug ilike '%gestes%postures%'
     or titre ilike '%gestes%postures%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation "Gestes et Postures" introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'EF2 — Ergonomie & réglages du poste',
    'Évaluation formative n°2 — à réaliser après le module Prévention & ergonomie (14h10, 10-15 min). Vérifie que le stagiaire sait identifier une situation à risque et appliquer les principes d''aménagement du poste.',
    'quiz', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Parmi ces propositions, lesquelles relèvent des principes généraux de prévention ? (2 bonnes réponses)', 'qcm_multiple',
     '["Supprimer le risque à la source","Habituer le corps à travailler en torsion","Organiser le travail pour réduire les manutentions inutiles","Augmenter la cadence pour finir plus tôt"]'::jsonb,
     null, true,
     '["Supprimer le risque à la source","Organiser le travail pour réduire les manutentions inutiles"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 2, 'Un siège réglable suffit à lui seul à prévenir les TMS liés au travail sur écran.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    -- Mise en situation A (Sophie) — 2 questions texte libre
    (v_test_id, 3, 'Mise en situation A — Sophie travaille 7h/jour devant un écran ; son siège est trop bas, son écran est placé sur le côté et son clavier est à 50 cm de son buste. Identifiez les 3 principaux risques posturaux de cette situation.', 'texte_libre',
     '[]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4, 'Mise en situation A — Sophie (suite) : pour chacun des 3 risques identifiés, proposez une correction concrète et immédiatement applicable.', 'texte_libre',
     '[]'::jsonb,
     null, true, null, '[]'::jsonb);

  raise notice 'OK — EF2 créée (test_id=%) avec 4 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;


-- =============================================================================
-- TEST 3 — EF3 : Gestes sécurisés & manutention (6 questions)
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  select id into v_formation_id
  from public.formations
  where slug = 'gestes-et-postures'
     or slug ilike '%gestes%postures%'
     or titre ilike '%gestes%postures%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation "Gestes et Postures" introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'EF3 — Gestes sécurisés & manutention',
    'Évaluation formative n°3 — à réaliser après le module Manutention spécifique (16h25, ~15 min). Vérifie la maîtrise des techniques de protection du dos et de manutention manuelle sécurisée.',
    'quiz', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1, 'Lorsqu''on doit pousser une charge lourde (chariot, transpalette), quelle est la posture recommandée ?', 'qcm_unique',
     '["Se pencher en avant dos voûté pour prendre appui","Se placer dos à la charge et la pousser avec les fesses","Fléchir légèrement les genoux, dos droit, utiliser le poids du corps","Prendre la charge par le haut et tirer vers soi"]'::jsonb,
     null, true,
     '"Fléchir légèrement les genoux, dos droit, utiliser le poids du corps"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 2, 'Quelle combinaison représente le risque TMS le plus élevé ?', 'qcm_unique',
     '["Travail assis + environnement chaud","Posture statique prolongée + geste répétitif + force élevée","Port de charge ponctuel + bonne posture","Alternance assis/debout + pauses régulières"]'::jsonb,
     null, true,
     '"Posture statique prolongée + geste répétitif + force élevée"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 3, 'Il est acceptable de porter une charge lourde en tournant le tronc si la distance est courte.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 4, 'Pour déplacer une charge, il est préférable de pousser plutôt que de tirer.', 'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    -- Mise en situation B (Marc) — 2 questions texte libre
    (v_test_id, 5, 'Mise en situation B — Marc doit déplacer une caisse de 18 kg depuis le sol jusqu''à une étagère à hauteur de taille, en contournant un obstacle. Décrivez la technique sécurisée de la phase de levée (position de départ, gainage, charge proche du corps, absence de torsion).', 'texte_libre',
     '[]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6, 'Mise en situation B — Marc (suite) : décrivez la phase de déplacement (contournement de l''obstacle) puis la dépose contrôlée de la caisse.', 'texte_libre',
     '[]'::jsonb,
     null, true, null, '[]'::jsonb);

  raise notice 'OK — EF3 créée (test_id=%) avec 6 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
