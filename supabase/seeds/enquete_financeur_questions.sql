-- =============================================================================
--  Enquête de satisfaction financeur — questions par défaut
-- =============================================================================
--  Enquête unique (toutes formations), envoyée à l'entreprise qui a financé la
--  formation de ses salariés. Questions génériques, valables pour toutes les
--  formations (Qualiopi, indicateur 30 : recueil des appréciations des financeurs).
--
--  - Crée l'enquête financeur si elle n'existe pas encore.
--  - N'insère les questions QUE si l'enquête n'en contient aucune : le script
--    peut être relancé sans créer de doublons, et ne touche pas à des questions
--    déjà saisies depuis l'admin.
--  - Question 1 = satisfaction globale (échelle 1 à 5) : base du taux
--    « Satisfaction des entreprises » publié sur /nos-resultats (4 ou 5 sur 5).
--  - Les échelles 1 à 5 alimentent aussi les alertes qualité (actions correctives).
-- =============================================================================

do $$
declare
  v_test_id uuid;
begin
  select id into v_test_id
    from public.tests
   where kind = 'enquete'
     and enquete_kind = 'financeur'
     and formation_id is null
   limit 1;

  if v_test_id is null then
    insert into public.tests (formation_id, nom, description, kind, enquete_kind, actif)
    values (
      null,
      'Enquête de satisfaction financeur',
      'Enquête envoyée aux entreprises ayant financé une formation pour leurs salariés.',
      'enquete',
      'financeur',
      true
    )
    returning id into v_test_id;
  end if;

  if exists (select 1 from public.questions where test_id = v_test_id) then
    raise notice 'Enquête financeur % : des questions existent déjà, rien n''est inséré.', v_test_id;
    return;
  end if;

  insert into public.questions
    (test_id, ordre, libelle, type_reponse, options, echelle_max, required, follow_up_options)
  values
    -- Satisfaction globale (indicateur publié)
    (v_test_id, 1,
     'Globalement, quel est votre niveau de satisfaction concernant la formation suivie par vos salariés ? (1 = pas du tout satisfait, 5 = très satisfait)',
     'echelle', '[]'::jsonb, 5, true, '[]'::jsonb),

    -- Avant la formation
    (v_test_id, 2,
     'Qualité de nos échanges avant la formation (conseil, réactivité, réponse à votre demande)',
     'echelle', '[]'::jsonb, 5, true, '[]'::jsonb),
    (v_test_id, 3,
     'Clarté et délais de transmission des documents administratifs (devis, convention, convocations, attestations, facture)',
     'echelle', '[]'::jsonb, 5, true, '[]'::jsonb),

    -- La formation
    (v_test_id, 4,
     'Adéquation de la formation aux besoins exprimés par votre structure',
     'echelle', '[]'::jsonb, 5, true, '[]'::jsonb),
    (v_test_id, 5,
     'Organisation de la formation (dates, horaires, lieu, matériel)',
     'echelle', '[]'::jsonb, 5, true, '[]'::jsonb),

    -- Après la formation
    (v_test_id, 6,
     'Quels retours vos salariés vous ont-ils faits sur la formation ? (en cas de retours mitigés ou négatifs, merci de préciser)',
     'qcm_unique',
     '["Très positifs", "Plutôt positifs", "Mitigés", "Négatifs", "Pas de retour à ce jour"]'::jsonb,
     null, true,
     '["Mitigés", "Négatifs"]'::jsonb),
    (v_test_id, 7,
     'Constatez-vous une mise en application des acquis de la formation sur le poste de travail ? (si non, merci de préciser)',
     'qcm_unique',
     '["Oui, déjà constatée", "Oui, en partie", "Pas encore, il est trop tôt", "Non"]'::jsonb,
     null, true,
     '["Non"]'::jsonb),

    -- Recommandation et suite
    (v_test_id, 8,
     'Recommanderiez-vous C-KIM Formation à d''autres entreprises ? (si non, merci de préciser pourquoi)',
     'qcm_unique',
     '["Oui, certainement", "Oui, probablement", "Non, probablement pas", "Non, certainement pas"]'::jsonb,
     null, true,
     '["Non, probablement pas", "Non, certainement pas"]'::jsonb),
    (v_test_id, 9,
     'Envisagez-vous de faire de nouveau appel à C-KIM Formation pour d''autres besoins de formation ?',
     'qcm_unique',
     '["Oui", "Peut-être", "Non"]'::jsonb,
     null, true, '[]'::jsonb),
    (v_test_id, 10,
     'Avez-vous des besoins de formation à venir pour vos équipes ? Si oui, lesquels ?',
     'texte_libre', '[]'::jsonb, null, false, '[]'::jsonb),

    -- Expression libre
    (v_test_id, 11,
     'Quels sont, selon vous, les points forts de notre prestation ?',
     'texte_libre', '[]'::jsonb, null, false, '[]'::jsonb),
    (v_test_id, 12,
     'Quelles améliorations nous suggérez-vous ?',
     'texte_libre', '[]'::jsonb, null, false, '[]'::jsonb);

  raise notice 'Enquête financeur % : 12 questions insérées.', v_test_id;
end $$;
