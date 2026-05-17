-- =============================================================================
-- Enquête de satisfaction FINANCEUR (unique, commune à toutes les formations)
-- =============================================================================
-- Crée UNE enquête financeur (formation_id = NULL) avec ses 14 questions.
--
-- Idempotent : si une enquête financeur existe déjà, le script ne crée rien
-- (pas de doublon ni de réinjection des questions).
--
-- Pré-requis : migrations jusqu'à 20260524_question_followup.sql appliquées
-- (en particulier 20260520_enquete_financeur_enum.sql + 20260521_enquete_financeur_tables.sql).
-- À exécuter dans le SQL Editor Supabase.
-- =============================================================================

do $$
declare
  v_test_id uuid;
begin
  -- Court-circuit si l'enquête financeur existe déjà
  select id into v_test_id
  from public.tests
  where kind = 'enquete'
    and enquete_kind = 'financeur'
    and formation_id is null
  limit 1;

  if v_test_id is not null then
    raise notice 'Enquête financeur déjà présente (id=%). Aucune action.', v_test_id;
    return;
  end if;

  -- Création du test (formation_id NULL = enquête commune)
  insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
  values (
    null,
    'Enquête de satisfaction financeur',
    'Recueil de la satisfaction de l''entreprise / OPCO financeur de la formation. Vos retours nous aident à améliorer la qualité de nos prestations administratives, commerciales et pédagogiques (démarche Qualiopi).',
    'enquete',
    'financeur',
    true
  )
  returning id into v_test_id;

  -- Questions
  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
  values
    (v_test_id, 1,
     'En tant que financeur, quel est votre niveau de satisfaction globale concernant cette prestation ?',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 2,
     'La proposition commerciale (devis, programme, conditions) était-elle claire et complète ?',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 3,
     'Comment évaluez-vous la réactivité et la qualité des échanges avec notre équipe administrative ?',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 4,
     'Les modalités d''inscription et de gestion administrative ont-elles été simples ?',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 5,
     'Les documents administratifs (convention, convocation, attestation, facture) ont-ils été reçus dans les délais ?',
     'qcm_unique',
     '["Oui, tous","Partiellement","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 6,
     'Le contenu de la formation correspondait-il aux besoins exprimés par votre entreprise ?',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 7,
     'Avez-vous constaté une montée en compétences du/des salarié(s) formé(s) ?',
     'qcm_unique',
     '["Oui, nettement","Oui, partiellement","Non","Trop tôt pour le dire"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 8,
     'La formation répond-elle à vos obligations réglementaires et/ou Qualiopi ?',
     'qcm_unique',
     '["Oui pleinement","Partiellement","Non","Non concerné"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 9,
     'Le rapport qualité/prix de la prestation vous semble-t-il satisfaisant ?',
     'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

    (v_test_id, 10,
     'Recommanderiez-vous CKIM Formation à un autre financeur (entreprise, OPCO, partenaire) ?',
     'qcm_unique',
     '["Oui, sans hésiter","Oui, probablement","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 11,
     'Envisagez-vous de refaire appel à CKIM Formation pour de futurs besoins ?',
     'qcm_unique',
     '["Oui, certainement","Probablement","Peut-être","Non"]'::jsonb,
     null, true, null, '[]'::jsonb),

    (v_test_id, 12,
     'Quels sont les points forts de notre prestation ?',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 13,
     'Quels points pourraient être améliorés (commercial, administratif, pédagogique) ?',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

    (v_test_id, 14,
     'Avez-vous des besoins de formation à venir que nous pourrions couvrir ?',
     'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb);

  raise notice 'OK — Enquête financeur créée (id=%) avec 14 questions.', v_test_id;
end $$;
