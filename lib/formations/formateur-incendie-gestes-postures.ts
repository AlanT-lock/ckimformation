import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'formateur-incendie-gestes-postures',
  titre: 'Formateur Sécurité Incendie',
  sousTitre: '& Gestes & Postures',
  parcours: 'formateurs',
  ref: 'FOSI-FOGP/01-26',
  hero: {
    image: '/images/formations/formateur-incendie-gestes-postures.jpg',
    alt: "Formation de formateurs incendie et ergonomie — gestes et postures de prévention TMS",
  },
  infosPratiques: {
    duree: '28 heures (4 jours) — option Sanitaire & Social +7h pour Gestes & Postures',
    public: 'Futurs formateurs sécurité incendie ou gestes & postures — 3 à 10 personnes',
    prerequis:
      'Compétences de base en prévention INRS — pour Gestes & Postures : avoir suivi une formation Gestes & Postures',
    prixIndicatif: 'Nous consulter',
    modalite: 'Présentiel — sur site C-KIM ou client',
    inscription: '15 jours avant la session',
    recyclage: 'Conseillé tous les 36 mois',
  },
  objectifs:
    "Cette double certification permet de devenir formateur en Sécurité Incendie et/ou en Gestes & Postures (prévention des TMS). À l'issue de la formation, le stagiaire est capable d'identifier les règles qualité de la formation (Qualiopi), de concevoir des actions de formation incendie ou Gestes & Postures adaptées, d'animer et d'évaluer ces actions, et de créer ses propres supports et outils pédagogiques.",
  programme: [
    {
      titre: 'Module 1 — Concevoir, animer & évaluer (commun)',
      points: [
        'Règles qualité / Qualiopi — ingénierie pédagogique',
        "Conditions d'apprentissage de l'adulte — méthodes pédagogiques",
        'Concevoir programme et déroulé — évaluation des acquis',
      ],
    },
    {
      titre: 'Module 2 — Enjeux prévention incendie',
      points: [
        'Enjeux humains, juridiques, économiques, sociétaux',
        "Réglementation incendie applicable — impact réel d'un sinistre",
      ],
    },
    {
      titre: 'Module 3 — Concevoir & animer une formation incendie',
      points: [
        'Contenu adapté — particularités sectorielles',
        "Mise en situation d'animation le dernier jour",
      ],
    },
    {
      titre: 'Module 4 — Concevoir, animer & évaluer une formation Gestes & Postures',
      points: [
        "Conditions d'apprentissage de l'adulte — ingénierie de formation appliquée à la prévention TMS",
        "Concevoir programme et contenu — ergonomie, économie d'effort",
        "Animer une action G&P — différents types d'évaluation",
      ],
    },
    {
      titre: 'Option Sanitaire & Social (+7h)',
      points: [
        'Particularités du secteur sanitaire et social',
        'Aides à la manipulation de personnes — utilisation et formation',
        'Animer et évaluer avec les aides techniques',
      ],
    },
  ],
  evaluation:
    "Évaluation formative continue + mise en situation d'animation (épreuve sommative). Certificat de Formateur Sécurité Incendie et/ou Certificat de réalisation Formateur Gestes et Postures.",
  referencesReglementaires:
    "Article R4541-8 du Code du travail (formation à la sécurité — manutention manuelle) — Référentiel Qualiopi (RNQ) — Articles R4227-28 et R4227-39 du Code du travail (incendie).",
  formationsLiees: ['formateur-sst', 'mac-formateur-sst', 'formateur-independant-interne'],
  seo: {
    title: 'Formateur Sécurité Incendie & Gestes Postures | C-KIM Formation',
    description:
      "Devenir formateur en Sécurité Incendie ou en Gestes & Postures (prévention TMS). 28h + option Sanitaire & Social. Certifié Qualiopi en PACA.",
  },
};
