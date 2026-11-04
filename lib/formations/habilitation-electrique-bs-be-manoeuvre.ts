import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'habilitation-electrique-bs-be-manoeuvre',
  titre: 'Habilitation Électrique',
  sousTitre: 'BS BE Manœuvre',
  parcours: 'securite',
  ref: 'SECU-05',
  hero: {
    image: '/images/formations/habilitation-electrique-bs-be-manoeuvre.jpg',
    alt: 'Habilitation Électrique BS BE Manœuvre — gant de protection et câble dénudé pour intervention basse tension',
  },
  infosPratiques: {
    duree: '14 heures',
    public: 'Tout public',
    prerequis:
      'Aptitude médicale. Pas de prérequis pour le symbole BE manœuvre. Pour le symbole BS : connaissance des règles élémentaires de l\'électricité et des techniques de remplacement et raccordement sur les installations concernées.',
    prixIndicatif: 'Sur devis',
    modalite: 'Présentiel — sur site client',
    inscription: '7 jours avant la session',
    recyclage: 'Recyclage recommandé tous les 3 ans',
  },
  publicDetail:
    'Personnel non électricien réalisant des interventions élémentaires (remplacement, raccordement) et/ou des manœuvres en basse tension sur des installations électriques.',
  objectifs:
    'Exécuter en sécurité des interventions de remplacement et de raccordement simples et des manœuvres dans le respect des prescriptions de sécurité du Code du travail.',
  programme: [
    {
      titre: 'Notions élémentaires d\'électricité',
      points: [
        'Risques liés à l\'électricité et accidents du travail associés',
        'Effets de l\'électrisation sur le corps humain',
        'Définition des habilitations électriques et leurs objectifs',
        'Les différents matériels et leurs domaines de tension',
        'Unités usuelles, points de mesure, loi d\'Ohm',
        'Fonctions des matériels électriques BT et HT',
      ],
    },
    {
      titre: 'Travailler en sécurité dans un environnement électrique',
      points: [
        'Règles de sécurité pour se prémunir du danger',
        'Zones d\'environnement et leurs limites',
        'Séquences de mise hors tension',
        'Réalisation d\'une VAT (vérification d\'absence de tension)',
        'Réalisation d\'une remise sous tension',
        'Équipements de protection collective et individuelle',
      ],
    },
    {
      titre: 'Raccordement, remplacement, manœuvre en sécurité',
      points: [
        'Mesures de prévention lors d\'une intervention',
        'Documents, instructions de sécurité et EPI nécessaires',
        'Remplacer un fusible, une lampe, un accessoire',
        'Réaliser un raccordement hors tension',
        'Réaliser une manœuvre haute ou basse tension',
      ],
    },
    {
      titre: 'Réagir face à un accident',
      points: [
        'Conduite à tenir en cas d\'incident sur l\'équipage électrique',
        'Conduite à tenir en cas d\'accident d\'origine électrique',
        'Réagir en cas d\'accident sur les ouvrages électriques',
      ],
    },
  ],
  evaluation:
    'Évaluation théorique et pratique en fin de formation. Avis après formation, attestation de formation et enquête de satisfaction stagiaire.',
  referencesReglementaires:
    'L\'habilitation électrique est une exigence réglementaire pour tous les travailleurs effectuant des opérations sur les installations électriques ou dans leur voisinage. Elle nécessite une formation préalable. Un recyclage est recommandé tous les 3 ans.',
  formationsLiees: [
    'habilitation-electrique-h0-b0',
    'habilitation-electrique-b1v-b2v',
    'incendie-extincteur-evacuation',
  ],
  seo: {
    title: 'Habilitation Électrique BS BE Manœuvre | C-KIM Formation',
    description:
      'Formation habilitation électrique BS / BE Manœuvre — 14h, présentiel. Pour interventions élémentaires et manœuvres en basse tension. Région PACA.',
  },
};
