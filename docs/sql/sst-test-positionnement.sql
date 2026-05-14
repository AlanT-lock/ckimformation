-- =============================================================================
-- Test de positionnement — Sauveteur Secouriste du Travail (SST)
-- =============================================================================
-- 22 questions (Q5 scindée en 3 sous-questions).
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : migrations jusqu'à 20260524_question_followup.sql appliquées.
-- =============================================================================

do $$
declare
  v_formation_id uuid;
  v_test_id      uuid;
begin
  -- 1. Trouve la formation SST (par slug ou titre)
  select id into v_formation_id
  from public.formations
  where slug = 'sauveteur-secouriste-du-travail'
     or slug ilike '%sst%'
     or titre ilike '%sauveteur%secouriste%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation SST introuvable. Vérifiez le slug dans la table public.formations.';
  end if;

  -- 2. Crée le test (un seul "Test de positionnement" par formation)
  --    Si vous voulez le ré-injecter : supprimez d'abord la ligne existante.
  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Test de positionnement SST',
    'Évalue les connaissances avant la formation Sauveteur Secouriste du Travail. Pas de note éliminatoire — durée conseillée 20 minutes.',
    'quiz',
    null,
    true
  )
  returning id into v_test_id;

  -- 3. Insère les 22 questions dans l'ordre
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    -- Q1
    (v_test_id, 1, 'Que signifie SST ?', 'qcm_unique',
     '["Secours de Sécurité au Travail","Sauveteur Secouriste du Travail","Service de Santé au Travail","Sécurité et Soins Techniques"]'::jsonb,
     null, true,
     '"Sauveteur Secouriste du Travail"'::jsonb,
     '[]'::jsonb),

    -- Q2
    (v_test_id, 2, 'Le rôle du SST est : (plusieurs réponses possibles)', 'qcm_multiple',
     '["Porter secours à toute victime d''un accident du travail ou d''un malaise","Remplacer le médecin du travail","Être acteur de la prévention dans son entreprise","Prescrire des médicaments en cas de besoin"]'::jsonb,
     null, true,
     '["Porter secours à toute victime d''un accident du travail ou d''un malaise","Être acteur de la prévention dans son entreprise"]'::jsonb,
     '[]'::jsonb),

    -- Q3
    (v_test_id, 3, 'Le certificat SST est valable :', 'qcm_unique',
     '["1 an","2 ans","5 ans","À vie"]'::jsonb,
     null, true,
     '"2 ans"'::jsonb,
     '[]'::jsonb),

    -- Q4 (positionnement, pas de bonne réponse, follow-up si Oui)
    (v_test_id, 4, 'Avez-vous déjà suivi une formation aux premiers secours ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true,
     null,
     '["Oui"]'::jsonb),

    -- Q5a (scindée — trousses de secours)
    (v_test_id, 5, 'Dans votre entreprise, savez-vous où se trouvent les trousses de secours ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true,
     null,
     '[]'::jsonb),

    -- Q5b (scindée — défibrillateur, 3 options)
    (v_test_id, 6, 'Dans votre entreprise, savez-vous où se trouve le défibrillateur ?', 'qcm_unique',
     '["Oui","Non","Il n''y en a pas"]'::jsonb,
     null, true,
     null,
     '[]'::jsonb),

    -- Q5c (scindée — numéros d'urgence)
    (v_test_id, 7, 'Dans votre entreprise, savez-vous où se trouvent les numéros d''urgence ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true,
     null,
     '[]'::jsonb),

    -- Q6 (texte libre)
    (v_test_id, 8, 'Quels sont les numéros d''urgence en France ? (citez-en au moins 2)', 'texte_libre',
     '[]'::jsonb,
     null, true,
     null,
     '[]'::jsonb),

    -- Q7
    (v_test_id, 9, 'Qu''est-ce qu''un danger dans le milieu professionnel ?', 'qcm_unique',
     '["Une situation qui a déjà provoqué un accident","Une propriété intrinsèque capable de causer un dommage","Un événement imprévu","Une machine défectueuse uniquement"]'::jsonb,
     null, true,
     '"Une propriété intrinsèque capable de causer un dommage"'::jsonb,
     '[]'::jsonb),

    -- Q8
    (v_test_id, 10, 'Parmi ces situations, lesquelles présentent des risques ? (plusieurs réponses possibles)', 'qcm_multiple',
     '["Un câble électrique qui traîne au sol","Un sol mouillé sans signalisation","Un carton posé en hauteur","Une chaise de bureau"]'::jsonb,
     null, true,
     '["Un câble électrique qui traîne au sol","Un sol mouillé sans signalisation","Un carton posé en hauteur"]'::jsonb,
     '[]'::jsonb),

    -- Q9
    (v_test_id, 11, 'Face à une situation dangereuse dans votre entreprise, que devez-vous faire ?', 'qcm_unique',
     '["Attendre qu''un accident se produise pour agir","Signaler la situation à votre responsable","Intervenir seul pour corriger le problème","Ne rien faire si cela ne vous concerne pas directement"]'::jsonb,
     null, true,
     '"Signaler la situation à votre responsable"'::jsonb,
     '[]'::jsonb),

    -- Q10 (positionnement, follow-up si Oui)
    (v_test_id, 12, 'Avez-vous déjà été témoin d''un accident du travail dans votre entreprise ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true,
     null,
     '["Oui"]'::jsonb),

    -- Q11 (positionnement, follow-up si Oui)
    (v_test_id, 13, 'Connaissez-vous les principaux risques de votre poste de travail ?', 'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true,
     null,
     '["Oui"]'::jsonb),

    -- Q12
    (v_test_id, 14, 'Que signifie EPI ?', 'qcm_unique',
     '["Équipement de Protection Individuelle","Espace de Prévention Incendie","Évaluation des Pratiques Individuelles","Je ne sais pas"]'::jsonb,
     null, true,
     '"Équipement de Protection Individuelle"'::jsonb,
     '[]'::jsonb),

    -- Q13
    (v_test_id, 15, 'Avant de porter secours à une victime, vous devez :', 'qcm_unique',
     '["Appeler immédiatement les secours","Protéger la zone pour éviter un suraccident","Déplacer systématiquement la victime","Commencer directement les gestes de secours"]'::jsonb,
     null, true,
     '"Protéger la zone pour éviter un suraccident"'::jsonb,
     '[]'::jsonb),

    -- Q14
    (v_test_id, 16, 'Pour vérifier si une victime est consciente, vous devez :', 'qcm_unique',
     '["Lui poser des questions simples et la stimuler doucement","La secouer vigoureusement","Lui donner une claque","Attendre qu''elle se manifeste"]'::jsonb,
     null, true,
     '"Lui poser des questions simples et la stimuler doucement"'::jsonb,
     '[]'::jsonb),

    -- Q15
    (v_test_id, 17, 'Qu''est-ce que la PLS ?', 'qcm_unique',
     '["Position Latérale de Sécurité","Protection Légale de Sauvetage","Procédure de Levée des Secours","Je ne sais pas"]'::jsonb,
     null, true,
     '"Position Latérale de Sécurité"'::jsonb,
     '[]'::jsonb),

    -- Q16
    (v_test_id, 18, 'Dans quel(s) cas utilise-t-on la PLS ? (plusieurs réponses possibles)', 'qcm_multiple',
     '["Victime inconsciente qui respire","Victime consciente qui saigne","Victime en arrêt cardiaque","Victime inconsciente qui ne respire pas"]'::jsonb,
     null, true,
     '["Victime inconsciente qui respire"]'::jsonb,
     '[]'::jsonb),

    -- Q17
    (v_test_id, 19, 'Quelles informations devez-vous donner lors d''un appel aux secours ? (plusieurs réponses possibles)', 'qcm_multiple',
     '["Le numéro de téléphone d''où vous appelez","La localisation précise de l''accident","Le nombre de victimes et leur état","Votre nom et prénom uniquement"]'::jsonb,
     null, true,
     '["Le numéro de téléphone d''où vous appelez","La localisation précise de l''accident","Le nombre de victimes et leur état"]'::jsonb,
     '[]'::jsonb),

    -- Q18 (3 options)
    (v_test_id, 20, 'Qui raccroche en premier lors d''un appel aux secours ?', 'qcm_unique',
     '["Vous, dès que vous avez donné les informations","Le secouriste qui a pris l''appel","Cela n''a pas d''importance"]'::jsonb,
     null, true,
     '"Le secouriste qui a pris l''appel"'::jsonb,
     '[]'::jsonb),

    -- Q19
    (v_test_id, 21, 'Face à une victime en arrêt cardiaque, que faut-il faire ? (plusieurs réponses possibles)', 'qcm_multiple',
     '["Appeler les secours","Commencer le massage cardiaque","Utiliser un défibrillateur si disponible","Mettre la victime en PLS"]'::jsonb,
     null, true,
     '["Appeler les secours","Commencer le massage cardiaque","Utiliser un défibrillateur si disponible"]'::jsonb,
     '[]'::jsonb),

    -- Q20
    (v_test_id, 22, 'Pour arrêter un saignement abondant, la première action est :', 'qcm_unique',
     '["Poser un garrot","Comprimer directement la plaie","Nettoyer la plaie","Surélever le membre qui saigne"]'::jsonb,
     null, true,
     '"Comprimer directement la plaie"'::jsonb,
     '[]'::jsonb);

  raise notice 'OK — Test SST créé (id=%) avec 22 questions sur formation id=%.', v_test_id, v_formation_id;
end $$;
