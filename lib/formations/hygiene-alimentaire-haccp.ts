import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'hygiene-alimentaire-haccp',
  titre: 'Hygiène Alimentaire',
  sousTitre: 'Méthode HACCP',
  parcours: 'alimentaire',
  ref: 'SECU-05',
  hero: {
    image: '/images/formations/hygiene-alimentaire-haccp.jpg',
    alt: 'Cuisine professionnelle et application des bonnes pratiques d\'hygiène HACCP',
  },
  infosPratiques: {
    duree: '14 heures (2 jours) — J1 : Hygiène & BPH, J2 : HACCP',
    public:
      'Tout professionnel manipulant des denrées alimentaires (cuisine, restauration, bar, réception) — 4 à 10 personnes',
    prerequis: 'Aucun',
    prixIndicatif: '350 € HT / personne — prise en charge OPCO EP possible',
    modalite: 'Présentiel — sur site client',
    inscription: '7 jours avant la session',
    recyclage: 'Tous les 3 ans',
  },
  objectifs:
    "À l'issue de la formation, le stagiaire est capable d'appliquer les bonnes pratiques d'hygiène, de mettre en œuvre la méthode HACCP et de prévenir les risques de contamination alimentaire conformément au Règlement CE 852/2004.",
  programme: [
    {
      titre: 'Cadre réglementaire',
      points: [
        'Règlement CE 852/2004 et paquet hygiène européen',
        "Obligations de l'exploitant — responsabilités en cas de TIAC",
        'Traçabilité des denrées — obligation, mise en place, conservation',
      ],
    },
    {
      titre: 'Microbiologie alimentaire',
      points: [
        'Micro-organismes pathogènes : Salmonelles, Listeria, E. coli, Staphylocoques…',
        'Conditions de développement et de multiplication bactérienne',
        'TIAC : causes, conséquences, prévention',
      ],
    },
    {
      titre: "Bonnes Pratiques d'Hygiène (BPH)",
      points: [
        'Hygiène personnelle : tenue, lavage des mains, état de santé',
        'Nettoyage et désinfection : méthodes, produits, plan de nettoyage',
        'Gestion des déchets et nuisibles — chaîne du froid — marche en avant',
      ],
    },
    {
      titre: 'Les 7 principes HACCP',
      points: [
        'P1 : Analyser les dangers (biologiques, chimiques, physiques)',
        'P2 : Identifier les Points Critiques de Contrôle (CCP)',
        'P3 : Établir les limites critiques — P4 : Système de surveillance',
        'P5 : Actions correctives — P6 : Vérification — P7 : Documentation',
      ],
    },
    {
      titre: 'Application pratique sur cas réel',
      points: [
        "Construction d'un diagramme de fabrication et identification des CCP",
        "Rédaction d'une fiche de surveillance CCP",
        'Gestion d\'une non-conformité et traçabilité',
      ],
    },
  ],
  evaluation:
    'QCM de validation des acquis + exercices pratiques HACCP. Attestation individuelle envoyée numériquement à chaque stagiaire.',
  referencesReglementaires:
    "Règlement CE 852/2004 (paquet hygiène européen) — Arrêté du 5 octobre 2011 relatif à l'obligation de formation en hygiène alimentaire dans la restauration commerciale — Code rural et de la pêche maritime.",
  formationsLiees: ['incendie-extincteur-evacuation'],
  seo: {
    title: 'Formation Hygiène Alimentaire HACCP | C-KIM Formation',
    description:
      'Formation HACCP obligatoire pour la restauration et l\'agroalimentaire. 14h, sur site client en PACA. Conformité Règlement CE 852/2004 et arrêté du 5 octobre 2011.',
  },
};
