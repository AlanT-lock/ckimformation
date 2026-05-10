import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'incendie-extincteur-evacuation',
  titre: 'Formation Incendie',
  sousTitre: 'Extincteur & Évacuation',
  parcours: 'securite',
  ref: 'SECU-01',
  hero: {
    image: '/images/formations/incendie.jpg',
    alt: "Extincteur à eau pulvérisée — équipement de lutte contre l'incendie",
  },
  infosPratiques: {
    duree: '2 heures ou 5 heures',
    public: 'Tout public',
    prerequis: 'Avoir 18 ans — Savoir lire et écrire',
    prixIndicatif: 'Express 2h : 80 € HT (indiv.) · 450 € (4-6) · 700 € (7-10) — Complet 5h : 150 € HT (indiv.) · 800 € (4-6) · 1 200 € (7-10)',
    modalite: 'Présentiel — sur site client',
    inscription: '24h avant la session',
  },
  objectifs:
    "À la fin de cette formation, le stagiaire est capable de prévenir les risques d'incendie, mettre en œuvre les moyens d'extinction disponibles en attendant les secours, et procéder à l'évacuation de l'établissement en appliquant les consignes générales de sécurité.",
  programme: [
    {
      titre: 'Prévention du risque incendie',
      points: [
        'Le triangle du feu, classes de feux',
        "Causes courantes d'incendie en entreprise",
        'Comportement du feu et propagation',
        'Consignes générales de sécurité',
      ],
    },
    {
      titre: "Moyens d'extinction",
      points: [
        "Les différents types d'extincteurs",
        "Choix de l'extincteur selon la classe de feu",
        'Mise en œuvre pratique — manipulation sur feu réel',
      ],
    },
    {
      titre: 'Évacuation',
      points: [
        "Rôles : guide-file, serre-file, chargé d'évacuation",
        'Procédure et points de rassemblement',
        "Mise en situation — exercice d'évacuation simulé",
      ],
    },
  ],
  evaluation:
    'Attestation de formation et notification sur le registre de sécurité. Évaluation continue + mise en situation incendie simulée.',
  referencesReglementaires:
    'Articles R4227-28, R4227-39 et R4141-17 à R4141-20 du Code du Travail — Articles L4141-2, R4141-3 et R4141-13 (formation à la sécurité) — Recommandation APSAD R6.',
  formationsLiees: ['habilitation-electrique-h0-b0', 'formateur-incendie-gestes-postures'],
  seo: {
    title: 'Formation Incendie — Extincteur & Évacuation | C-KIM Formation',
    description: "Formation incendie certifiée à Draguignan (PACA). Manipulation d'extincteurs, évacuation, conformité Code du travail. Sur site, 2h ou 5h.",
  },
};
