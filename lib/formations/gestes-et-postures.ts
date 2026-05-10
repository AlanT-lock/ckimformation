import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'gestes-et-postures',
  titre: 'Gestes et Postures',
  sousTitre: 'Prévention des TMS',
  parcours: 'securite',
  ref: 'SECU-02',
  hero: {
    image: '/images/formations/gestes-et-postures.jpg',
    alt: 'Formation Gestes et Postures — manipulation d\'un transpalette en entrepôt avec gants de protection',
  },
  infosPratiques: {
    duree: '7 heures',
    public:
      'Tout salarié amené à faire de la manutention manuelle ou à travailler dans des postures contraignantes — groupe de 4 à 12 personnes',
    prerequis: 'Maîtrise orale et écrite du français.',
    prixIndicatif: '200 € HT (indiv.) · 850 € HT (4-6 pers.) · 1 300 € HT (7-10 pers.)',
    modalite: 'Présentiel — sur site client',
    inscription: '7 jours avant la session, sous réserve des places disponibles',
  },
  publicDetail:
    'Tout salarié amené à faire de la manutention manuelle ou à travailler dans des postures contraignantes. Programme adapté à votre activité — un audit préalable de vos postes de travail permet de cibler les mauvaises postures constatées.',
  objectifs:
    'À la fin de cette formation, le stagiaire est capable d\'analyser et repérer dans son poste de travail les gestes et postures sources de troubles musculosquelettiques, d\'appliquer les principes de sécurité physique et d\'économie d\'effort, et de mobiliser des charges en utilisant des méthodes et moyens adaptés et sécurisants.',
  programme: [
    {
      titre: 'Accidents du travail et maladies professionnelles',
      points: [
        'Définition, statistiques, enjeux humains et financiers',
        'Obligations réglementaires et responsabilités de l\'employeur',
        'Notions d\'anatomie, physiologie et pathologie',
        'Les troubles musculosquelettiques (TMS)',
        'Conséquences sur la santé',
      ],
    },
    {
      titre: 'Prévention des risques',
      points: [
        'Facteurs d\'usure et de fatigue',
        'Principes généraux de prévention',
        'Principes de base de la manutention',
      ],
    },
    {
      titre: 'Techniques pratiques',
      points: [
        'Techniques de lever-porter de charge',
        'Principes d\'aménagement des postes de travail',
        'Différents gestes et postures sur le poste',
      ],
    },
  ],
  evaluation:
    'Évaluation continue par ateliers pratiques tout au long de la formation. Évaluation formative basée sur les critères du référentiel interne C-KIM. Attestation de formation et d\'assiduité, notification sur le registre de sécurité.',
  referencesReglementaires:
    'Articles R.4541-8 et R.231-71 du Code du travail : analyse des activités de manutention, formation des salariés aux principes de sécurité physique, adaptation des moyens de prévention. Recommandation INRS : formation pratique centrée sur les gestes adaptés à chaque poste. Pour la logistique et les entrepôts, recommandation R308.',
  formationsLiees: ['sst-initiale', 'mac-sst', 'formateur-incendie-gestes-postures'],
  seo: {
    title: 'Formation Gestes et Postures — Prévention TMS | C-KIM Formation',
    description:
      'Formation gestes et postures — 7h, prévention des TMS et manutention manuelle. Programme adapté à votre activité. Présentiel sur site, région PACA.',
  },
};
