import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'formateur-sst',
  titre: 'Formateur Sauveteur Secouriste du Travail',
  sousTitre: 'FO SST — Certification INRS',
  parcours: 'formateurs',
  ref: 'FOSST/01-26/VP',
  hero: {
    image: '/images/formations/formateur-sst.jpg',
    alt: 'Formation de formateurs SST avec mannequin de réanimation et gestes de premiers secours',
  },
  infosPratiques: {
    duree: '56 heures minimum (2 semaines, 2 × 4 jours non consécutifs)',
    public:
      'Tout salarié souhaitant devenir formateur SST — 5 à 10 personnes maximum',
    prerequis:
      "Certificat SST à jour + compétences de base en prévention INRS + capacités relationnelles et d'animation",
    prixIndicatif: 'Sur devis',
    modalite: "Présentiel — habilitation INRS uniquement (animation sous habilitation)",
    inscription: '15 jours avant la session',
    recyclage: 'MAC FO SST tous les 36 mois',
  },
  objectifs:
    "À l'issue de la formation, le stagiaire est capable de déployer le dispositif SST dans sa globalité, de démontrer l'intérêt de la formation SST pour une entreprise, de maîtriser les aspects méthodologiques et techniques de la prévention et du secours, et de concevoir, animer, évaluer et suivre une action de formation SST.",
  programme: [
    {
      titre: 'Introduction — Dispositif SST & FORPREV',
      points: [
        "Organisation du dispositif SST — processus d'habilitation et FORPREV",
        "Rôles et missions du formateur SST interne ou d'un organisme de formation habilité",
      ],
    },
    {
      titre: "DC1 — Démontrer l'intérêt de la formation SST pour une entreprise",
      points: [
        'Justifier la formation SST : intérêts, enjeux humains, juridiques et économiques',
        'Répondre à la demande de formation SST en tenant compte des spécificités',
      ],
    },
    {
      titre: 'DC2 — Maîtriser les aspects méthodologiques & techniques',
      points: [
        "S'appuyer sur le guide des données techniques pour mettre en œuvre une action de secours",
        "Justifier la mise en place d'actions de prévention — identification des risques",
      ],
    },
    {
      titre: 'DC3 — Concevoir, animer, évaluer & suivre une action SST',
      points: [
        'Concevoir un déroulé pédagogique SST — documents cadres INRS',
        'Animer une action SST — préparation, mise en œuvre, gestion des dysfonctionnements',
        'Méthodes d\'évaluation formatives et certificatives — gestion FORPREV 2',
      ],
    },
  ],
  evaluation:
    "Évaluation formative continue (grille individuelle INRS) + Épreuve certificative 1 (1er jour semaine 2) + Épreuve certificative 2 (4e jour semaine 2). Obtention : Certificat de Formateur SST INRS + Certificat de réalisation. Permet d'animer uniquement sous une habilitation délivrée par l'INRS.",
  referencesReglementaires:
    "Référentiel INRS — Document de référence du dispositif de formation SST — Articles R4224-15 et R4224-16 du Code du travail (sauveteurs secouristes du travail).",
  formationsLiees: ['mac-formateur-sst', 'formateur-incendie-gestes-postures', 'formateur-independant-interne'],
  seo: {
    title: 'Formateur SST — Certification INRS | C-KIM Formation',
    description:
      "Devenir Formateur Sauveteur Secouriste du Travail certifié INRS. 56h, 70 % de pratique, en PACA. Habilitation INRS et certificat de Formateur SST à la clé.",
  },
};
