import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'elaboration-duerp-manager-sst',
  titre: 'Élaboration DUERP',
  sousTitre: '& Manager Santé & Sécurité au Travail',
  parcours: 'management',
  ref: 'MANSST/06-25/CD',
  hero: {
    image: '/images/formations/elaboration-duerp-manager-sst.jpg',
    alt: 'Manager animant une démarche prévention et santé-sécurité au travail',
  },
  infosPratiques: {
    duree: '14 à 21 heures (2 à 3 jours)',
    public:
      'Managers de proximité, encadrants, référents prévention — 4 à 10 personnes',
    prerequis:
      "Compétences de base en prévention INRS (eformation-inrs.fr) — être manager ou en cours de le devenir",
    prixIndicatif: 'Sur devis — nous consulter',
    modalite: 'Présentiel — sur site client',
    inscription: '15 jours avant la session',
    recyclage: 'Mise à jour conseillée tous les 24 mois',
  },
  objectifs:
    "À l'issue de la formation, le stagiaire est capable d'appliquer son rôle de manager et de participer activement à la démarche de prévention de l'entreprise, de maîtriser les principes fondamentaux de la prévention des risques professionnels, d'inscrire son rôle de manager S&ST dans la démarche de prévention et de mettre en place une communication S&ST efficace. La formation aborde également l'élaboration et la mise à jour du DUERP.",
  programme: [
    {
      titre: 'Introduction — Cadre réglementaire & rôle du manager',
      points: [
        'Réglementation de la prévention',
        'Rôles et missions du manager de proximité',
      ],
    },
    {
      titre: 'Module 1 — Fondamentaux de la prévention',
      points: [
        'Cadre légal — 4 enjeux de la prévention',
        'Conséquences AT/MP/TMS/RPS',
      ],
    },
    {
      titre: 'Module 2 — Démarche de prévention du manager S&ST',
      points: [
        'Posture, rôle, responsabilité du manager',
        'Communication S&ST — fédérer ses équipes autour de la sécurité',
      ],
    },
    {
      titre: "Module 3 — Respect des règles & évaluation des risques",
      points: [
        'Leadership sécurité — EPI',
        "DUERP — élaboration, structure, mise à jour",
        "Outils AT/MP : MAD, arbre des causes",
      ],
    },
  ],
  evaluation:
    'Évaluation formative continue + épreuve sommative le dernier jour. Certificat de réalisation + Attestation de compétences.',
  referencesReglementaires:
    "Articles L4121-1 à L4121-5 et R4121-1 à R4121-2 du Code du travail — Loi du 2 août 2021 — Référentiel INRS pour les compétences de base en prévention.",
  formationsLiees: ['duerp-formation-accompagnement'],
  seo: {
    title: 'Élaboration DUERP & Manager S&ST | C-KIM Formation',
    description:
      "Formation Manager Santé & Sécurité au Travail couplée à l'élaboration du DUERP. 14 à 21h sur site, certifiée Qualiopi. Pour managers de proximité.",
  },
};
