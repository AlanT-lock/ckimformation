import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'duerp-formation-accompagnement',
  titre: 'DUERP — Formation',
  sousTitre: '& Accompagnement Clé en Main',
  parcours: 'prevention',
  ref: 'PREV-01',
  hero: {
    image: '/images/formations/duerp-formation-accompagnement.jpg',
    alt: "Réunion d'évaluation des risques professionnels et rédaction du Document Unique",
  },
  infosPratiques: {
    duree: '21 heures (3 jours) — J1 & J2 formation (14h), J3 accompagnement sur site (7h)',
    public:
      "Dirigeant, responsable d'établissement, référent sécurité, RH — 1 à 5 personnes",
    prerequis: "Aucun — idéalement, accès aux informations de l'entreprise",
    prixIndicatif: '1 800 € HT (4-6 pers.) · 2 500 € HT (7-10 pers.) — DUERP finalisé inclus',
    modalite: 'Présentiel — formation + accompagnement sur site',
    inscription: '15 jours avant la session',
    recyclage: 'Mise à jour annuelle obligatoire et à chaque changement important',
  },
  objectifs:
    "À l'issue de la formation, le stagiaire est capable de réaliser, de mettre à jour et d'exploiter son Document Unique d'Évaluation des Risques Professionnels de manière autonome, en conformité avec les articles R4121-1 et R4121-2 du Code du travail. Le DUERP est livré finalisé en PDF et Word modifiable à l'issue du jour 3.",
  programme: [
    {
      titre: 'Jour 1 — Cadre réglementaire & Méthodologie (7h)',
      points: [
        'Cadre juridique : obligation du DUERP, qui est concerné, quand le mettre à jour',
        "Responsabilités de l'employeur et sanctions en cas d'absence du document",
        "Définition des unités de travail (UT) — découper l'entreprise par zones / activités",
        'Identification des dangers : physiques, chimiques, biologiques, psychosociaux, organisationnels',
        'Méthode de cotation des risques : probabilité × gravité → niveau de criticité',
        'Hiérarchisation et priorisation des actions de prévention',
      ],
    },
    {
      titre: "Jour 2 — Rédaction & Plan d'action (7h)",
      points: [
        "Structure du DUERP : présentation, unités de travail, tableau de cotation, plan d'action",
        'Rédaction des fiches de risques par unité de travail (cas pratiques)',
        "Construction du plan d'actions correctives et préventives (responsable, délai, coût)",
        'Intégration des accidents du travail et maladies professionnelles passés',
        'Modalités de mise à jour et présentation au CSE',
      ],
    },
    {
      titre: 'Jour 3 — Accompagnement sur site & Livraison (7h)',
      points: [
        "Visite complète de l'établissement avec le formateur — repérage terrain",
        "Identification des risques spécifiques à l'activité",
        'Co-rédaction en temps réel des fiches de risques par unité de travail',
        "Finalisation du tableau de cotation et du plan d'actions",
        'Livraison du DUERP finalisé en PDF + Word modifiable',
      ],
    },
  ],
  evaluation:
    'Livrables inclus : DUERP finalisé livré en PDF + Word modifiable, attestation de formation, feuille de route de mise à jour annuelle. Conservation obligatoire 40 ans (Loi du 2 août 2021).',
  referencesReglementaires:
    "Articles R4121-1 et R4121-2 du Code du travail — Loi n° 2021-1018 du 2 août 2021 (renforcement de la prévention en santé au travail) — Articles L4121-1 à L4121-5 (obligation générale de sécurité de l'employeur).",
  formationsLiees: ['elaboration-duerp-manager-sst'],
  seo: {
    title: 'DUERP — Formation & Accompagnement Clé en Main | C-KIM Formation',
    description:
      "Formation DUERP avec accompagnement sur site et livraison du Document Unique finalisé. Forfait 1 500 € HT, conformité Code du travail (R4121-1).",
  },
};
