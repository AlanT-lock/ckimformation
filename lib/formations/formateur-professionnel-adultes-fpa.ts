import type { Formation } from '@/lib/types/formation';

export const formation: Formation = {
  slug: 'formateur-professionnel-adultes-fpa',
  titre: "Formateur Professionnel d'Adultes",
  sousTitre: 'FPA — Titre Professionnel RNCP Niveau 5 (Bac+2)',
  parcours: 'certifiant',
  ref: 'FPA-01/26/CKIM',
  hero: {
    image: '/images/formations/formateur-professionnel-adultes-fpa.jpg',
    alt: "Salle de formation pour adultes — animation pédagogique et certification FPA",
  },
  infosPratiques: {
    duree: '812 heures (29 semaines) — formation modulaire, durée adaptable',
    public:
      'Toute personne souhaitant exercer le métier de formateur professionnel — 8 à 12 personnes maximum',
    prerequis:
      "Niveau Bac minimum ou 3 ans d'expérience professionnelle + entretien de positionnement obligatoire",
    prixIndicatif: '6 000 € HT (parcours 29 semaines) — financement CPF, OPCO, France Travail, Région Sud',
    modalite: 'Présentiel / Distanciel / Mixte',
    inscription: '15 jours avant + entretien de positionnement',
    recyclage: 'Titre professionnel valable à vie — veille pédagogique conseillée',
  },
  objectifs:
    "Cette formation certifiante (70 % de pratique) prépare au Titre Professionnel Formateur Professionnel d'Adultes (RNCP37274 — Niveau 5, Bac+2). À l'issue du parcours, le stagiaire est capable de concevoir des dispositifs et séquences de formation adaptés aux besoins des apprenants, d'animer une formation en présentiel, distanciel ou mixte, d'accompagner les apprenants dans leur parcours, d'évaluer les acquis et les résultats, et d'inscrire son activité dans la démarche qualité Qualiopi.",
  programme: [
    {
      titre: 'Bloc 1 — Analyser les besoins et concevoir des dispositifs de formation',
      points: [
        'Analyser la demande — définir des objectifs pédagogiques opérationnels',
        'Concevoir le dispositif et le programme — choisir les modalités (présentiel, distanciel, AFEST)',
        'Concevoir outils et supports attractifs — intégrer la démarche Qualiopi',
      ],
    },
    {
      titre: "Bloc 2 — Animer une formation et créer les conditions d'apprentissage",
      points: [
        "Maîtriser les techniques d'animation — gérer la dynamique de groupe",
        'Animer en distanciel et en mode hybride — outils numériques, LMS',
        'Intégrer la Ludopédagogie et les outils interactifs en formation',
      ],
    },
    {
      titre: 'Bloc 3 — Évaluer les acquis et les résultats de la formation',
      points: [
        'Évaluations formatives, sommatives et certificatives',
        'Mesurer la satisfaction (questionnaires à chaud et à froid)',
        'Renseigner les outils de suivi Qualiopi',
      ],
    },
    {
      titre: "Bloc 4 — Accompagner les apprenants et gérer son activité de formateur",
      points: [
        "Tutorat, suivi individuel, adaptation aux difficultés d'apprentissage",
        'Gestion administrative, juridique et fiscale du formateur indépendant',
        'Veille pédagogique, réglementaire et métier — développement du réseau professionnel',
      ],
    },
  ],
  evaluation:
    "Mise en situation professionnelle devant jury + Rapport d'activité écrit + Entretien final oral devant jury certificateur. Obtention : Titre RNCP Niveau 5 — Formateur Professionnel d'Adultes. Débouchés : formateur en organisme, formateur interne, indépendant, consultant, coordinateur ou responsable formation.",
  referencesReglementaires:
    "Titre Professionnel Formateur Professionnel d'Adultes — RNCP37274 — NSF 332 — Niveau 5 (Bac+2) — Reconnu par France Compétences — Articles L.6313-1 et suivants du Code du travail — Référentiel Qualiopi (RNQ).",
  formationsLiees: ['formateur-independant-interne', 'preparer-controle-qualiopi'],
  seo: {
    title: 'FPA — Formateur Professionnel d\'Adultes (RNCP Niveau 5) | C-KIM Formation',
    description:
      "Titre Professionnel Formateur Professionnel d'Adultes — RNCP37274 Niveau 5 (Bac+2). 812h, 4 blocs, financement CPF/OPCO. Centre certifié Qualiopi en PACA.",
  },
};
