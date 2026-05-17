-- =============================================================================
-- Test de Positionnement — Gestes et Postures / Prévention TMS (SECU-02)
-- =============================================================================
-- Source : PDF Test_positionnement_Gestes_Postures.docx (1).pdf (V1CA-11/2025)
-- 31 questions — 5 sections.
-- La grille Q3 (8 situations) est éclatée en 8 questions individuelles (ordres 3-10).
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
  where slug = 'gestes-et-postures'
     or slug ilike '%gestes%postures%'
     or slug ilike '%secu-02%'
     or titre ilike '%gestes et postures%'
     or titre ilike '%prévention%tms%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Gestes et Postures introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Test de positionnement Gestes et Postures — Prévention des TMS',
    'Permet de mieux connaître la situation de travail, les habitudes gestuelles, les éventuelles douleurs et le niveau de connaissance du stagiaire avant la formation. Non noté. Durée estimée : 10 min.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ============================================================
  -- SECTION A — PROFIL ET SITUATION DE TRAVAIL (ordres 1-11)
  -- ============================================================
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1,
     'Quelle est la nature principale de votre activité physique au travail ?',
     'qcm_unique',
     '["Travail sédentaire (bureautique, accueil…) – peu de déplacements","Travail mixte (déplacements, port de charges légères < 10 kg)","Travail physique modéré (manutention occasionnelle, port de charges jusqu''à 25 kg)","Travail physique intense (manutention lourde et répétitive, port de charges > 25 kg)"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 2,
     'Depuis combien de temps travaillez-vous dans ce type de poste ?',
     'qcm_unique',
     '["Moins de 1 an","De 1 à 5 ans","De 5 à 10 ans","Plus de 10 ans"]'::jsonb,
     null, true, null, '[]'::jsonb),

  -- Q3 — grille 8 situations (Jamais / Parfois / Souvent)
    (v_test_id, 3,
     'Situation de travail : Je travaille debout de façon prolongée (> 3h/jour).',
     'qcm_unique',
     '["Jamais","Parfois","Souvent"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 4,
     'Situation de travail : Je travaille assis de façon prolongée (> 3h/jour).',
     'qcm_unique',
     '["Jamais","Parfois","Souvent"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 5,
     'Situation de travail : Je répète les mêmes gestes plus de 4 fois par minute.',
     'qcm_unique',
     '["Jamais","Parfois","Souvent"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6,
     'Situation de travail : Je soulève ou porte des charges régulièrement.',
     'qcm_unique',
     '["Jamais","Parfois","Souvent"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 7,
     'Situation de travail : Je travaille les bras levés au-dessus des épaules.',
     'qcm_unique',
     '["Jamais","Parfois","Souvent"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     'Situation de travail : Je me penche en avant ou tors le dos fréquemment.',
     'qcm_unique',
     '["Jamais","Parfois","Souvent"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 9,
     'Situation de travail : J''utilise des outils vibrants (ponceuse, marteau-piqueur…).',
     'qcm_unique',
     '["Jamais","Parfois","Souvent"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 10,
     'Situation de travail : Je travaille dans un environnement froid, humide ou bruyant.',
     'qcm_unique',
     '["Jamais","Parfois","Souvent"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 11,
     'Utilisez-vous des équipements ou aides à la manutention dans votre travail ? (Plusieurs réponses possibles)',
     'qcm_multiple',
     '["Transpalette manuel ou électrique","Chariot de manutention / diable","Table élévatrice ou plateau tournant","Équipements de levage (gerbeur, chariot élévateur…)","Aucune aide mécanique – tout est manuel"]'::jsonb,
     null, true, null, '[]'::jsonb),

  -- ============================================================
  -- SECTION B — ÉTAT DE SANTÉ ET DOULEURS (ordres 12-15)
  -- ============================================================
    (v_test_id, 12,
     'Ressentez-vous actuellement des douleurs ou des gênes physiques liées à votre travail ? Cochez les zones concernées. (Plusieurs réponses possibles)',
     'qcm_multiple',
     '["Nuque / Cou","Épaule droite","Épaule gauche","Coude droit","Coude gauche","Poignet / Main droite","Poignet / Main gauche","Haut du dos (dorsales)","Bas du dos (lombaires)","Hanche / Fesse","Genou droit","Genou gauche","Aucune douleur actuellement"]'::jsonb,
     null, true, null,
     '["Nuque / Cou","Épaule droite","Épaule gauche","Coude droit","Coude gauche","Poignet / Main droite","Poignet / Main gauche","Haut du dos (dorsales)","Bas du dos (lombaires)","Hanche / Fesse","Genou droit","Genou gauche"]'::jsonb),

    (v_test_id, 13,
     'Si vous avez des douleurs : depuis combien de temps ?',
     'qcm_unique',
     '["Moins d''1 mois","De 1 à 6 mois","Plus de 6 mois","Douleurs chroniques (> 1 an)","Je n''ai pas de douleur"]'::jsonb,
     null, false, null, '[]'::jsonb),

    (v_test_id, 14,
     'Ces douleurs ont-elles déjà entraîné un arrêt de travail ou une visite médicale ?',
     'qcm_unique',
     '["Oui, arrêt de travail","Oui, visite médicale sans arrêt","Non","Je préfère ne pas répondre"]'::jsonb,
     null, false, null, '[]'::jsonb),

    (v_test_id, 15,
     'Avez-vous déjà été reconnu(e) en maladie professionnelle liée aux TMS ?',
     'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, false, null, '[]'::jsonb),

  -- ============================================================
  -- SECTION C — AUTO-ÉVALUATION (ordres 16-20, échelle 1-5)
  -- ============================================================
    (v_test_id, 16,
     'Comment évaluez-vous votre connaissance des TMS (définition, causes, conséquences) ? (1 = Je ne sais pas du tout — 5 = Je maîtrise parfaitement)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 17,
     'Comment évaluez-vous votre maîtrise des techniques de lever-porter de charges ? (1 = Je ne sais pas du tout — 5 = Je maîtrise parfaitement)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 18,
     'Dans quelle mesure connaissez-vous les règles d''ergonomie et d''aménagement du poste de travail ? (1 = Je ne sais pas du tout — 5 = Je maîtrise parfaitement)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 19,
     'Comment évaluez-vous votre capacité à identifier un geste ou une posture à risque dans votre environnement ? (1 = Je ne sais pas du tout — 5 = Je maîtrise parfaitement)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 20,
     'Avez-vous déjà suivi une formation Gestes et Postures ou équivalente ?',
     'qcm_unique',
     '["Non, c''est ma première formation","Oui, il y a moins de 3 ans","Oui, il y a plus de 3 ans","Oui, mais je ne me souviens plus de son contenu"]'::jsonb,
     null, true, null, '[]'::jsonb),

  -- ============================================================
  -- SECTION D — CONNAISSANCES ACTUELLES (ordres 21-28)
  -- ============================================================
    (v_test_id, 21,
     'Que signifie l''acronyme TMS ?',
     'qcm_unique',
     '["Traumatisme Musculaire Sévère","Trouble Musculosquelettique","Tension Musculaire et Squelettique","Je ne sais pas"]'::jsonb,
     null, true, '"Trouble Musculosquelettique"'::jsonb, '[]'::jsonb),

    (v_test_id, 22,
     'Quelle partie du corps est la plus souvent touchée par les TMS en milieu professionnel ?',
     'qcm_unique',
     '["Les membres inférieurs (genoux, pieds)","Le rachis lombaire (bas du dos) et les membres supérieurs","La tête et le cou uniquement","Je ne sais pas"]'::jsonb,
     null, true, '"Le rachis lombaire (bas du dos) et les membres supérieurs"'::jsonb, '[]'::jsonb),

    (v_test_id, 23,
     'Lors d''un lever de charge depuis le sol, quelle est la posture recommandée ?',
     'qcm_unique',
     '["Dos droit, genoux fléchis, charge près du corps","Dos arrondi, jambes tendues, charge éloignée du corps","Le plus rapidement possible, quelle que soit la posture","Je ne sais pas"]'::jsonb,
     null, true, '"Dos droit, genoux fléchis, charge près du corps"'::jsonb, '[]'::jsonb),

    (v_test_id, 24,
     'Vrai ou Faux : Il vaut mieux porter une charge à bout de bras pour ne pas se salir.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 25,
     'Parmi ces éléments, lesquels peuvent provoquer des TMS ? (Plusieurs réponses possibles)',
     'qcm_multiple',
     '["Les gestes répétitifs sans pauses suffisantes","Le travail en posture contraignante prolongée","Une ambiance de travail froide ou humide","L''utilisation d''un transpalette électrique adapté"]'::jsonb,
     null, true,
     '["Les gestes répétitifs sans pauses suffisantes","Le travail en posture contraignante prolongée","Une ambiance de travail froide ou humide"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 26,
     'Qu''est-ce que la « sécurité physique et économie d''effort » (PSE) ?',
     'qcm_unique',
     '["Une méthode de musculation pour renforcer le dos","Un ensemble de principes pour protéger le corps en utilisant ses grandes masses et son équilibre","Un protocole de sécurité incendie","Je ne sais pas"]'::jsonb,
     null, true,
     '"Un ensemble de principes pour protéger le corps en utilisant ses grandes masses et son équilibre"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 27,
     'Citez deux exemples d''aménagement de poste qui permettent de réduire les TMS.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 28,
     'Vrai ou Faux : Les TMS peuvent être évités uniquement grâce aux équipements de protection individuelle (EPI).',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

  -- ============================================================
  -- SECTION E — ATTENTES (ordres 29-31)
  -- ============================================================
    (v_test_id, 29,
     'Quelles sont vos principales attentes pour cette journée de formation ? (Plusieurs réponses possibles)',
     'qcm_multiple',
     '["Comprendre pourquoi j''ai mal et comment prévenir les douleurs","Apprendre les bons gestes pour mon poste spécifique","Connaître la réglementation et mes droits","Avoir des outils pratiques à appliquer immédiatement au travail","Partager mon expérience avec d''autres salariés"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 30,
     'Y a-t-il une situation particulière ou un geste précis sur votre poste que vous souhaitez travailler en priorité ?',
     'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 31,
     'Avez-vous des contraintes physiques particulières dont le formateur devrait tenir compte (opération récente, matériel orthopédique, limitation de mouvement…) ?',
     'qcm_unique',
     '["Non","Oui (précisez dans le champ suivant)"]'::jsonb,
     null, false, null,
     '["Oui (précisez dans le champ suivant)"]'::jsonb);

  raise notice 'OK — Test de positionnement Gestes et Postures créé (test_id=%) avec 31 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
