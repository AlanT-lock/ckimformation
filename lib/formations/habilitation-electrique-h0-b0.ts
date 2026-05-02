import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'habilitation-electrique-h0-b0',
  titre: 'Habilitation Électrique',
  sousTitre: 'H0 – B0',
  parcours: 'securite',
  ref: 'SECU-06',
  hero: {
    image: '/images/formations/habilitation-electrique-h0-b0.jpg',
    alt: "Tableau électrique professionnel et formation à l'habilitation H0-B0",
  },
  infosPratiques: {
    duree: '7 heures (1 jour)',
    public: 'Tout public — exécutants de travaux non électriques',
    prerequis: 'Aucun',
    prixIndicatif: '250 € TTC',
    modalite: 'Présentiel',
    inscription: '7 jours avant',
    recyclage: 'Tous les 3 ans (préconisation NF C18-510)',
  },
  objectifs:
    "À l'issue de la formation, le stagiaire est capable de connaître le risque électrique inhérent à l'exécution de travaux non électriques dans les locaux réservés aux électriciens ou au voisinage de pièces nues sous tension (B0V / H0V), d'exécuter en sécurité des opérations d'ordre non électrique en BT dans le respect des prescriptions de sécurité, de prévenir ou agir face à un accident d'origine électrique, et de respecter les prescriptions de sécurité définies par la publication UTE C 18-510.",
  programme: [
    {
      titre: 'Aspects réglementaires',
      points: [
        'Décret du 14 novembre 1988 — version consolidée',
        'Publication UTE C 18-510 et normes électriques',
        "Obligations, responsabilités, domaines d'application",
        "Procédure d'habilitation H0V / B0V et ses limites",
      ],
    },
    {
      titre: "Notions élémentaires d'électricité & risques",
      points: [
        'Notions de tension, intensité, résistance',
        'Classement des installations électriques',
        "Dangers de l'électricité — exemples d'accidents réels",
        "Mécanisme d'électrisation — résistance du corps humain",
      ],
    },
    {
      titre: 'Prévention du risque électrique',
      points: [
        'Moyens de protection contre les contacts directs et indirects',
        "Mesures de protection de l'installation électrique",
        'Règles de sécurité générale en électricité',
        "Protection lors de l'utilisation de matériels électriques amovibles",
      ],
    },
    {
      titre: 'Conduite à tenir en cas d\'accident électrique',
      points: [
        "Protéger, alerter, secourir — réflexes d'urgence",
        'Notions de 1er secours adaptées aux accidents électriques',
        'Incendie sur un ouvrage électrique — conduite à tenir',
      ],
    },
  ],
  evaluation:
    "QCM d'aptitude en fin de formation. Attestation de formation délivrée. L'employeur délivre ensuite l'habilitation H0/B0.",
  referencesReglementaires:
    'Norme NF C18-510 — Décret du 14 novembre 1988 (version consolidée) — Publication UTE C 18-510 — Articles R4544-9 et R4544-10 du Code du travail.',
  formationsLiees: ['habilitation-electrique-b1v-b2v', 'incendie-extincteur-evacuation'],
  seo: {
    title: 'Habilitation Électrique H0-B0 | C-KIM Formation',
    description:
      "Formation Habilitation Électrique H0-B0 conforme NF C18-510. 7h, présentiel, à Draguignan (PACA). Pour exécutants de travaux d'ordre non électrique en BT.",
  },
};
