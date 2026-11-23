// Bilan de fin de formation : niveau d'acquisition des compétences par stagiaire
// (logique pure, partagée entre l'espace formateur, l'admin, l'entreprise et le
// stagiaire).

export const NIVEAUX = ['acquise', 'en_cours', 'non_acquise'] as const;
export type Niveau = (typeof NIVEAUX)[number];

export const NIVEAU_LABEL: Record<Niveau, string> = {
  acquise: 'Acquise',
  en_cours: 'En cours d’acquisition',
  non_acquise: 'Non acquise',
};

export function isNiveau(value: unknown): value is Niveau {
  return typeof value === 'string' && (NIVEAUX as readonly string[]).includes(value);
}

/** Nombre de compétences par niveau (les compétences sans niveau sont ignorées). */
export function countNiveaux(
  competenceIds: string[],
  niveaux: Record<string, Niveau | undefined>
): Record<Niveau, number> {
  const out: Record<Niveau, number> = { acquise: 0, en_cours: 0, non_acquise: 0 };
  for (const id of competenceIds) {
    const n = niveaux[id];
    if (n) out[n] += 1;
  }
  return out;
}

/** Compétences de la formation qui n'ont pas encore de niveau pour ce stagiaire. */
export function competencesManquantes(
  competenceIds: string[],
  niveaux: Record<string, Niveau | undefined>
): string[] {
  return competenceIds.filter((id) => !niveaux[id]);
}

export type BilanStatut = 'complet' | 'en_cours' | 'a_remplir';

/**
 * Avancement du bilan d'un stagiaire : complet quand tous les questionnaires
 * d'évaluation formateur sont remplis ET que chaque compétence a un niveau.
 */
export function bilanStatut(input: {
  evaluationsTotal: number;
  evaluationsRemplies: number;
  competencesTotal: number;
  competencesEvaluees: number;
}): BilanStatut {
  const total = input.evaluationsTotal + input.competencesTotal;
  const done =
    Math.min(input.evaluationsRemplies, input.evaluationsTotal) +
    Math.min(input.competencesEvaluees, input.competencesTotal);
  if (total > 0 && done >= total) return 'complet';
  return done > 0 ? 'en_cours' : 'a_remplir';
}
