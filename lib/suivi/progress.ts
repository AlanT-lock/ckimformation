// Suivi de formation : journées, progression et badges (logique pure, partagée
// entre l'espace formateur, l'admin et l'espace entreprise).

export const SUIVI_DAYS_AFTER_END = 30;

export interface SuiviBadge {
  seuil: number; // pourcentage
  label: string;
  emoji: string;
  atteint: boolean;
}

const BADGES: Array<Omit<SuiviBadge, 'atteint'>> = [
  { seuil: 25, label: 'Démarrage', emoji: '🥉' },
  { seuil: 50, label: 'Mi-parcours', emoji: '🥈' },
  { seuil: 75, label: 'Dernière ligne droite', emoji: '🥇' },
  { seuil: 100, label: 'Objectif atteint', emoji: '🏆' },
];

/** Dates distinctes (YYYY-MM-DD) des créneaux, triées. */
export function sessionDays(creneaux: Array<{ date: string }>): string[] {
  return Array.from(new Set(creneaux.map((c) => c.date))).sort();
}

/** Ajoute `n` jours à une date YYYY-MM-DD. */
export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** La section de suivi est visible du premier jour à 30 jours après le dernier. */
export function isSuiviVisible(days: string[], today: string): boolean {
  if (days.length === 0) return false;
  return days[0] <= today && today <= addDays(days[days.length - 1], SUIVI_DAYS_AFTER_END);
}

/** Pourcentage arrondi (0-100) ; 0 si total nul. */
export function pct(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

/**
 * Progression d'une session : sur les compétences si la formation en a,
 * sinon sur les journées terminées.
 */
export function sessionProgress(input: {
  competencesTotal: number;
  competencesVues: number;
  journeesTotal: number;
  journeesTerminees: number;
}): { percent: number; basis: 'competences' | 'journees' } {
  if (input.competencesTotal > 0) {
    return { percent: pct(input.competencesVues, input.competencesTotal), basis: 'competences' };
  }
  return { percent: pct(input.journeesTerminees, input.journeesTotal), basis: 'journees' };
}

export function badgesFor(percent: number): SuiviBadge[] {
  return BADGES.map((b) => ({ ...b, atteint: percent >= b.seuil }));
}

/** Le formateur peut terminer une journée dès sa date (heure de Paris). */
export function canCloseDay(day: string, today: string): boolean {
  return day <= today;
}

/** Corrections possibles tant que la session n'est ni terminée ni annulée. */
export function isSessionEditable(statut: string): boolean {
  return statut !== 'completed' && statut !== 'cancelled';
}
