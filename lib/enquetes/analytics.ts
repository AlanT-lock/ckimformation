import type { QuestionType } from '@/lib/supabase/types';

/**
 * Convention notation enquêtes :
 *  - les questions de type 'echelle' fournissent la satisfaction.
 *  - 1 = note la plus basse, echelle_max = note la plus haute.
 *  - score normalisé = (valeur - 1) / (max - 1) * 100  → 0% à 100%.
 */

export interface ScaleReponse {
  echelleMax: number;
  valeur: number;
}

export function normalizeScale(valeur: number, echelleMax: number): number | null {
  if (!echelleMax || echelleMax < 2) return null;
  if (valeur < 1 || valeur > echelleMax) return null;
  return ((valeur - 1) / (echelleMax - 1)) * 100;
}

/** Moyenne normalisée 0-100 sur un ensemble de réponses échelle. */
export function averageScalePct(items: ScaleReponse[]): number | null {
  const scores = items
    .map((it) => normalizeScale(it.valeur, it.echelleMax))
    .filter((v): v is number => v !== null);
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/** Distribution par bucket de score (0-20, 20-40, 40-60, 60-80, 80-100). */
export function distributionBuckets(items: ScaleReponse[]): number[] {
  const buckets = [0, 0, 0, 0, 0];
  for (const it of items) {
    const pct = normalizeScale(it.valeur, it.echelleMax);
    if (pct === null) continue;
    const i = Math.min(4, Math.floor(pct / 20));
    buckets[i]++;
  }
  return buckets;
}

/** Parse une valeur de réponse à une question 'echelle'. */
export function parseScaleValue(valeur: string | null): number | null {
  if (!valeur) return null;
  const n = Number(valeur);
  return Number.isFinite(n) ? n : null;
}

/** Extrait la/les valeurs choisies pour une question QCM. */
export function parseQcmValue(type: QuestionType, valeurJson: unknown): string[] {
  if (type === 'qcm_unique') {
    const v = valeurJson as { value?: string | null } | null;
    return v?.value ? [v.value] : [];
  }
  if (type === 'qcm_multiple') {
    const v = valeurJson as { values?: string[] } | null;
    return Array.isArray(v?.values) ? v!.values : [];
  }
  return [];
}

/** Décrit le contenu d'une réponse libre (texte_libre / liste) si non vide. */
export function parseTextValue(type: QuestionType, valeur: string | null): string | null {
  if (type !== 'texte_libre' && type !== 'liste') return null;
  const v = (valeur ?? '').trim();
  return v.length > 0 ? v : null;
}
