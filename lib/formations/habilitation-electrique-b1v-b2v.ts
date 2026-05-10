import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'habilitation-electrique-b1v-b2v',
  titre: 'Habilitation Électrique',
  sousTitre: 'B1V & B2V — Basse Tension',
  parcours: 'securite',
  ref: 'SECU-06',
  hero: {
    image: '/images/formations/habilitation-electrique-b1v-b2v.jpg',
    alt: 'Électricien intervenant sur une installation basse tension avec EPI',
  },
  infosPratiques: {
    duree: '14 heures (2 jours)',
    public: 'Électriciens / techniciens de maintenance — 4 à 10 personnes par session',
    prerequis: 'Être électricien ou technicien de maintenance amené à réaliser des travaux BT',
    prixIndicatif: '550 € HT (indiv.) · 1 700 € HT (4-6 pers.) · 2 400 € HT (7-10 pers.)',
    modalite: 'Présentiel — sur site client (60 % de pratique)',
    inscription: '7 jours avant la session',
    recyclage: 'Tous les 3 ans, ou si absence supérieure à 6 mois au poste',
  },
  objectifs:
    "À l'issue de la formation, le stagiaire est capable de réaliser en sécurité des opérations électriques en basse tension conformément à la norme NF C18-510. La formation prépare aux habilitations B1V (exécutant électricien — travaux hors tension au voisinage de pièces nues sous tension) et B2V (chargé de travaux — direction et surveillance d'une équipe en voisinage).",
  programme: [
    {
      titre: 'Connaissance des risques électriques',
      points: [
        'Effets physiopathologiques du courant sur le corps humain',
        'Domaines de tension BT/TBT, contacts directs et indirects',
        'Brûlures, électrisation, électrocution — comprendre les risques',
        'Réglementation : norme NF C18-510 et Code du travail',
      ],
    },
    {
      titre: "Niveaux d'habilitation, zones & équipements",
      points: [
        'Rôles B1V / B2V — autorisations et interdictions',
        "Chargé d'exploitation, chargé de consignation (BC)",
        "Zones d'environnement, de sécurité et de voisinage renforcé (ZSR)",
        'EPI et EPC — outillage isolant, signalisation électrique',
      ],
    },
    {
      titre: "Procédures d'opérations électriques",
      points: [
        'Mise hors tension, mise hors de portée, consignation',
        'Attestation de consignation, avis de fin de travaux, autorisation de travail',
        'Analyse des risques avant intervention',
        'Manœuvres et raccordements autorisés selon habilitation',
      ],
    },
    {
      titre: "Conduite à tenir en cas d'accident électrique",
      points: [
        "Protéger, alerter, secourir — réflexes d'urgence",
        "Dégagement d'une victime en milieu électrique",
        'Premiers secours adaptés aux accidents électriques',
      ],
    },
  ],
  evaluation:
    "Avis d'aptitude après formation délivré à chaque stagiaire, permettant à l'employeur de délivrer l'habilitation B1V et/ou B2V. Épreuves théorique et pratique conformes NF C18-510.",
  referencesReglementaires:
    'Norme NF C18-510 (décret du 14/11/2011) — Articles R4544-9 et R4544-10 du Code du travail — Arrêté du 26 avril 2012.',
  formationsLiees: ['habilitation-electrique-h0-b0', 'incendie-extincteur-evacuation'],
  seo: {
    title: 'Habilitation Électrique B1V & B2V | C-KIM Formation',
    description:
      "Formation Habilitation Électrique B1V/B2V conforme NF C18-510 à Draguignan (PACA). 14h, 60 % de pratique. Pour électriciens et techniciens de maintenance BT.",
  },
};
