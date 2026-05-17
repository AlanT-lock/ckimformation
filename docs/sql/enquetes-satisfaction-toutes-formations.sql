-- =============================================================================
-- Enquêtes de satisfaction À CHAUD + À FROID — toutes les formations
-- =============================================================================
-- Crée, pour CHAQUE formation existante dans public.formations :
--   • 1 test "Enquête de satisfaction à chaud"  (kind='enquete', enquete_kind='a_chaud')
--   • 1 test "Enquête de satisfaction à froid"  (kind='enquete', enquete_kind='a_froid')
--
-- Idempotent : si une enquête du même kind/enquete_kind existe déjà pour la
-- formation, elle est ignorée (les questions ne sont pas réinjectées).
--
-- Pré-requis : migrations jusqu'à 20260524_question_followup.sql appliquées.
-- À exécuter dans le SQL Editor Supabase.
-- =============================================================================

do $$
declare
  v_formation        record;
  v_test_id          uuid;
  v_count_chaud      int := 0;
  v_count_froid      int := 0;
begin
  for v_formation in
    select id, titre from public.formations order by titre
  loop
    -- ---------------------------------------------------------------------
    -- 1. ENQUÊTE À CHAUD
    -- ---------------------------------------------------------------------
    if not exists (
      select 1 from public.tests
      where formation_id = v_formation.id
        and kind = 'enquete'
        and enquete_kind = 'a_chaud'
    ) then
      insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
      values (
        v_formation.id,
        'Enquête de satisfaction à chaud',
        'Recueil de votre ressenti immédiatement après la formation. Vos réponses nous aident à améliorer continuellement la qualité de nos prestations (démarche Qualiopi).',
        'enquete',
        'a_chaud',
        true
      )
      returning id into v_test_id;

      insert into public.questions
        (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
      values
        (v_test_id, 1,
         'Comment évaluez-vous l''accueil et l''organisation logistique de la formation ?',
         'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

        (v_test_id, 2,
         'Le contenu de la formation correspondait-il à vos attentes ?',
         'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

        (v_test_id, 3,
         'Les objectifs pédagogiques annoncés ont-ils été atteints ?',
         'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

        (v_test_id, 4,
         'Comment évaluez-vous la qualité des supports pédagogiques (documents, exercices, matériel) ?',
         'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

        (v_test_id, 5,
         'Comment évaluez-vous la pédagogie et la clarté des explications du formateur ?',
         'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

        (v_test_id, 6,
         'Comment évaluez-vous la disponibilité et l''écoute du formateur ?',
         'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

        (v_test_id, 7,
         'Le rythme de la formation vous a-t-il convenu ?',
         'qcm_unique',
         '["Trop lent","Adapté","Trop rapide"]'::jsonb,
         null, true, null, '[]'::jsonb),

        (v_test_id, 8,
         'La durée de la formation vous a-t-elle semblé adaptée ?',
         'qcm_unique',
         '["Trop courte","Adaptée","Trop longue"]'::jsonb,
         null, true, null, '[]'::jsonb),

        (v_test_id, 9,
         'Pensez-vous pouvoir mettre en pratique les acquis de cette formation dans votre activité professionnelle ?',
         'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

        (v_test_id, 10,
         'Quelle est votre satisfaction globale concernant cette formation ?',
         'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

        (v_test_id, 11,
         'Recommanderiez-vous cette formation à un collègue ?',
         'qcm_unique',
         '["Oui, sans hésiter","Oui, probablement","Non"]'::jsonb,
         null, true, null, '[]'::jsonb),

        (v_test_id, 12,
         'Quels sont les points forts de la formation ?',
         'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

        (v_test_id, 13,
         'Quels points pourraient être améliorés ?',
         'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

        (v_test_id, 14,
         'Avez-vous des suggestions de thèmes pour de futures formations ?',
         'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb);

      v_count_chaud := v_count_chaud + 1;
    end if;

    -- ---------------------------------------------------------------------
    -- 2. ENQUÊTE À FROID
    -- ---------------------------------------------------------------------
    if not exists (
      select 1 from public.tests
      where formation_id = v_formation.id
        and kind = 'enquete'
        and enquete_kind = 'a_froid'
    ) then
      insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
      values (
        v_formation.id,
        'Enquête de satisfaction à froid',
        'Recueil de votre retour d''expérience environ 3 mois après la formation. Votre regard avec le recul nous permet de mesurer l''impact réel et d''améliorer nos formations (démarche Qualiopi).',
        'enquete',
        'a_froid',
        true
      )
      returning id into v_test_id;

      insert into public.questions
        (test_id, ordre, libelle, type_reponse, options, echelle_max, required, bonne_reponse, follow_up_options)
      values
        (v_test_id, 1,
         'Depuis la formation, avez-vous eu l''occasion de mettre en pratique les acquis ?',
         'qcm_unique',
         '["Oui, régulièrement","Oui, occasionnellement","Non, pas encore"]'::jsonb,
         null, true, null, '[]'::jsonb),

        (v_test_id, 2,
         'Dans quelle mesure les compétences acquises sont-elles utiles dans votre activité professionnelle ?',
         'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

        (v_test_id, 3,
         'La formation a-t-elle eu un impact positif sur vos pratiques quotidiennes ?',
         'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

        (v_test_id, 4,
         'Vous sentez-vous plus à l''aise et autonome sur les sujets abordés ?',
         'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

        (v_test_id, 5,
         'Avec le recul, les objectifs pédagogiques annoncés étaient-ils pertinents ?',
         'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

        (v_test_id, 6,
         'Avec le recul, comment évaluez-vous la qualité globale de la formation ?',
         'echelle', '[]'::jsonb, 5, true, null, '[]'::jsonb),

        (v_test_id, 7,
         'Recommanderiez-vous (toujours) cette formation à un collègue ?',
         'qcm_unique',
         '["Oui, sans hésiter","Oui, probablement","Non"]'::jsonb,
         null, true, null, '[]'::jsonb),

        (v_test_id, 8,
         'Avez-vous rencontré des difficultés à appliquer ce qui a été appris ? Lesquelles ?',
         'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

        (v_test_id, 9,
         'Auriez-vous besoin d''un complément de formation ou d''un rappel sur certains points ?',
         'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb),

        (v_test_id, 10,
         'Suggestions d''amélioration ou commentaires libres',
         'texte_libre', '[]'::jsonb, null, false, null, '[]'::jsonb);

      v_count_froid := v_count_froid + 1;
    end if;
  end loop;

  raise notice 'OK — % enquête(s) à chaud créée(s), % enquête(s) à froid créée(s).',
    v_count_chaud, v_count_froid;
end $$;
