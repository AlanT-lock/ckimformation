-- =============================================================================
-- Test de Positionnement — MAC SST (Maintien et Actualisation des Compétences SST)
-- =============================================================================
-- Source : PDF Test_Positionnement_MAC_SST.docx.pdf (V1CA-11/2025)
-- 25 questions — 3 parties.
-- Partie 2 auto-évaluation : 7 compétences échelle 1-5.
-- Non noté — non éliminatoire. Durée : 15 min.
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
  where slug = 'mac-sst'
     or slug ilike '%mac-sst%'
     or slug ilike '%mac%sst%'
     or titre ilike '%maintien%actualisation%sst%'
     or titre ilike '%mac sst%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation MAC SST introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Test de positionnement MAC SST',
    'Évalue les connaissances actuelles en tant que SST et identifie les points à renforcer avant le recyclage. Non noté. Durée : 15 min.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ============================================================
  -- PARTIE 1 — CONNAISSANCES THÉORIQUES (Q1-Q15)
  -- ============================================================
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1,
     'Quelle est la validité d''un certificat SST ?',
     'qcm_unique',
     '["12 mois","24 mois","36 mois","Illimitée"]'::jsonb,
     null, true, '"24 mois"'::jsonb, '[]'::jsonb),

    (v_test_id, 2,
     'Vous êtes témoin d''un accident du travail. Quelle est la première action à réaliser ?',
     'qcm_unique',
     '["Examiner la victime","Protéger la zone et supprimer le danger si possible","Alerter les secours","Secourir la victime"]'::jsonb,
     null, true, '"Protéger la zone et supprimer le danger si possible"'::jsonb, '[]'::jsonb),

    (v_test_id, 3,
     'Quels sont les numéros d''urgence en France ? (Plusieurs réponses possibles)',
     'qcm_multiple',
     '["15 - SAMU","17 - Police/Gendarmerie","18 - Sapeurs-pompiers","112 - Numéro d''urgence européen","114 - Numéro d''urgence pour personnes sourdes/malentendantes"]'::jsonb,
     null, true,
     '["15 - SAMU","17 - Police/Gendarmerie","18 - Sapeurs-pompiers","112 - Numéro d''urgence européen","114 - Numéro d''urgence pour personnes sourdes/malentendantes"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 4,
     'Une victime saigne abondamment au niveau de l''avant-bras. Que faites-vous ?',
     'qcm_unique',
     '["Je pose un garrot","Je comprime directement la plaie avec mes mains","Je désinfecte la plaie","J''allonge la victime et la couvre"]'::jsonb,
     null, true, '"Je comprime directement la plaie avec mes mains"'::jsonb, '[]'::jsonb),

    (v_test_id, 5,
     'Une personne s''étouffe et ne peut plus parler ni tousser. Quelle technique utilisez-vous en premier ?',
     'qcm_unique',
     '["5 claques dans le dos","5 compressions abdominales (manœuvre de Heimlich)","Position latérale de sécurité","Je l''allonge sur le dos"]'::jsonb,
     null, true, '"5 claques dans le dos"'::jsonb, '[]'::jsonb),

    (v_test_id, 6,
     'Vous trouvez une victime inconsciente qui respire. Quelle position adoptez-vous ?',
     'qcm_unique',
     '["Position demi-assise","Position allongée sur le dos","Position latérale de sécurité (PLS)","Position assise"]'::jsonb,
     null, true, '"Position latérale de sécurité (PLS)"'::jsonb, '[]'::jsonb),

    (v_test_id, 7,
     'Pour vérifier si une victime respire, vous devez :',
     'qcm_unique',
     '["Regarder si le ventre se soulève pendant 5 secondes","Basculer la tête en arrière et regarder-écouter-sentir pendant 10 secondes","Prendre le pouls","Parler fort à la victime"]'::jsonb,
     null, true, '"Basculer la tête en arrière et regarder-écouter-sentir pendant 10 secondes"'::jsonb, '[]'::jsonb),

    (v_test_id, 8,
     'Une victime ne répond pas et ne respire pas. Quel est le rythme des compressions thoraciques ?',
     'qcm_unique',
     '["60 compressions par minute","100 à 120 compressions par minute","150 compressions par minute","Pas de rythme particulier"]'::jsonb,
     null, true, '"100 à 120 compressions par minute"'::jsonb, '[]'::jsonb),

    (v_test_id, 9,
     'Lors d''un arrêt cardiaque, quel est le ratio compressions/insufflations ?',
     'qcm_unique',
     '["15 compressions / 2 insufflations","30 compressions / 2 insufflations","5 compressions / 1 insufflation","100 compressions sans insufflations"]'::jsonb,
     null, true, '"30 compressions / 2 insufflations"'::jsonb, '[]'::jsonb),

    (v_test_id, 10,
     'Quand doit-on utiliser un Défibrillateur Automatisé Externe (DAE) ?',
     'qcm_unique',
     '["Uniquement si on est formé","Dès qu''il est disponible pour toute victime en arrêt cardiaque","Seulement après 5 minutes de massage cardiaque","Jamais sans l''accord d''un médecin"]'::jsonb,
     null, true, '"Dès qu''il est disponible pour toute victime en arrêt cardiaque"'::jsonb, '[]'::jsonb),

    (v_test_id, 11,
     'Une victime se plaint d''un malaise (pâleur, sueurs). Que faites-vous ?',
     'qcm_unique',
     '["Je la mets debout pour qu''elle marche","Je l''installe en position demi-assise et la rassure","Je lui donne de l''eau","Je la laisse seule le temps d''alerter"]'::jsonb,
     null, true, '"Je l''installe en position demi-assise et la rassure"'::jsonb, '[]'::jsonb),

    (v_test_id, 12,
     'Une personne se plaint d''une douleur à l''épaule après une chute. Vous devez :',
     'qcm_unique',
     '["Mobiliser le membre pour vérifier la fracture","Immobiliser dans la position où se trouve le membre et alerter","Appliquer du froid immédiatement","Raccompagner la personne chez elle"]'::jsonb,
     null, true, '"Immobiliser dans la position où se trouve le membre et alerter"'::jsonb, '[]'::jsonb),

    (v_test_id, 13,
     'Pour une brûlure thermique, la durée de refroidissement à l''eau est de :',
     'qcm_unique',
     '["1 minute","5 minutes minimum","10 minutes","Pas de refroidissement nécessaire"]'::jsonb,
     null, true, '"5 minutes minimum"'::jsonb, '[]'::jsonb),

    (v_test_id, 14,
     'Quel est le rôle du SST en matière de prévention ?',
     'qcm_unique',
     '["Remplacer le CHSCT","Repérer les situations dangereuses et informer son responsable","Rédiger le Document Unique","Inspecter tous les postes de travail chaque semaine"]'::jsonb,
     null, true, '"Repérer les situations dangereuses et informer son responsable"'::jsonb, '[]'::jsonb),

    (v_test_id, 15,
     'Vous repérez une situation dangereuse dans l''entreprise. Que devez-vous faire ?',
     'qcm_unique',
     '["Rien, ce n''est pas mon rôle","Corriger le problème moi-même","Informer les personnes désignées dans le plan de prévention","Attendre qu''un accident se produise"]'::jsonb,
     null, true, '"Informer les personnes désignées dans le plan de prévention"'::jsonb, '[]'::jsonb),

  -- ============================================================
  -- PARTIE 2 — AUTO-ÉVALUATION DES COMPÉTENCES (ordres 16-22, échelle 1-5)
  -- ============================================================
    (v_test_id, 16,
     'Auto-évaluation : Je suis capable de protéger une zone d''accident. (1 = Pas du tout confiant — 5 = Très confiant)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 17,
     'Auto-évaluation : Je sais examiner une victime pour identifier les détresses vitales. (1 = Pas du tout confiant — 5 = Très confiant)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 18,
     'Auto-évaluation : Je sais alerter les secours de manière efficace. (1 = Pas du tout confiant — 5 = Très confiant)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 19,
     'Auto-évaluation : Je maîtrise les gestes de secours (hémorragie, étouffement, malaise, etc.). (1 = Pas du tout confiant — 5 = Très confiant)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 20,
     'Auto-évaluation : Je sais utiliser un Défibrillateur Automatisé Externe (DAE). (1 = Pas du tout confiant — 5 = Très confiant)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 21,
     'Auto-évaluation : Je suis capable de réaliser une RCP (Réanimation Cardio-Pulmonaire). (1 = Pas du tout confiant — 5 = Très confiant)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 22,
     'Auto-évaluation : Je connais mon rôle de SST en matière de prévention. (1 = Pas du tout confiant — 5 = Très confiant)',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

  -- ============================================================
  -- PARTIE 3 — EXPÉRIENCE TERRAIN (ordres 23-25)
  -- ============================================================
    (v_test_id, 23,
     'Avez-vous été confronté(e) à une situation d''accident ou d''urgence depuis votre dernière formation SST ?',
     'qcm_unique',
     '["Oui","Non"]'::jsonb,
     null, true, null,
     '["Oui"]'::jsonb),

    (v_test_id, 24,
     'Si oui, décrivez brièvement la situation vécue.',
     'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 25,
     'Quelles sont vos attentes pour cette formation MAC SST ?',
     'texte_libre',
     '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Test de positionnement MAC SST créé (test_id=%) avec 25 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
