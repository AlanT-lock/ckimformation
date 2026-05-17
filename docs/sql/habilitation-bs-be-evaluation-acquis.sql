-- =============================================================================
-- Évaluation des Acquis — Habilitation Électrique BS / BE Manœuvre (SECU-05)
-- =============================================================================
-- 1 seul test : évaluation des acquis de fin de formation (pas de positionnement).
-- Barème original : 100 points, seuil 70/100 (avis conforme NFC 18-510).
-- Partie 4 (mise en situation pratique — grille formateur) exclue.
-- 26 questions : Parties 1 à 3 uniquement.
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
  where slug = 'habilitation-electrique-bs-be'
     or slug ilike '%habilitation%bs%be%'
     or slug ilike '%secu-05%'
     or slug ilike '%secu05%'
     or titre ilike '%habilitation%bs%be%manœuvre%'
     or titre ilike '%habilitation%électrique%bs%'
  limit 1;

  if v_formation_id is null then
    raise exception 'Formation Habilitation BS/BE Manœuvre introuvable. Vérifiez le slug.';
  end if;

  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    v_formation_id,
    'Évaluation des acquis Habilitation Électrique BS / BE Manœuvre',
    'Évaluation certificative de fin de formation (SECU-05). Barème 100 points, seuil de validation 70/100. Durée 40 min, documents interdits. 3 parties écrites : réglementation (20 pts), risques et interventions (45 pts), notions électriques (15 pts). La mise en situation pratique (20 pts) est évaluée par le formateur en présentiel. L''avis conforme NFC 18-510 est délivré si le résultat est ACQUIS.',
    'quiz', null, true
  )
  returning id into v_test_id;

  -- ============================================================
  -- PARTIE 1 — RÉGLEMENTATION ET HABILITATIONS (Q1-Q7)
  -- ============================================================
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1,
     'Quel est l''objectif principal de la norme NFC 18-510 ?',
     'qcm_unique',
     '["Définir les règles de construction des installations électriques","Fixer les prescriptions de sécurité pour les opérations sur les installations électriques","Établir les tarifs de formation à l''habilitation électrique","Certifier les organismes de formation électrique"]'::jsonb,
     null, true,
     '"Fixer les prescriptions de sécurité pour les opérations sur les installations électriques"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 2,
     'Quelle est la différence fondamentale entre le symbole BS et le symbole BE Manœuvre ? Décrivez le périmètre d''intervention de chacun.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 3,
     'L''habilitation électrique doit être renouvelée tous les ans.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 4,
     'Associez chaque symbole d''habilitation à son périmètre d''intervention : BS / BE Manœuvre / B0 / BC — à associer avec : A. Chargé de consignation en domaine BT | B. Exécutant de travaux non électriques en BT | C. Manœuvres sur appareillage BT/HT | D. Interventions élémentaires de remplacement et raccordement BT.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 5,
     'Qu''est-ce qu''un ordre de manœuvre et à quoi sert-il ?',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 6,
     'L''aptitude médicale est-elle un prérequis pour les deux symboles BS et BE Manœuvre ?',
     'qcm_unique',
     '["Oui pour les deux symboles","Uniquement pour le symbole BS","Uniquement pour le symbole BE Manœuvre","Elle n''est pas exigée dans la norme"]'::jsonb,
     null, true, '"Oui pour les deux symboles"'::jsonb, '[]'::jsonb),

    (v_test_id, 7,
     'Citez deux responsabilités de l''employeur en matière d''habilitation électrique.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

  -- ============================================================
  -- PARTIE 2 — RISQUES ÉLECTRIQUES, SÉCURITÉ ET INTERVENTIONS (Q8-Q22)
  -- ============================================================
    (v_test_id, 8,
     'Quels sont les effets du courant électrique sur le corps humain ? (plusieurs réponses)',
     'qcm_multiple',
     '["Électrisation (passage du courant sans décès)","Tétanisation musculaire (impossibilité de lâcher)","Brûlures internes et externes","Électrocution (passage du courant entraînant le décès)"]'::jsonb,
     null, true,
     '["Électrisation (passage du courant sans décès)","Tétanisation musculaire (impossibilité de lâcher)","Brûlures internes et externes","Électrocution (passage du courant entraînant le décès)"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 9,
     'La résistance du corps humain est toujours constante quelles que soient les conditions.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 10,
     'Décrivez les 5 étapes de la séquence de consignation électrique dans l''ordre chronologique.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 11,
     'Qu''est-ce qu''une VAT ? Donnez sa définition puis décrivez la procédure de réalisation.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 12,
     'Quels EPI sont obligatoires pour une intervention BS ? (plusieurs réponses)',
     'qcm_multiple',
     '["Gants isolants de classe adaptée à la tension","Lunettes de protection anti-arc","Chaussures de sécurité isolantes","Tenue de travail en coton non synthétique"]'::jsonb,
     null, true,
     '["Gants isolants de classe adaptée à la tension","Lunettes de protection anti-arc","Chaussures de sécurité isolantes","Tenue de travail en coton non synthétique"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 13,
     'Avant de remplacer un fusible BT, quelle est la condition sine qua non ?',
     'qcm_unique',
     '["Porter ses EPI et intervenir directement","Mettre l''installation hors tension et effectuer la VAT","Prévenir verbalement ses collègues puis intervenir","Vérifier la marque du fusible uniquement"]'::jsonb,
     null, true,
     '"Mettre l''installation hors tension et effectuer la VAT"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 14,
     'Décrivez les étapes d''un remplacement de fusible BT conforme à la NFC 18-510.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 15,
     'Lors d''un raccordement hors tension, quelles vérifications sont nécessaires avant la remise sous tension ? (plusieurs réponses)',
     'qcm_multiple',
     '["Vérifier la conformité et la qualité du raccordement","S''assurer de l''absence de tout personnel dans la zone","Retirer tous les dispositifs de condamnation posés","Notifier la fin des travaux au chargé d''exploitation"]'::jsonb,
     null, true,
     '["Vérifier la conformité et la qualité du raccordement","S''assurer de l''absence de tout personnel dans la zone","Retirer tous les dispositifs de condamnation posés","Notifier la fin des travaux au chargé d''exploitation"]'::jsonb,
     '[]'::jsonb),

    (v_test_id, 16,
     'Qu''est-ce qu''un raccordement hors tension et quelles en sont les limites pour un BS ?',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 17,
     'Un intervenant BS peut réaliser des raccordements sous tension s''il porte des gants isolants.',
     'qcm_unique',
     '["VRAI","FAUX"]'::jsonb,
     null, true, '"FAUX"'::jsonb, '[]'::jsonb),

    (v_test_id, 18,
     'Quelle est la différence entre une manœuvre d''exploitation et une manœuvre de consignation ? Décrivez chacune.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 19,
     'Quelles précautions particulières s''appliquent lors d''une manœuvre à proximité d''une installation HT ?',
     'qcm_unique',
     '["Les mêmes précautions qu''en BT, sans différence","Distances de sécurité plus importantes, habilitation HT requise, interdiction de travailler seul","Il suffit de porter les EPI standard BT","Aucune précaution spécifique si l''installation est à l''arrêt"]'::jsonb,
     null, true,
     '"Distances de sécurité plus importantes, habilitation HT requise, interdiction de travailler seul"'::jsonb,
     '[]'::jsonb),

    (v_test_id, 20,
     'Comment utilise-t-on un multimètre pour vérifier l''absence de tension avant une intervention BS ?',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 21,
     'Décrivez la conduite à tenir si vous êtes témoin d''un accident électrique sur votre lieu de travail.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 22,
     'En cas d''incendie sur un tableau électrique sous tension, quelle est la procédure correcte ?',
     'qcm_unique',
     '["Utiliser l''extincteur à eau le plus proche pour agir rapidement","Couper l''alimentation électrique, puis utiliser CO2 ou poudre BC si la coupure est impossible sous tension","Évacuer uniquement, sans jamais intervenir sur un feu électrique","Appeler les secours et attendre leur arrivée sans rien faire"]'::jsonb,
     null, true,
     '"Couper l''alimentation électrique, puis utiliser CO2 ou poudre BC si la coupure est impossible sous tension"'::jsonb,
     '[]'::jsonb),

  -- ============================================================
  -- PARTIE 3 — NOTIONS ÉLECTRIQUES APPLIQUÉES (Q23-Q26)
  -- ============================================================
    (v_test_id, 23,
     'Complétez le tableau des grandeurs électriques — pour chacune (Tension, Intensité, Résistance, Puissance), indiquez l''unité, le symbole et l''appareil de mesure.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 24,
     'Calculez l''intensité dans un circuit alimenté en 230 V avec une résistance de 46 Ω. Indiquez la formule utilisée et montrez votre calcul.',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 25,
     'Quels sont les domaines de tension BT et HTA en courant alternatif ? Donnez les plages de valeurs (en volts).',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb),

    (v_test_id, 26,
     'Pourquoi est-il dangereux d''utiliser un multimètre réglé sur la mesure de résistance (Ω) sur une installation sous tension ?',
     'texte_libre',
     '[]'::jsonb, null, true, null, '[]'::jsonb);

  raise notice 'OK — Évaluation des acquis Habilitation BS/BE Manœuvre créée (test_id=%) avec 26 questions sur formation_id=%.', v_test_id, v_formation_id;
end $$;
