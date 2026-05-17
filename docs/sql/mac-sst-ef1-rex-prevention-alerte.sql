-- =============================================================================
-- Évaluation Formative N°1 — MAC SST (REX • Prévention • Alerte)
-- =============================================================================
-- Formation : Maintien et Actualisation des Compétences Sauveteur Secouriste du Travail.
-- 13 questions : 4 contexte (positionnement personnel) + 4 texte libre (analyse de
-- situation et messages) + 5 QCM scorables.
-- Q1 et Q2 utilisent le follow-up sur "Oui" pour récupérer le récit / le
-- résultat du signalement (cas conditionnel "Si oui, …").
-- Type 'quiz' (correction sur les QCM).
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : migration 20260524_question_followup.sql appliquée.
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  -- Trouve la formation MAC SST (par slug ou titre)
  select id into v_formation_id
  from public.formations
  where slug = 'mac-sst'
     or slug ilike '%mac-sst%'
     or slug ilike '%mac%sst%'
     or titre ilike '%maintien%actualisation%sst%'
     or titre ilike '%mac sst%'
     or titre ilike '%mac-sst%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation MAC SST introuvable. Vérifiez le slug dans la table public.formations.';
  end if;

  -- Crée le test
  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'EF1 — REX, Prévention, Alerte',
    'Évaluation formative n°1 du MAC SST. Modules 1 & 3 : retour d''expérience terrain, prévention des risques, alerte et information de la hiérarchie. Durée 30 min, total 20 points.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- Questions
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    -- ----- PARTIE 1 : Retour d'expérience terrain (sans bonne réponse)
    (v_test_id, 1,
     'Depuis votre certification SST initiale ou votre dernier MAC SST, avez-vous été confronté(e) à une situation d''accident ou de malaise sur votre lieu de travail ?',
     'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null,
     '["Oui"]'::jsonb),  -- follow-up : décrire situation + gestes + différences

    (v_test_id, 2,
     'Avez-vous déjà eu à signaler une situation dangereuse dans votre entreprise ?',
     'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null,
     '["Oui"]'::jsonb),  -- follow-up : résultat du signalement

    (v_test_id, 3,
     'Selon vous, quelles sont les principales difficultés rencontrées par un SST dans l''exercice de ses fonctions ? (cochez jusqu''à 3 réponses)',
     'qcm_multiple',
     '["Manque de confiance en soi pour intervenir","Peur de « mal faire » et d''aggraver la situation","Difficulté à réaliser l''alerte efficacement","Oubli des gestes techniques par manque de pratique","Mauvaise connaissance des ressources disponibles dans l''entreprise","Manque de soutien de la hiérarchie"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     'Votre entreprise dispose-t-elle d''un plan d''organisation des secours à jour ?',
     'qcm_unique',
     '["Oui, je le connais","Oui, mais je ne le connais pas bien","Non / Je ne sais pas"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ----- PARTIE 2A : Analyse de situation (texte libre)
    (v_test_id, 5,
     'Exercice 2A — Scénario : dans l''atelier de production, un cariste vient de percuter une palette avec son chariot. La palette est tombée, libérant des bidons de solvant. L''opérateur au sol semble blessé. Deux collègues travaillent à proximité sans protection respiratoire. L''extincteur de la zone est posé à même le sol, caché derrière une étagère. → Identifiez les 3 dangers principaux et indiquez qui est exposé pour chacun.',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 6,
     'Exercice 2A (suite) — Pour chacun des 3 dangers identifiés, indiquez la mesure de protection immédiate à mettre en œuvre.',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 7,
     'Exercice 2A — Rédigez le message d''alerte que vous transmettriez aux secours pour l''opérateur blessé. Précisez : d''où vous appelez, la localisation de l''accident, la nature de l''accident, l''état de la victime, les gestes déjà effectués, le nombre de victimes.',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     'Exercice 2A — Quelle information transmettez-vous à votre hiérarchie concernant l''extincteur de la zone ? (rédigez le message en 2-3 lignes)',
     'texte_libre', '[]'::jsonb, null, true, null, '[]'::jsonb),

    -- ----- PARTIE 2B : QCM Alerte (5 questions scorables)
    (v_test_id, 9,
     'En cas d''accident en entreprise, qui peut décider de ne pas appeler les secours extérieurs ?',
     'qcm_unique',
     '["Le SST si les blessures semblent légères","La hiérarchie, selon le plan d''organisation des secours","Personne — les secours extérieurs doivent toujours être alertés","Le médecin du travail"]'::jsonb,
     null, true,
     '"Personne — les secours extérieurs doivent toujours être alertés"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 10,
     'Lorsque vous alertez le 15 ou le 18, à quel moment raccrochez-vous ?',
     'qcm_unique',
     '["Dès que vous avez donné toutes les informations","Quand le régulateur vous le demande","Après 5 minutes maximum","Dès que les secours arrivent sur place"]'::jsonb,
     null, true,
     '"Quand le régulateur vous le demande"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 11,
     'Le numéro 114 (SMS urgence) est destiné à :',
     'qcm_unique',
     '["Aux appels depuis l''étranger","Aux personnes sourdes, malentendantes ou aphasiques","Aux urgences psychiatriques uniquement","Au signalement de situations dangereuses non urgentes"]'::jsonb,
     null, true,
     '"Aux personnes sourdes, malentendantes ou aphasiques"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 12,
     'Dans le cadre de la prévention, informer sa hiérarchie d''une situation dangereuse est :',
     'qcm_unique',
     '["Facultatif si le danger ne semble pas immédiat","Une obligation légale du SST dans son rôle de prévention","Le rôle exclusif du CHSCT / CSE","Une démarche utile seulement en cas d''accident avéré"]'::jsonb,
     null, true,
     '"Une obligation légale du SST dans son rôle de prévention"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 13,
     'Parmi ces éléments, lequel NE fait PAS partie du contenu obligatoire d''un message d''alerte ?',
     'qcm_unique',
     '["La localisation précise","Le nombre de victimes","Le nom du responsable hiérarchique","La nature de l''accident"]'::jsonb,
     null, true,
     '"Le nom du responsable hiérarchique"'::jsonb,
     '[]'::jsonb);

  raise notice 'OK — EF1 MAC SST créée (test_id=%) avec 13 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
