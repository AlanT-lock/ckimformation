import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'preparer-controle-qualiopi',
  titre: 'Préparer un Contrôle Qualité',
  sousTitre: 'Qualiopi — Référentiel National Qualité (RNQ)',
  parcours: 'qualite',
  ref: 'QUAL/08-25/CD',
  hero: {
    image: '/images/formations/preparer-controle-qualiopi.jpg',
    alt: 'Audit qualité Qualiopi — préparation et revue de procédures internes',
  },
  infosPratiques: {
    duree: '14 à 49 heures (modulable selon besoins)',
    public:
      "Dirigeants et responsables qualité d'organismes de formation — 1 à 5 personnes",
    prerequis:
      "Lire, écrire, compter — connaissances du fonctionnement d'un organisme de formation",
    prixIndicatif: 'Sur devis',
    modalite: 'Présentiel — 60 % de pratique — animée par un auditeur AFNOR',
    inscription: '15 jours avant la session',
    recyclage: 'Avant chaque audit de surveillance ou de renouvellement',
  },
  objectifs:
    "À l'issue de la formation, le stagiaire est capable d'identifier les enjeux d'une démarche qualité et de maîtriser les 7 critères du Référentiel National Qualité, de s'approprier et de réorganiser les procédures internes de son organisme, d'assurer la continuité et l'amélioration de la démarche qualité, et de préparer sereinement un audit ou un audit de contrôle Qualiopi.",
  programme: [
    {
      titre: 'Introduction — Cadre RNQ & organisation audit',
      points: [
        "Les 7 critères Qualiopi — organisation d'un audit qualité",
      ],
    },
    {
      titre: 'Module 1 — Enjeux de la démarche qualité',
      points: [
        'OPCO et financement — obligations réglementaires',
        'La qualité comme levier de développement',
      ],
    },
    {
      titre: 'Module 2 — Procédures internes',
      points: [
        "S'approprier, créer ou restructurer son système qualité",
      ],
    },
    {
      titre: 'Module 3 — Continuité & amélioration',
      points: [
        "Analyser le rapport d'audit — lever une non-conformité",
        'Amélioration continue',
      ],
    },
    {
      titre: 'Module 4 — Audit blanc (simulation complète)',
      points: [
        "Organiser l'audit avec son personnel — définir les interlocuteurs",
        'Participer à un audit blanc — justifier oralement les écarts',
      ],
    },
  ],
  evaluation:
    "Évaluation formative continue + audit blanc le dernier jour. Certificat de réalisation + Attestation de compétences. Accompagnement post-formation possible.",
  referencesReglementaires:
    "Décret n° 2019-565 du 6 juin 2019 relatif au Référentiel National Qualité — Loi du 5 septembre 2018 (Avenir professionnel) — Articles L.6316-1 et suivants du Code du travail — Référentiel Qualiopi (RNQ).",
  formationsLiees: ['pnl-controle-qualiopi', 'formateur-independant-interne'],
  seo: {
    title: 'Préparer un Contrôle Qualité Qualiopi (RNQ) | C-KIM Formation',
    description:
      "Préparer son audit Qualiopi avec un auditeur AFNOR : 7 critères RNQ, audit blanc, plan d'action. 14 à 49h modulables en PACA.",
  },
};
