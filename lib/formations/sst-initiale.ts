import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'sst-initiale',
  titre: 'Sauveteur Secouriste du Travail',
  sousTitre: 'Formation initiale',
  parcours: 'securite',
  ref: 'SECU-03',
  hero: {
    image: '/images/formations/sst-initiale.jpg',
    alt: 'Formation SST — mannequin de réanimation pour apprentissage des gestes de premiers secours',
  },
  infosPratiques: {
    duree: '14 heures',
    public: 'Tout public — groupe de 4 à 10 personnes',
    prerequis: 'Aucun prérequis nécessaire',
    prixIndicatif: '250 € HT (indiv.) · 1 100 € HT (4-6 pers.) · 1 600 € HT (7-10 pers.)',
    modalite: 'Présentiel — sur site client',
    inscription: '7 jours avant la session, sous réserve des places disponibles',
    recyclage: 'MAC SST tous les 24 mois pour conserver la validité du certificat',
  },
  publicDetail:
    'Tout salarié souhaitant devenir Sauveteur Secouriste du Travail. Sessions de 4 à 10 personnes (la session est annulée si l\'effectif minimum n\'est pas atteint).',
  objectifs:
    'À la fin de la formation, le stagiaire est capable d\'intervenir de façon adaptée face à une situation d\'accident du travail et de mettre en application ses compétences de SST au service de la prévention des risques professionnels dans son entreprise.',
  programme: [
    {
      titre: 'Prévention',
      points: [
        'Situer le cadre juridique de son intervention',
        'Situer son rôle de SST dans l\'organisation de la prévention de l\'entreprise',
        'Contribuer à la mise en œuvre d\'actions de prévention',
        'Informer les personnes désignées dans le plan d\'organisation de la prévention de l\'entreprise des situations dangereuses repérées',
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
    'Évaluation continue par ateliers pratiques tout au long de la formation. Évaluation formative et épreuves certificatives conformes au document de référence de l\'INRS. Le certificat SST est délivré aux participants ayant suivi l\'intégralité de la formation et satisfait à l\'ensemble des épreuves certificatives.',
  referencesReglementaires:
    'Article R4224-16 du Code du travail et document de référence en vigueur de l\'INRS. Le certificat SST est valable 24 mois — un MAC SST doit être suivi avant la fin de cette période pour prolonger la validité.',
  formationsLiees: ['mac-sst', 'gestes-et-postures', 'formateur-sst'],
  seo: {
    title: 'Formation SST — Sauveteur Secouriste du Travail | C-KIM Formation',
    description:
      'Formation initiale SST certifiante — 14h, conforme INRS. Prévention et secours en entreprise. Présentiel sur site, région PACA.',
  },
};
