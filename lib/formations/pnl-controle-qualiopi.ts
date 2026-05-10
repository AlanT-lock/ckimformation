import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'pnl-controle-qualiopi',
  titre: 'PNL — Programmation Neuro-Linguistique',
  sousTitre: 'Développement Personnel & Communication',
  parcours: 'developpement',
  ref: 'DEV-01',
  hero: {
    image: '/images/formations/pnl-controle-qualiopi.jpg',
    alt: 'Séance de coaching et de communication interpersonnelle inspirée des outils PNL',
  },
  infosPratiques: {
    duree: '21 heures (3 jours)',
    public:
      'Toute personne souhaitant améliorer sa communication et son développement personnel — 4 à 10 personnes',
    prerequis: 'Aucun',
    prixIndicatif: '320 € HT (indiv.) · Groupe : sur devis',
    modalite: 'Présentiel — 80 % de pratique',
    inscription: '7 jours avant la session',
    recyclage: 'Conseillé tous les 2 ans',
  },
  objectifs:
    "À l'issue de la formation, le stagiaire est capable d'identifier ses schémas de pensée et de communication, d'utiliser les outils PNL pour améliorer ses relations professionnelles et personnelles, et de dépasser ses blocages pour initier des changements durables.",
  programme: [
    {
      titre: 'Jour 1 — Fondements de la PNL & Connaissance de soi',
      points: [
        'Histoire et fondements — Bandler, Grinder, Dilts',
        'Présupposés PNL — systèmes VAKOG — filtres mentaux',
        'États internes, calibration, rapport (synchronisation) — métaprogrammes',
      ],
    },
    {
      titre: 'Jour 2 — Communication & Outils de changement',
      points: [
        'Méta-modèle du langage — modèle Milton — niveaux logiques de Dilts',
        'Ancrage — dissociation — swish pattern — ligne du temps',
      ],
    },
    {
      titre: 'Jour 3 — Croyances, objectifs & mise en pratique',
      points: [
        'Identifier et changer ses croyances limitantes — submodalités',
        "Objectifs bien formés — plan d'action personnel",
        'Mises en situation : entretiens, négociation, gestion de conflits',
      ],
    },
  ],
  evaluation:
    "Évaluation continue + questionnaire d'auto-évaluation avant/après. Attestation de formation + Plan d'action personnel individualisé.",
  referencesReglementaires:
    "Formation au titre de la formation professionnelle continue — Article L.6313-1 du Code du travail — Démarche qualité Qualiopi (RNQ).",
  formationsLiees: ['preparer-controle-qualiopi'],
  seo: {
    title: 'PNL — Programmation Neuro-Linguistique | C-KIM Formation',
    description:
      "Formation PNL en 3 jours (21h) — communication, développement personnel, gestion des croyances limitantes. 80 % de pratique en PACA.",
  },
};
