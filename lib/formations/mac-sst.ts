import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'mac-sst',
  titre: 'MAC Sauveteur Secouriste du Travail',
  sousTitre: 'Maintien & Actualisation des Compétences',
  parcours: 'securite',
  ref: 'SECU-04',
  hero: {
    image: '/images/formations/mac-sst.jpg',
    alt: 'MAC SST — manipulation d\'un défibrillateur, recyclage et actualisation des compétences SST',
  },
  infosPratiques: {
    duree: '7 heures',
    public:
      'Personnel titulaire d\'un certificat de Sauveteur Secouriste du Travail — groupe de 4 à 10 personnes',
    prerequis:
      'Être titulaire du certificat SST, ou d\'un certificat APS ASD, APS TRV ou TRM en cours de validité (ou non).',
    prixIndicatif: '150 € HT (indiv.) · 650 € HT (4-6 pers.) · 900 € HT (7-10 pers.)',
    modalite: 'Présentiel — sur site client',
    inscription: '7 jours avant la session, sous réserve des places disponibles',
    recyclage: 'Obligatoire tous les 24 mois pour conserver la validité du certificat SST',
  },
  publicDetail:
    'Personnel ayant suivi la formation SST initiale et devant maintenir la validité de son certificat. Sessions de 4 à 10 personnes.',
  objectifs:
    'À la fin de cette formation, le stagiaire est capable d\'actualiser ses connaissances en matière de secourisme et de prévention.',
  programme: [
    {
      titre: 'Échange des pratiques',
      points: [
        'Échanger sur ses pratiques en tant que SST',
        'S\'approprier les nouveautés du document de référence et du guide des données techniques de l\'INRS et du réseau prévention',
      ],
    },
    {
      titre: 'Prévention',
      points: [
        'Identifier les risques de l\'entreprise ou de l\'établissement',
        'Identifier les risques spécifiques au secteur d\'activité',
      ],
    },
    {
      titre: 'Secours',
      points: [
        'Réaliser une protection adaptée',
        'Examiner la victime',
        'Faire alerter ou alerter les secours',
        'Secourir les victimes de manière appropriée',
      ],
    },
  ],
  evaluation:
    'Évaluation continue par ateliers pratiques tout au long de la formation. Évaluation formative et épreuves certificatives conformes au document de référence de l\'INRS. Le certificat SST est prolongé pour 24 mois aux participants ayant satisfait aux épreuves.',
  referencesReglementaires:
    'Article R4224-16 du Code du travail et document de référence en vigueur de l\'INRS. Le certificat SST est valable 24 mois — un MAC doit être validé avant la fin de cette période pour le prolonger.',
  formationsLiees: ['sst-initiale', 'gestes-et-postures', 'formateur-sst'],
  seo: {
    title: 'MAC SST — Maintien et Actualisation des Compétences SST | C-KIM Formation',
    description:
      'Recyclage SST — 7h, conforme INRS, tous les 24 mois. Prolongez la validité de votre certificat de Sauveteur Secouriste du Travail. Sur site, région PACA.',
  },
};
