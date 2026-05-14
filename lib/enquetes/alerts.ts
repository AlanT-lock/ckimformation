import { normalizeScale, parseScaleValue } from './analytics';
import type { QuestionType } from '@/lib/supabase/types';

/**
 * Seuil (en %) en-dessous duquel une complétion d'enquête est considérée
 * comme un "mauvais résultat" et déclenche une alerte Qualiopi.
 *  - Le score est la moyenne normalisée 0-100 des questions de type 'echelle'.
 *  - Convention : 1 = note la plus basse, max = la meilleure.
 */
export const BAD_SCORE_THRESHOLD = 50;

export interface ScaleQ {
  echelle_max: number | null;
  type_reponse: QuestionType;
}

export interface ResponseRow {
  question_id: string;
  valeur: string | null;
}

/**
 * Calcule le score moyen normalisé (0-100) d'une complétion à partir de
 * ses réponses échelle, ou `null` si pas de question échelle répondue.
 */
export function completionScorePct(
  responses: ResponseRow[],
  questionById: Map<string, ScaleQ>
): number | null {
  const scores: number[] = [];
  for (const r of responses) {
    const q = questionById.get(r.question_id);
    if (!q || q.type_reponse !== 'echelle' || !q.echelle_max) continue;
    const v = parseScaleValue(r.valeur);
    if (v === null) continue;
    const pct = normalizeScale(v, q.echelle_max);
    if (pct === null) continue;
    scores.push(pct);
  }
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export function isBadScore(pct: number | null): boolean {
  return pct !== null && pct < BAD_SCORE_THRESHOLD;
}
