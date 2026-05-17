-- =============================================================================
-- Évaluation des Acquis — Gestes et Postures / Prévention TMS (SECU-02)
-- =============================================================================
-- 1 seul test : évaluation des acquis de fin de formation (pas de positionnement).
-- Barème original : 100 points, seuil 70/100.
-- Partie 4 (mise en situation pratique — grille formateur, 40 pts) exclue.
-- 20 questions : Parties 1 à 3 uniquement.
-- Type 'quiz'.
-- Même formation que gestes-postures-tests.sql (EF1/EF2/EF3).
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
  where slug = 'gestes-postures'
     or slug ilike '%gestes%postures%'
     or slug ilike '%secu-02%'
     or slug ilike '%secu02%'
     or titre ilike '%gestes et postures%'
     or titre ilike '%prévention%tms%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Gestes et Postures introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation des acquis Gestes et Postures — Prévention des TMS',
    'Évaluation certificative de fin de formation (SECU-02). Barème 100 points, seuil de validation 70/100. Durée 30 min. 3 parties écrites : connaissances théoriques (20 pts), analyse de situations (20 pts), manutention et techniques (20 pts). La mise en situation pratique (40 pts) est évaluée par le formateur en présentiel.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ============================================================
  -- PARTIE 1 — CONNAISSANCES THÉORIQUES (Q1-Q10)
  -- ============================================================
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1,
     'Qu''est-ce qu''un TMS (Trouble Musculosquelettique) ?',
     'qcm_unique',
     '["Une maladie infectieuse contractée en milieu de travail","Une atteinte des muscles, tendons ou nerfs liée à des sollicitations répétées ou excessives","Un accident provoqué par une chute de hauteur","Une pathologie uniquement liée au stress professionnel"]'::jsonb,
     null, true,
     '"Une atteinte des muscles, tendons ou nerfs liée à des sollicitations répétées ou excessives"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 2,
     'Quelle partie du corps est la plus fréquemment touchée par les TMS en milieu professionnel ?',
     'qcm_unique',
     '["Les membres inférieurs (genoux, chevilles)","Le rachis lombaire (bas du dos) et les membres supérieurs","La nuque et les yeux","L''appareil digestif"]'::jsonb,
     null, true,
     '"Le rachis lombaire (bas du dos) et les membres supérieurs"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 3,
     'Les TMS sont principalement causés par des gestes répétitifs, des efforts excessifs et des postures contraignantes.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 4,
     'Quel est le principal texte réglementaire qui oblige l''employeur à former ses salariés à la manutention manuelle ?',
     'qcm_unique',
     '["Article L.4121-1 du Code du travail","Articles R.4541-8 et R.231-71 du Code du travail","Recommandation INRS R402","Norme ISO 45001"]'::jsonb,
     null, true,
     '"Articles R.4541-8 et R.231-71 du Code du travail"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 5,
     'Les maladies professionnelles liées aux TMS représentent la première cause de maladie professionnelle reconnue en France.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 6,
     'Parmi ces facteurs, lesquels favorisent l''apparition des TMS ? (plusieurs réponses)',
     'qcm_multiple',
     '["Les gestes répétitifs et prolongés","Le travail en ambiance froide ou vibrante","Les postures statiques maintenues longtemps","L''utilisation d''équipements de manutention adaptés"]'::jsonb,
     null, true,
     '["Les gestes répétitifs et prolongés","Le travail en ambiance froide ou vibrante","Les postures statiques maintenues longtemps"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 7,
     'Associez chaque terme à sa définition : 1. Contracture musculaire / 2. Hernie discale / 3. Tendinite / 4. Syndrome du canal carpien — à associer avec : A. Compression du nerf médian au poignet provoquant douleurs et fourmillements | B. Inflammation d''un tendon due à des sollicitations répétitives | C. Tension douloureuse et involontaire d''un muscle | D. Saillie du disque intervertébral pouvant comprimer un nerf.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     'Les principes de sécurité physique (PSE) visent à utiliser les grandes masses corporelles (bassin, tronc) pour économiser l''effort.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 9,
     'Quelle est la masse maximale recommandée pour le port manuel de charge sans aide mécanique pour un homme adulte ?',
     'qcm_unique',
     '["10 kg","25 kg","50 kg","Il n''existe aucune limite réglementaire"]'::jsonb,
     null, true, '"25 kg"'::jsonb, '[]'::jsonb),

    (v_test_id, 10,
     'Citez trois facteurs d''usure ou de fatigue pouvant aggraver les TMS au poste de travail.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ============================================================
  -- PARTIE 2 — ANALYSE DE SITUATIONS (Q11-Q15)
  -- ============================================================
    (v_test_id, 11,
     'Situation A — Pierre, cariste, soulève régulièrement des cartons de 20 kg depuis le sol en gardant le dos arrondi et les jambes tendues. Il se plaint de douleurs lombaires. a) Identifiez le problème de posture. b) Décrivez la correction à apporter.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 12,
     'Situation B — Sophie travaille à un poste de montage en chaîne. Elle effectue le même geste de vissage toutes les 8 secondes, bras levés au-dessus de la tête, pendant 6 heures d''affilée. a) Quels sont les risques TMS identifiés ? b) Proposez deux mesures préventives.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 13,
     'Situation C — Dans un entrepôt, des palettes arrivent à une hauteur de 10 cm du sol. Les opérateurs doivent se pencher fortement en avant pour atteindre les produits. Proposez un aménagement de poste.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 14,
     'Pour déplacer une charge lourde sur une courte distance, il vaut mieux la porter à bout de bras pour « gagner du temps ».',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb,
     '["VRAI","FAUX"]'::jsonb),  -- justification toujours demandée

    (v_test_id, 15,
     'Classez ces 5 actions par ordre de priorité dans la hiérarchie des mesures de prévention (1 = prioritaire) : Éliminer la manutention par automatisation / Réorganiser le flux logistique / Utiliser des aides mécaniques / Mettre en place des rotations de postes / Former les salariés aux bons gestes.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ============================================================
  -- PARTIE 3 — MANUTENTION ET TECHNIQUES DE PORT DE CHARGE (Q16-Q20)
  -- ============================================================
    (v_test_id, 16,
     'Décrivez les 6 étapes correctes de la technique de lever-porter d''une charge depuis le sol (approche, descente, saisie, montée, transport, dépose).',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 17,
     'Quelles sont les bonnes pratiques lors du transport manuel d''une charge ? (plusieurs réponses)',
     'qcm_multiple',
     '["Tenir la charge près du corps, à hauteur du bassin","Pivoter avec les pieds pour changer de direction (ne pas vriller le dos)","S''assurer d''avoir le chemin dégagé avant de commencer le transport","Porter la charge avec les bras tendus pour dégager le champ de vision"]'::jsonb,
     null, true,
     '["Tenir la charge près du corps, à hauteur du bassin","Pivoter avec les pieds pour changer de direction (ne pas vriller le dos)","S''assurer d''avoir le chemin dégagé avant de commencer le transport"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 18,
     'Lors d''une manutention à deux personnes, il est recommandé que l''une d''elles guide verbalement le mouvement avant de démarrer.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"VRAI"'::jsonb, '[]'::jsonb),

    (v_test_id, 19,
     'Citez deux exemples d''aides mécaniques à la manutention disponibles en entreprise.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 20,
     'Sur votre propre poste de travail, identifiez une situation à risque TMS et proposez une mesure corrective concrète. Précisez : la situation à risque identifiée / la mesure corrective proposée / l''impact attendu sur votre santé et vos conditions de travail.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb);

  raise notice 'OK — Évaluation des acquis Gestes et Postures (SECU-02) créée (test_id=%) avec 20 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
