-- =============================================================================
-- Évaluation des Acquis — Habilitation Électrique H0 / B0 (SECU-06)
-- =============================================================================
-- 1 seul test : évaluation des acquis de fin de formation (pas de positionnement).
-- Barème original : 100 points, seuil 70/100.
-- Partie 4 (mise en situation pratique — grille formateur, 30 pts) exclue.
-- 25 questions : Parties 1 à 3 uniquement.
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
     or slug ilike '%secu06%'
     or titre ilike '%habilitation%h0%b0%'
     or titre ilike '%habilitation%électrique%h0%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Habilitation H0/B0 introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation des acquis Habilitation Électrique H0 / B0',
    'Évaluation certificative de fin de formation (SECU-06). Barème 100 points, seuil de validation 70/100. Durée 25 min, documents interdits. 3 parties écrites : réglementation et habilitation (25 pts), risques électriques et prévention (35 pts), notions élémentaires d''électricité (10 pts). La mise en situation pratique (30 pts) est évaluée par le formateur en présentiel.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ============================================================
  -- PARTIE 1 — RÉGLEMENTATION ET HABILITATION (Q1-Q9)
  -- ============================================================
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1,
     'Quel texte réglementaire encadre les habilitations électriques en France ?',
     'qcm_unique',
     '["La norme ISO 45001","Le Décret du 14 novembre 1988 (version consolidée) et la publication NFC 18-510","L''arrêté du 26 décembre 2011","Le Code du travail article L.4121-1 uniquement"]'::jsonb,
     null, true,
     '"Le Décret du 14 novembre 1988 (version consolidée) et la publication NFC 18-510"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 2,
     'L''habilitation électrique est délivrée par un organisme de certification externe.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 3,
     'Qu''est-ce que l''habilitation électrique ?',
     'qcm_unique',
     '["Un diplôme reconnu par l''État","La reconnaissance par l''employeur de la capacité d''une personne à effectuer des opérations en sécurité","Une autorisation délivrée par l''inspection du travail","Un certificat de compétence délivré par l''INRS"]'::jsonb,
     null, true,
     '"La reconnaissance par l''employeur de la capacité d''une personne à effectuer des opérations en sécurité"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 4,
     'Quelle est la périodicité recommandée par la NFC 18-510 pour le recyclage de l''habilitation ?',
     'qcm_unique',
     '["Tous les ans","Tous les 3 ans","Tous les 5 ans","Uniquement après un accident"]'::jsonb,
     null, true, '"Tous les 3 ans"'::jsonb, '[]'::jsonb),

    (v_test_id, 5,
     'Le symbole B0 autorise le titulaire à réaliser des travaux électriques sous tension.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 6,
     'Quelles sont les limites d''intervention pour une habilitation H0V / B0V ?',
     'qcm_unique',
     '["Réaliser des travaux de câblage en armoire HT","Travailler à proximité de pièces nues sous tension, sans y toucher","Intervenir librement sur toute installation BT","Effectuer des raccordements hors tension en autonomie"]'::jsonb,
     null, true,
     '"Travailler à proximité de pièces nues sous tension, sans y toucher"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 7,
     'Associez chaque symbole à sa définition : B0 / H0 / B0V / H0V — à associer avec : A. Exécutant de travaux d''ordre non électrique en domaine BT | B. Exécutant de travaux d''ordre non électrique en domaine HT | C. Exécutant au voisinage de pièces nues sous tension en BT | D. Exécutant au voisinage de pièces nues sous tension en HT.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     'Qui est responsable de la délivrance du titre d''habilitation au salarié ?',
     'qcm_unique',
     '["Le formateur","L''organisme de formation","L''employeur","L''inspection du travail"]'::jsonb,
     null, true, '"L''employeur"'::jsonb, '[]'::jsonb),

    (v_test_id, 9,
     'Citez deux obligations de l''employeur en matière d''habilitation électrique.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ============================================================
  -- PARTIE 2 — RISQUES ÉLECTRIQUES ET PRÉVENTION (Q10-Q21)
  -- ============================================================
    (v_test_id, 10,
     'À partir de quelle valeur d''intensité le courant alternatif est-il considéré comme pouvant provoquer une fibrillation cardiaque ?',
     'qcm_unique',
     '["1 mA","10 mA","30 mA","75 mA"]'::jsonb,
     null, true, '"30 mA"'::jsonb, '[]'::jsonb),

    (v_test_id, 11,
     'Parmi ces facteurs, lesquels aggravent les effets du courant électrique sur le corps humain ? (plusieurs réponses)',
     'qcm_multiple',
     '["La durée d''exposition au courant","Le chemin du courant dans le corps (main-main, main-pied…)","La résistance cutanée (peau humide = résistance réduite)","Le port de chaussures de sécurité isolantes"]'::jsonb,
     null, true,
     '["La durée d''exposition au courant","Le chemin du courant dans le corps (main-main, main-pied…)","La résistance cutanée (peau humide = résistance réduite)"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 12,
     'Distinguez électrisation et électrocution en complétant les définitions.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 13,
     'La protection contre les contacts directs consiste à :',
     'qcm_unique',
     '["Mettre l''installation à la terre","Isoler, éloigner ou protéger les pièces nues sous tension","Installer un disjoncteur différentiel 30 mA","Porter des gants isolants en toutes circonstances"]'::jsonb,
     null, true,
     '"Isoler, éloigner ou protéger les pièces nues sous tension"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 14,
     'Un disjoncteur différentiel 30 mA protège contre les contacts indirects.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 15,
     'Quelle est la première action avant toute intervention à proximité d''une installation électrique ?',
     'qcm_unique',
     '["Mettre ses EPI et commencer les travaux","Prévenir verbalement ses collègues","S''assurer que l''installation est hors tension et consignée","Appeler le chargé de travaux"]'::jsonb,
     null, true,
     '"S''assurer que l''installation est hors tension et consignée"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 16,
     'Quels EPI sont adaptés à une habilitation B0V / H0V ? (plusieurs réponses)',
     'qcm_multiple',
     '["Gants isolants de classe appropriée","Casque de protection avec écran facial","Chaussures de sécurité isolantes","Lunettes de protection"]'::jsonb,
     null, true,
     '["Gants isolants de classe appropriée","Chaussures de sécurité isolantes","Lunettes de protection"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 17,
     'Décrivez les 5 étapes de la consignation électrique dans l''ordre.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 18,
     'Qu''est-ce qu''une VAT et pourquoi est-elle indispensable ? Donnez sa signification et expliquez pourquoi elle est obligatoire.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 19,
     'Lors d''un incendie sur un tableau électrique, quelle action est prioritaire ?',
     'qcm_unique',
     '["Utiliser un extincteur à eau pour éteindre rapidement","Couper l''alimentation électrique puis utiliser un extincteur CO2 ou poudre BC","Évacuer sans intervenir et appeler les secours uniquement","Arroser le tableau depuis une distance de sécurité"]'::jsonb,
     null, true,
     '"Couper l''alimentation électrique puis utiliser un extincteur CO2 ou poudre BC"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 20,
     'Quel est le numéro d''appel en cas d''accident du travail avec victime ?',
     'qcm_unique',
     '["Le 17 (Police)","Le 15 (SAMU) ou le 18 (Pompiers) ou le 112 (numéro européen)","Le numéro de l''employeur uniquement","Le 3114"]'::jsonb,
     null, true,
     '"Le 15 (SAMU) ou le 18 (Pompiers) ou le 112 (numéro européen)"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 21,
     'Décrivez la conduite à tenir si vous découvrez un collègue victime d''un contact avec un câble sous tension.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ============================================================
  -- PARTIE 3 — NOTIONS ÉLÉMENTAIRES D'ÉLECTRICITÉ (Q22-Q25)
  -- ============================================================
    (v_test_id, 22,
     'Associez chaque grandeur électrique à son unité de mesure et son symbole — pour : Tension, Intensité, Résistance, Puissance.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 23,
     'Dans quel domaine de tension se situe la basse tension (BT) en courant alternatif ?',
     'qcm_unique',
     '["0 à 50 V","50 V à 1 000 V","1 000 V à 50 000 V","Au-delà de 50 000 V"]'::jsonb,
     null, true, '"50 V à 1 000 V"'::jsonb, '[]'::jsonb),

    (v_test_id, 24,
     'Qu''est-ce que la loi d''Ohm ? Donnez la formule.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 25,
     'Le courant continu (DC) est utilisé pour le réseau de distribution électrique domestique en France.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb);

  raise notice 'OK — Évaluation des acquis Habilitation H0/B0 créée (test_id=%) avec 25 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
