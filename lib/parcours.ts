import type { Parcours } from './types/formation';

export interface ParcoursMeta {
  label: string;
  couleur: string;
  description: string;
}

export const PARCOURS_META: Record<Parcours, ParcoursMeta> = {
  securite: {
    label: 'Sécurité',
    couleur: '#1B8FA0',
    description: 'Incendie, habilitations électriques, prévention des risques sur le terrain.',
  },
  alimentaire: {
    label: 'Sécurité Alimentaire',
    couleur: '#2E9E6A',
    description: 'Méthode HACCP et hygiène en restauration collective et commerciale.',
  },
  prevention: {
    label: 'Prévention & Conformité',
    couleur: '#C4532A',
    description: 'DUERP, accompagnement clé en main, conformité réglementaire.',
  },
  management: {
    label: 'Management S&ST',
    couleur: '#6A4ABE',
    description: 'Élaboration DUERP et pilotage de la santé-sécurité au travail.',
  },
  formateurs: {
    label: 'Formateurs — Sécurité & Ingénierie',
    couleur: '#E8692A',
    description: 'Devenir formateur SST, incendie, gestes & postures, indépendant ou interne.',
  },
  developpement: {
    label: 'Développement Personnel',
    couleur: '#2A7E9E',
    description: 'PNL et préparation au contrôle Qualiopi pour formateurs.',
  },
  qualite: {
    label: 'Qualité & Conformité',
    couleur: '#2A5E9E',
    description: 'Préparer un contrôle qualité Qualiopi (RNQ).',
  },
  certifiant: {
    label: 'Certifiant — Titre Professionnel',
    couleur: '#9E7A2A',
    description: "Titre professionnel Formateur Professionnel d'Adultes (FPA).",
  },
};

export function getParcoursMeta(p: Parcours): ParcoursMeta {
  return PARCOURS_META[p];
}
