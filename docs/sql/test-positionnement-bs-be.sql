-- =============================================================================
-- Test de Positionnement — Habilitation Électrique BS / BE Manœuvre (SECU-05)
-- =============================================================================
-- Source : PDF Test_positionnement_BS_BE.docx.pdf (V1CA-11/2025)
-- 32 questions — 7 sections : auto-évaluation (échelle) + 6 sections QCM/texte.
-- Non noté — non éliminatoire.
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
    'Permet d''identifier le niveau de connaissances avant la formation BS / BE Manœuvre pour adapter l''approche pédagogique. Durée estimée : 15 min. Non noté.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ============================================================
  -- SECTION A — AUTO-ÉVALUATION (Q1-Q4 — échelle 1 à 5)
  -- ============================================================
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1,
     'Comment évaluez-vous votre connaissance générale de l''électricité BT ? (1 = Aucune connaissance — 5 = Très à l''aise)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 2,
     'Maîtrisez-vous la loi d''Ohm et les calculs électriques de base ? (1 = Aucune connaissance — 5 = Très à l''aise)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 3,
     'Comment évaluez-vous votre connaissance de la réglementation NFC 18-510 ? (1 = Aucune connaissance — 5 = Très à l''aise)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 4,
     'Avez-vous déjà réalisé des interventions électriques en milieu professionnel ? (1 = Aucune — 5 = Très régulièrement)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

  -- ============================================================
  -- SECTION B — NOTIONS ÉLÉMENTAIRES D'ÉLECTRICITÉ (Q5-Q10)
  -- ============================================================
    (v_test_id, 5,
     'Quelle est l''unité de mesure de la tension électrique ?',
     'qcm_unique',
     '["L''ampère (A)","Le volt (V)","L''ohm (Ω)","Le watt (W)"]'::jsonb,
     null, true, '"Le volt (V)"'::jsonb, '[]'::jsonb),

    (v_test_id, 6,
     'La loi d''Ohm relie quelles grandeurs électriques ?',
     'qcm_unique',
     '["Tension, intensité et résistance","Puissance, énergie et temps","Fréquence, période et tension","Je ne sais pas"]'::jsonb,
     null, true, '"Tension, intensité et résistance"'::jsonb, '[]'::jsonb),

    (v_test_id, 7,
     'Un circuit a une tension de 230 V et une résistance de 46 Ω. Quelle est l''intensité qui le traverse ? Donnez la valeur en ampères et la formule utilisée.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     'Quel est le domaine de tension de la basse tension (BT) en courant alternatif ?',
     'qcm_unique',
     '["De 0 à 50 V","De 50 V à 1 000 V","De 1 000 V à 50 000 V","Au-delà de 50 000 V"]'::jsonb,
     null, true, '"De 50 V à 1 000 V"'::jsonb, '[]'::jsonb),

    (v_test_id, 9,
     'Parmi ces matériels, lesquels font partie d''une installation BT ? (Plusieurs réponses possibles)',
     'qcm_multiple',
     '["Disjoncteur de branchement","Tableau de répartition","Fusibles BT","Transformateur HTA/BT"]'::jsonb,
     null, true,
     '["Disjoncteur de branchement","Tableau de répartition","Fusibles BT"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 10,
     'Le courant continu est utilisé exclusivement dans les réseaux de distribution publique en France.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

  -- ============================================================
  -- SECTION C — RISQUES ÉLECTRIQUES ET RÉGLEMENTATION (Q11-Q15)
  -- ============================================================
    (v_test_id, 11,
     'À partir de quelle valeur d''intensité le courant alternatif est-il considéré comme dangereux pour l''être humain ?',
     'qcm_unique',
     '["1 mA","10 mA","30 mA","100 mA"]'::jsonb,
     null, true, '"30 mA"'::jsonb, '[]'::jsonb),

    (v_test_id, 12,
     'Qu''est-ce qui aggrave les effets du courant sur le corps humain ? (Plusieurs réponses possibles)',
     'qcm_multiple',
     '["La durée d''exposition","La peau humide","Le chemin du courant (main-main, main-pied…)","Toutes ces réponses"]'::jsonb,
     null, true,
     '["La durée d''exposition","La peau humide","Le chemin du courant (main-main, main-pied…)"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 13,
     'Quelle est la différence entre le symbole BS et le symbole BE Manœuvre ?',
     'qcm_unique',
     '["BS : interventions élémentaires de remplacement/raccordement – BE : manœuvres sur appareillage","BS : travaux HT – BE : travaux BT","Les deux symboles permettent les mêmes opérations","Je ne sais pas"]'::jsonb,
     null, true,
     '"BS : interventions élémentaires de remplacement/raccordement – BE : manœuvres sur appareillage"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 14,
     'Une habilitation électrique est délivrée par un organisme de formation certificateur.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 15,
     'Quelle norme encadre les habilitations électriques en France ?',
     'qcm_unique',
     '["NF EN 50110","NFC 18-510","ISO 45001","NF C 15-100"]'::jsonb,
     null, true, '"NFC 18-510"'::jsonb, '[]'::jsonb),

  -- ============================================================
  -- SECTION D — TRAVAIL EN SÉCURITÉ ET EPI (Q16-Q20)
  -- ============================================================
    (v_test_id, 16,
     'Quels EPI sont indispensables pour une intervention BS ? (Plusieurs réponses possibles)',
     'qcm_multiple',
     '["Gants isolants de classe adaptée","Lunettes de protection","Chaussures de sécurité isolantes","Casque anti-bruit"]'::jsonb,
     null, true,
     '["Gants isolants de classe adaptée","Lunettes de protection","Chaussures de sécurité isolantes"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 17,
     'Avant d''utiliser des gants isolants, il est nécessaire de vérifier leur classe de protection et leur intégrité.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 18,
     'Qu''est-ce qu''une VAT ?',
     'qcm_unique',
     '["Une Vérification d''Aptitude au Travail","Une Vérification d''Absence de Tension","Un Visa d''Autorisation de Travaux","Je ne sais pas"]'::jsonb,
     null, true, '"Une Vérification d''Absence de Tension"'::jsonb, '[]'::jsonb),

    (v_test_id, 19,
     'Les 5 règles de sécurité électrique (consignation) consistent à :',
     'qcm_unique',
     '["Séparer – Condamner – Identifier – Vérifier l''absence de tension – Mettre à la terre et en court-circuit","Baliser – Isoler – Mesurer – Remplacer – Remettre sous tension","Couper – Vérifier – Travailler – Remplacer – Rédiger","Je ne sais pas"]'::jsonb,
     null, true,
     '"Séparer – Condamner – Identifier – Vérifier l''absence de tension – Mettre à la terre et en court-circuit"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 20,
     'Décrivez les vérifications que vous effectueriez avant d''utiliser un appareil de mesure électrique.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ============================================================
  -- SECTION E — INTERVENTIONS ET MANŒUVRES (Q21-Q25)
  -- ============================================================
    (v_test_id, 21,
     'Avant de remplacer un fusible BT, quelle est la première action obligatoire ?',
     'qcm_unique',
     '["Mettre l''installation hors tension et consigner","Remplacer directement avec les EPI adaptés","Appeler le chargé d''exploitation pour accord verbal","Aucune précaution particulière n''est nécessaire"]'::jsonb,
     null, true, '"Mettre l''installation hors tension et consigner"'::jsonb, '[]'::jsonb),

    (v_test_id, 22,
     'Un raccordement peut être réalisé sous tension si l''intervenant porte ses EPI.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 23,
     'Qu''est-ce qu''un ordre de manœuvre ?',
     'qcm_unique',
     '["Un document autorisant et décrivant la manœuvre à réaliser","Un ordre verbal donné par le chef d''équipe","Une fiche de satisfaction de l''intervention","Je ne sais pas"]'::jsonb,
     null, true, '"Un document autorisant et décrivant la manœuvre à réaliser"'::jsonb, '[]'::jsonb),

    (v_test_id, 24,
     'Lors d''un raccordement hors tension, quelles vérifications sont nécessaires avant remise sous tension ? (Plusieurs réponses possibles)',
     'qcm_multiple',
     '["Vérifier la conformité du raccordement","S''assurer de l''absence de personnel dans la zone","Retirer les dispositifs de condamnation","Toutes ces réponses"]'::jsonb,
     null, true,
     '["Vérifier la conformité du raccordement","S''assurer de l''absence de personnel dans la zone","Retirer les dispositifs de condamnation"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 25,
     'Décrivez les étapes que vous suivriez pour remplacer un fusible en toute sécurité.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ============================================================
  -- SECTION F — CONDUITE À TENIR EN CAS D'ACCIDENT (Q26-Q29)
  -- ============================================================
    (v_test_id, 26,
     'Un collègue est électrisé et tient un câble sous tension. Votre première action est :',
     'qcm_unique',
     '["Saisir le collègue et le tirer en arrière","Couper immédiatement l''alimentation électrique","Appeler le SAMU (15) sans intervenir physiquement","Lui verser de l''eau pour le refroidir"]'::jsonb,
     null, true, '"Couper immédiatement l''alimentation électrique"'::jsonb, '[]'::jsonb),

    (v_test_id, 27,
     'On peut utiliser un extincteur à eau pour éteindre un feu sur un tableau électrique sous tension.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 28,
     'Quel extincteur est adapté à un feu d''origine électrique ?',
     'qcm_unique',
     '["CO2 (dioxyde de carbone)","Poudre BC","Eau pulvérisée","CO2 et Poudre BC sont tous les deux adaptés"]'::jsonb,
     null, true, '"CO2 et Poudre BC sont tous les deux adaptés"'::jsonb, '[]'::jsonb),

    (v_test_id, 29,
     'Décrivez la conduite à tenir si vous découvrez un collègue victime d''un accident électrique en milieu de travail.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ============================================================
  -- SECTION G — EXPÉRIENCE ET ATTENTES (Q30-Q32)
  -- ============================================================
    (v_test_id, 30,
     'Avez-vous déjà suivi une formation à l''habilitation électrique ?',
     'qcm_unique',
     '["Non, c''est ma première formation","Oui, habilitation H0/B0 uniquement","Oui, BS ou BE dans les 3 dernières années","Oui, mais il y a plus de 3 ans"]'::jsonb,
     null, true, null,
     '["Oui, habilitation H0/B0 uniquement","Oui, BS ou BE dans les 3 dernières années","Oui, mais il y a plus de 3 ans"]'::jsonb),

    (v_test_id, 31,
     'Décrivez les types d''interventions ou manœuvres électriques que vous réalisez ou serez amené(e) à réaliser.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 32,
     'Quelles sont vos principales attentes pour cette formation ?',
     'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Test de positionnement Habilitation BS/BE Manœuvre créé (test_id=%) avec 32 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
