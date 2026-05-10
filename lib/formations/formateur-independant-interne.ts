import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'formateur-independant-interne',
  titre: 'Formateur Indépendant',
  sousTitre: 'et / ou Interne — Ingénierie de Formation & Pédagogie',
  parcours: 'formateurs',
  ref: 'FOIND/04-25/CD',
  hero: {
    image: '/images/formations/formateur-independant-interne.jpg',
    alt: 'Formateur indépendant animant une session de formation pour adultes en entreprise',
  },
  infosPratiques: {
    duree: '35 heures (adaptable selon analyse des besoins)',
    public:
      'Toute personne souhaitant devenir formateur indépendant ou formateur interne — 2 à 8 personnes maximum',
    prerequis:
      "Maîtrise des outils informatiques de base + capacités relationnelles, d'animation et d'expression (évaluées par entretien)",
    prixIndicatif: 'Sur devis',
    modalite: 'Présentiel / Distanciel / Mixte',
    inscription: '15 jours avant + entretien de positionnement',
    recyclage: 'Conseillé tous les 36 mois',
  },
  objectifs:
    "À l'issue de la formation (60 % de pratique), le stagiaire est capable d'identifier les besoins des futurs bénéficiaires et de définir des objectifs opérationnels adaptés, de concevoir une ingénierie pédagogique adaptée aux objectifs, d'animer une action de formation en s'appuyant sur son ingénierie, et de définir des modalités d'évaluation pour chaque bénéficiaire. Certification : Formateur de Formateurs Qualiopi.",
  programme: [
    {
      titre: 'Introduction — Cadre réglementaire & rôle du formateur',
      points: [
        'Réglementation de la formation professionnelle continue et démarche qualité',
        'Rôles et missions du formateur externe et interne',
      ],
    },
    {
      titre: 'Module 1 — Ingénierie de formation',
      points: [
        "Créer son questionnaire d'analyse des besoins",
        'Identifier les objectifs stratégiques lors de la demande de formation',
        'Définir des objectifs opérationnels et évaluables',
      ],
    },
    {
      titre: 'Module 2 — Ingénierie pédagogique',
      points: [
        "De la pédagogie vers l'andragogie — conditions d'apprentissage de l'adulte",
        'Méthodes et techniques pédagogiques — identifier les personnalités du public',
        "Identifier ou créer des outils d'animation — méthodes d'évaluation",
        'Définir une progression pédagogique',
      ],
    },
    {
      titre: 'Module 3 — Animer son déroulé pédagogique',
      points: [
        "Définir un mode d'animation adapté (présentiel, distanciel…)",
        'Animer une action de formation : préparation, mise en œuvre, gestion des dysfonctionnements',
        "Mettre en œuvre différentes méthodes d'évaluation",
      ],
    },
    {
      titre: 'Module 4 — Veille réglementaire & métier',
      points: [
        'Veille réglementaire — veille métier — veille pédagogique',
      ],
    },
  ],
  evaluation:
    "Évaluation formative continue (grille individuelle) + épreuve sommative le dernier jour (mise en situation d'animation). Certificat de réalisation de formateur + Attestation de compétences.",
  referencesReglementaires:
    "Formation professionnelle continue — Article L.6311-1 du Code du travail — Qualiopi — Référentiel National Qualité (RNQ).",
  formationsLiees: ['formateur-sst', 'formateur-incendie-gestes-postures', 'formateur-professionnel-adultes-fpa'],
  seo: {
    title: 'Formateur Indépendant et / ou Interne | C-KIM Formation',
    description:
      "Formation Formateur de Formateurs (35h) — ingénierie de formation et pédagogie pour devenir formateur indépendant ou interne. Certifiée Qualiopi en PACA.",
  },
};
