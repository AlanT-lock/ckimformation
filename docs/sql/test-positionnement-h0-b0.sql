-- =============================================================================
-- Test de Positionnement — Habilitation Électrique H0 / B0 (SECU-06)
-- =============================================================================
-- Source : PDF Test_positionnement_H0B0.docx.pdf (V1CA-11/2025)
-- 22 questions — 6 sections.
-- Non noté — non éliminatoire. Durée estimée : 10 min.
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
     or titre ilike '%habilitation%h0%b0%'
     or titre ilike '%habilitation%électrique%h0%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Habilitation H0/B0 introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Test de positionnement Habilitation Électrique H0 / B0',
    'Permet d''identifier le niveau de connaissances avant la formation H0/B0 pour adapter l''approche pédagogique. Non noté. Durée estimée : 10 min.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ============================================================
  -- SECTION A — AUTO-ÉVALUATION (Q1-Q3, échelle 1-5)
  -- ============================================================
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1,
     'Comment évaluez-vous votre connaissance du risque électrique ? (1 = Aucune connaissance — 5 = Très à l''aise)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 2,
     'Comment évaluez-vous votre maîtrise des gestes de premiers secours face à un accident électrique ? (1 = Aucune connaissance — 5 = Très à l''aise)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 3,
     'Dans quelle mesure connaissez-vous la réglementation en matière d''habilitation électrique (NFC 18-510) ? (1 = Aucune connaissance — 5 = Très à l''aise)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

  -- ============================================================
  -- SECTION B — RÉGLEMENTATION ET HABILITATION (Q4-Q7)
  -- ============================================================
    (v_test_id, 4,
     'Quel texte réglementaire régit les habilitations électriques en France ? (Plusieurs réponses possibles)',
     'qcm_multiple',
     '["Le Code du travail article L.4121-1","Le Décret du 14 novembre 1988 (version consolidée)","La norme NFC 18-510 / UTE C 18-510","Je ne sais pas"]'::jsonb,
     null, true,
     '["Le Décret du 14 novembre 1988 (version consolidée)","La norme NFC 18-510 / UTE C 18-510"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 5,
     'L''habilitation électrique est délivrée par un organisme de formation externe.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 6,
     'Quelle est la périodicité recommandée pour le recyclage de l''habilitation électrique ?',
     'qcm_unique',
     '["Tous les ans","Tous les 3 ans","Tous les 5 ans","Uniquement en cas d''accident"]'::jsonb,
     null, true, '"Tous les 3 ans"'::jsonb, '[]'::jsonb),

    (v_test_id, 7,
     'Une habilitation B0 autorise le titulaire à :',
     'qcm_unique',
     '["Réaliser des travaux électriques sous tension","Travailler à proximité d''installations électriques sans y toucher","Intervenir sur des tableaux haute tension","Ouvrir des armoires électriques pour travaux"]'::jsonb,
     null, true,
     '"Travailler à proximité d''installations électriques sans y toucher"'::jsonb,
     '[]'::jsonb),

  -- ============================================================
  -- SECTION C — RISQUES ET DANGERS ÉLECTRIQUES (Q8-Q11)
  -- ============================================================
    (v_test_id, 8,
     'Quels sont les effets possibles du courant électrique sur le corps humain ? (Plusieurs réponses possibles)',
     'qcm_multiple',
     '["Électrisation (choc électrique non mortel)","Électrocution (choc électrique mortel)","Brûlures internes et externes","Tétanisation musculaire"]'::jsonb,
     null, true,
     '["Électrisation (choc électrique non mortel)","Électrocution (choc électrique mortel)","Brûlures internes et externes","Tétanisation musculaire"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 9,
     'Un courant de 10 mA traversant le corps humain est toujours mortel.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 10,
     'Parmi ces facteurs, lequel aggrave les effets du courant électrique sur le corps ?',
     'qcm_unique',
     '["La durée d''exposition","Le chemin suivi par le courant","L''état cutané (peau humide, sèche…)","Toutes ces réponses"]'::jsonb,
     null, true, '"Toutes ces réponses"'::jsonb, '[]'::jsonb),

    (v_test_id, 11,
     'Citez deux exemples de situations professionnelles pouvant exposer à un risque électrique.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ============================================================
  -- SECTION D — PRÉVENTION ET MESURES DE PROTECTION (Q12-Q15)
  -- ============================================================
    (v_test_id, 12,
     'La protection contre les contacts directs consiste à :',
     'qcm_unique',
     '["Mettre l''installation à la terre","Isoler, éloigner ou protéger les pièces nues sous tension","Utiliser un disjoncteur différentiel","Je ne sais pas"]'::jsonb,
     null, true,
     '"Isoler, éloigner ou protéger les pièces nues sous tension"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 13,
     'Un disjoncteur différentiel de 30 mA protège contre les contacts indirects.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 14,
     'Avant d''utiliser un appareil électrique portatif, il est recommandé de : (Plusieurs réponses possibles)',
     'qcm_multiple',
     '["Vérifier l''absence de dommages visibles sur le câble et la prise","S''assurer que la tension correspond à celle de l''installation","Vérifier que l''appareil est bien marqué CE","Aucune vérification n''est nécessaire"]'::jsonb,
     null, true,
     '["Vérifier l''absence de dommages visibles sur le câble et la prise","S''assurer que la tension correspond à celle de l''installation","Vérifier que l''appareil est bien marqué CE"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 15,
     'Quelle est, selon vous, la première action à réaliser avant toute intervention à proximité d''une installation électrique ?',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ============================================================
  -- SECTION E — CONDUITE À TENIR EN CAS D'ACCIDENT (Q16-Q19)
  -- ============================================================
    (v_test_id, 16,
     'Un collègue est électrisé et tient encore un câble sous tension. Quelle est la première action ?',
     'qcm_unique',
     '["Le saisir immédiatement et le tirer en arrière","Couper l''alimentation électrique avant tout contact","Appeler le 15 (SAMU) sans rien faire d''autre","Lui verser de l''eau pour le refroidir"]'::jsonb,
     null, true, '"Couper l''alimentation électrique avant tout contact"'::jsonb, '[]'::jsonb),

    (v_test_id, 17,
     'En cas d''incendie sur un tableau électrique, on peut utiliser un extincteur à eau pour l''éteindre.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 18,
     'Quel extincteur est adapté pour un feu d''origine électrique ?',
     'qcm_unique',
     '["Extincteur à eau pulvérisée","Extincteur CO2 (dioxyde de carbone)","Extincteur à poudre BC","CO2 et poudre BC sont tous les deux adaptés"]'::jsonb,
     null, true, '"CO2 et poudre BC sont tous les deux adaptés"'::jsonb, '[]'::jsonb),

    (v_test_id, 19,
     'Décrivez brièvement les étapes à suivre si vous découvrez un collègue victime d''un accident électrique.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ============================================================
  -- SECTION F — EXPÉRIENCE ET ATTENTES (Q20-Q22)
  -- ============================================================
    (v_test_id, 20,
     'Avez-vous déjà suivi une formation à l''habilitation électrique ?',
     'qcm_unique',
     '["Non, c''est ma première formation","Oui, il y a moins de 3 ans","Oui, il y a plus de 3 ans","Je ne me souviens pas"]'::jsonb,
     null, true, null,
     '["Oui, il y a moins de 3 ans","Oui, il y a plus de 3 ans"]'::jsonb),

    (v_test_id, 21,
     'Avez-vous déjà été témoin ou victime d''un incident ou accident d''origine électrique ? Si oui, décrivez brièvement.',
     'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 22,
     'Quelles sont vos principales attentes vis-à-vis de cette formation ?',
     'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Test de positionnement Habilitation H0/B0 créé (test_id=%) avec 22 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
