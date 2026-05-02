import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'mac-formateur-sst',
  titre: 'Maintien & Actualisation des Compétences',
  sousTitre: 'MAC FO SST — Recyclage Formateur SST',
  parcours: 'formateurs',
  ref: 'MFOSST/01-26/VP',
  hero: {
    image: '/images/formations/mac-formateur-sst.jpg',
    alt: 'Recyclage de formateurs SST — pratique des gestes de premiers secours',
  },
  infosPratiques: {
    duree: '21 heures minimum (3 jours consécutifs)',
    public:
      'Formateurs SST certifiés souhaitant renouveler leur certificat — 5 à 10 personnes maximum',
    prerequis:
      "Être titulaire du certificat de formateur SST délivré par une entité habilitée INRS + compétences de base en prévention",
    prixIndicatif: 'Nous consulter',
    modalite: 'Présentiel — habilitation INRS',
    inscription: '15 jours avant la session',
    recyclage: 'Obligatoire tous les 36 mois',
  },
  objectifs:
    "À l'issue de la formation, le stagiaire est capable de déployer le dispositif SST dans sa globalité en tenant compte des évolutions INRS, d'actualiser ses compétences de formateur SST conformément à la réglementation, et d'appliquer les évolutions du programme SST défini par l'INRS.",
  programme: [
    {
      titre: 'Introduction — Retour d\'expérience (Brise-glace)',
      points: [
        "Tour de table : chaque formateur présente oralement une action de formation SST mise en œuvre",
        "Retour d'expérience collectif — partage des pratiques et des difficultés rencontrées",
      ],
    },
    {
      titre: "Module 1 — Démontrer l'intérêt de la formation SST",
      points: [
        "Justifier, en s'appuyant sur son expérience, l'intérêt des actions de formation SST",
        'Argumenter dans les domaines de la prévention et du secours auprès des entreprises',
        "Présenter les bénéfices du réseau SST pour l'entreprise et ses salariés",
      ],
    },
    {
      titre: 'Module 2 — Maîtrise des aspects méthodologiques & techniques',
      points: [
        'Utilisation du Guide des données techniques lors des actions SST et MAC SST',
        "Maîtriser les outils d'animation de la prévention : PISST, PAP, Tuto'Prev…",
        "Intégrer les évolutions réglementaires et techniques définies par l'INRS",
      ],
    },
    {
      titre: 'Module 3 — Concevoir, animer, évaluer & suivre une action SST',
      points: [
        'Concevoir ou utiliser un déroulé pédagogique SST intégrant les évolutions',
        "Animer une séquence de formation SST — animations du PISST et du PAP en situation",
        "Travaux en sous-groupes et mises en situations d'animation pratiques",
      ],
    },
  ],
  evaluation:
    "Évaluation formative continue sur grille individuelle + Épreuve certificative 1 (J1) + Épreuve certificative 2 (J3). Résultats transmis à l'INRS. Renouvellement du Certificat Formateur SST + Certificat de réalisation.",
  referencesReglementaires:
    "Référentiel INRS — Document de référence du dispositif de formation SST — Obligation de MAC tous les 36 mois pour conserver l'habilitation INRS.",
  formationsLiees: ['formateur-sst', 'formateur-incendie-gestes-postures', 'formateur-independant-interne'],
  seo: {
    title: 'MAC FO SST — Recyclage Formateur SST | C-KIM Formation',
    description:
      "Maintien et Actualisation des Compétences du Formateur SST — recyclage INRS obligatoire tous les 36 mois. 21h en présentiel en PACA.",
  },
};
