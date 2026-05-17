-- =============================================================================
-- Évaluation Formateur — MAC SST EF2 (Actualisation des gestes de secours)
-- =============================================================================
-- Source : PDF EF2_MAC_SST_Gestes_Secours.docx.pdf (V1CA-11/2025)
--   On extrait Section B (4 ateliers pratiques) + Bilan global.
--   Section A QCM théorique : déjà en quiz stagiaire (mac-sst-ef2-gestes-secours.sql).
-- Type 'evaluation_formateur'.
-- Seuil de réussite : 75% des critères acquis (sur 35 critères pratiques).
-- À exécuter dans le SQL Editor Supabase.
-- Pré-requis : ALTER TYPE test_kind ADD VALUE 'evaluation_formateur' appliqué.
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
    raise exception 'Formation MAC SST introuvable.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'EF2 — Grilles d''observation pratique + Bilan global (formateur)',
    'Grilles remplies par le formateur sur les 4 ateliers pratiques + bilan global sur les compétences C3/C4/C5. Seuil de réussite : 75% des 35 critères acquis.',
    'evaluation_formateur', null, true
  )
  returning id into v_test_id;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    -- ============================================================
    -- ATELIER 1 — HÉMORRAGIES ET PLAIES (7 critères)
    -- Scénario : collègue blessé à la main avec un cutter, plaie qui saigne abondamment
    -- ============================================================
    (v_test_id, 1, '[Atelier 1 Hémorragies] Protège et sécurise la zone',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 2, '[Atelier 1 Hémorragies] Se protège les mains (gants ou plastique)',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 3, '[Atelier 1 Hémorragies] Réalise une compression directe efficace',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 4, '[Atelier 1 Hémorragies] Maintient la compression sans relâcher',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 5, '[Atelier 1 Hémorragies] Alerte ou fait alerter avec message complet',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 6, '[Atelier 1 Hémorragies] Surveille et rassure la victime',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 7, '[Atelier 1 Hémorragies] Connaît les cas particuliers (garrot / compression à distance si corps étranger)',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 8, '[Atelier 1 Hémorragies] Score (sur 7) et observations',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    -- ============================================================
    -- ATELIER 2 — OBSTRUCTION ET MALAISES (8 critères)
    -- Scénario A : adulte qui s'étouffe en mangeant
    -- Scénario B : douleur thoracique intense, pâle et en sueur
    -- ============================================================
    (v_test_id, 9, '[Atelier 2 Obstruction] Reconnaît l''obstruction totale',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 10, '[Atelier 2 Obstruction] Réalise 5 claques efficaces dans le dos',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 11, '[Atelier 2 Obstruction] Enchaîne avec 5 compressions abdominales (Heimlich)',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 12, '[Atelier 2 Obstruction] Adapte le geste (femme enceinte / obèse : compressions thoraciques)',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 13, '[Atelier 2 Obstruction] Alerte si obstruction persistante',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 14, '[Atelier 2 Malaise] Installe la victime en position d''attente adaptée (demi-assis)',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 15, '[Atelier 2 Malaise] Alerte immédiatement le 15',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 16, '[Atelier 2 Malaise] Surveille jusqu''à la prise en charge',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 17, '[Atelier 2] Score (sur 8) et observations',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    -- ============================================================
    -- ATELIER 3 — TRAUMATISMES ET BRÛLURES (8 critères)
    -- Scénario A : chute d'un escabeau, douleur intense épaule
    -- Scénario B : eau bouillante renversée sur l'avant-bras
    -- ============================================================
    (v_test_id, 18, '[Atelier 3 Traumatisme] Ne mobilise pas la victime inutilement',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 19, '[Atelier 3 Traumatisme] Installe en position d''attente adaptée (assise ou allongée selon confort)',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 20, '[Atelier 3 Traumatisme] Immobilise le membre sans le déplacer',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 21, '[Atelier 3 Traumatisme] Alerte les secours et surveille',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 22, '[Atelier 3 Brûlure] Refroidit immédiatement à l''eau tiède (15-20°C, 5-10 min)',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 23, '[Atelier 3 Brûlure] N''applique rien sur la brûlure (ni gras, ni pansement adhésif)',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 24, '[Atelier 3 Brûlure] Connaît les critères de gravité (surface > paume, visage, mains, articulations, nourrisson)',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 25, '[Atelier 3 Brûlure] Alerte en cas de brûlure grave',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 26, '[Atelier 3] Score (sur 8) et observations',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    -- ============================================================
    -- ATELIER 4 — INCONSCIENCE ET ARRÊT CARDIAQUE (12 critères)
    -- Scénario A : collègue inconscient mais qui respire (vestiaires)
    -- Scénario B : visiteur effondré, ne respire pas (DAE à 30m)
    -- ============================================================
    (v_test_id, 27, '[Atelier 4 PLS] Vérifie la conscience (VAS)',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 28, '[Atelier 4 PLS] Libère les voies aériennes (bascule tête)',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 29, '[Atelier 4 PLS] Vérifie la respiration correctement (10 sec)',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 30, '[Atelier 4 PLS] Installe la PLS correctement',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 31, '[Atelier 4 PLS] Alerte et surveille jusqu''à prise en charge',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 32, '[Atelier 4 RCP] Reconnaît l''arrêt cardiaque (absence de respiration normale)',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 33, '[Atelier 4 RCP] Fait alerter le 15 / 18 / 112 ET fait chercher le DAE',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 34, '[Atelier 4 RCP] Position des mains correcte, compressions efficaces (5-6 cm, 100-120/min)',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 35, '[Atelier 4 RCP] Ratio 30/2 respecté',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 36, '[Atelier 4 DAE] Met en œuvre le DAE dès disponibilité sans délai',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 37, '[Atelier 4 DAE] Suit les consignes vocales du DAE',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 38, '[Atelier 4 DAE] Reprend la RCP immédiatement après le choc',
     'qcm_unique', '["Acquis","À renforcer"]'::jsonb, null, true, null, '[]'::jsonb),
    (v_test_id, 39, '[Atelier 4] Score (sur 12) et observations',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    -- ============================================================
    -- BILAN GLOBAL — Compétences référentiel INRS (C3, C4, C5a-e)
    -- ============================================================
    (v_test_id, 40,
     '[Bilan] C3 — Examiner la/les victime(s) (détresses vitales, critères de gravité)',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),
    (v_test_id, 41,
     '[Bilan] C4 — Faire alerter ou alerter (message complet, numéros, procédure)',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),
    (v_test_id, 42,
     '[Bilan] C5a — Secourir : Hémorragies et plaies',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),
    (v_test_id, 43,
     '[Bilan] C5b — Secourir : Obstruction et malaises',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),
    (v_test_id, 44,
     '[Bilan] C5c — Secourir : Traumatismes et brûlures',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),
    (v_test_id, 45,
     '[Bilan] C5d — Secourir : Inconscience / PLS',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),
    (v_test_id, 46,
     '[Bilan] C5e — Secourir : Arrêt cardiaque / RCP + DAE',
     'qcm_unique', '["Acquis","En cours","Non acquis"]'::jsonb,
     null, true, null, '[]'::jsonb),

    -- ============================================================
    -- RÉSULTATS ET DÉCISION FORMATEUR
    -- ============================================================
    (v_test_id, 47,
     'Résultat Section A — QCM (sur 5)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 48,
     'Résultat Section B — Pratique (sur 35 critères, en %)',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 49,
     'Décision formateur',
     'qcm_unique',
     '["PRÊT POUR L''ÉPREUVE CERTIFICATIVE — Tous les gestes sont acquis ou en bonne voie","RÉVISION CIBLÉE NÉCESSAIRE — Points spécifiques à retravailler avant l''épreuve","COMPÉTENCES NON VALIDÉES — Formation complémentaire recommandée avant présentation à la certification"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 50,
     'Gestes à retravailler avant l''épreuve certificative',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 51,
     'Commentaires et conseils personnalisés',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Évaluation formateur MAC SST EF2 créée (test_id=%) avec 51 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
