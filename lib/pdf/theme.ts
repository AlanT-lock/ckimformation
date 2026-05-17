import type { Parcours } from '@/lib/types/formation';

// Palette reprise à l'identique de la plaquette commerciale CKIM
export const COLORS = {
  teal: '#1B8FA0',
  tealDark: '#0F6070',
  tealLight: '#3AB5CA',
  orange: '#E8692A',
  orangeLight: '#F5954A',
  dark: '#0A1A1E',
  dark2: '#112228',
  mid: '#1C3038',
  text: '#D8EDEF',
  muted: '#7AACB2',
  white: '#FFFFFF',
  lightBg: '#EEF5F7',
  cardBg: '#FFFFFF',
  // Texte sur fonds clairs
  body: '#3A5A60',
  label: '#7A9AA0',
  // Accents sections
  refBg: '#FFF5EE',
  refText: '#8A4A2A',
  moduleBg: '#F0F8FA',
};

// Couleurs par parcours (alignées avec lib/parcours.ts ET la plaquette)
export const PARCOURS_COLOR: Record<Parcours, { main: string; light: string }> = {
  securite:      { main: '#1B8FA0', light: '#3AB5CA' },
  alimentaire:   { main: '#2E9E6A', light: '#4CBE8A' },
  prevention:    { main: '#C4532A', light: '#E07A4A' },
  management:    { main: '#6A4ABE', light: '#8A6ADE' },
  formateurs:    { main: '#E8692A', light: '#F5954A' },
  developpement: { main: '#2A7E9E', light: '#4A9EBE' },
  qualite:       { main: '#2A5E9E', light: '#4A7EBE' },
  certifiant:    { main: '#9E7A2A', light: '#BE9A4A' },
};

export function getParcoursColor(parcours: Parcours) {
  return PARCOURS_COLOR[parcours] ?? PARCOURS_COLOR.securite;
}

// Coordonnées CKIM (source de vérité utilisée dans toutes les pages publiques)
export const CKIM_CONTACT = {
  brand: 'C-KIM FORMATION',
  phone: '06 62 51 55 59',
  email: 'contact@ckimformation.fr',
  siret: '991 764 580 00015',
  site: 'ckim-formation.fr',
};
