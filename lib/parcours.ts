import type { Parcours } from './types/formation';

export interface ParcoursMeta {
  label: string;
  couleur: string;
}

export const PARCOURS_META: Record<Parcours, ParcoursMeta> = {
  securite: {
    label: 'Sécurité',
    couleur: '#1B8FA0',
  },
  alimentaire: {
    label: 'Sécurité Alimentaire',
    couleur: '#2E9E6A',
  },
  prevention: {
    label: 'Prévention & Conformité',
    couleur: '#C4532A',
  },
  management: {
    label: 'Management S&ST',
    couleur: '#6A4ABE',
  },
  formateurs: {
    label: 'Formateurs — Sécurité & Ingénierie',
    couleur: '#E8692A',
  },
  developpement: {
    label: 'Développement Personnel',
    couleur: '#2A7E9E',
  },
  qualite: {
    label: 'Qualité & Conformité',
    couleur: '#2A5E9E',
  },
  certifiant: {
    label: 'Certifiant — Titre Professionnel',
    couleur: '#9E7A2A',
  },
};

export function getParcoursMeta(p: Parcours): ParcoursMeta {
  return PARCOURS_META[p];
}

/**
 * Résumé d'un parcours à partir des intitulés de ses formations actives :
 * les premiers intitulés, puis le nombre de formations restantes. Le texte suit
 * donc le catalogue enregistré en base, sans description à maintenir à la main.
 */
export function summarizeTitres(titres: string[], max = 3): string {
  const shown = titres.slice(0, max);
  const rest = titres.length - shown.length;
  if (rest > 0) shown.push(`+ ${rest} autre${rest > 1 ? 's' : ''}`);
  return shown.join(' · ');
}
