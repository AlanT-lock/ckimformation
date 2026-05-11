import type { QuestionType } from '@/lib/supabase/types';

export interface ScoringQuestion {
  id: string;
  type_reponse: QuestionType;
  bonne_reponse: unknown;
  options: string[];
}

export interface ScoringResponse {
  question_id: string;
  valeur: string | null;
  valeur_json: unknown;
}

export interface ScoringResult {
  totalEvaluable: number;
  correct: number;
  scorePct: number | null;
}

function asSet(v: unknown): Set<string> {
  if (Array.isArray(v)) return new Set(v.map(String));
  if (v && typeof v === 'object' && 'values' in v) {
    const vs = (v as { values: unknown }).values;
    if (Array.isArray(vs)) return new Set(vs.map(String));
  }
  return new Set();
}

function asScalar(v: unknown): string | null {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (v && typeof v === 'object' && 'value' in v) {
    const val = (v as { value: unknown }).value;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
  }
  return null;
}

/**
 * Score = % de QCM bien répondus.
 * Seules les questions de type qcm_unique / qcm_multiple comptent, ET
 * uniquement si une bonne_reponse est définie côté admin.
 */
export function computeScore(
  questions: ScoringQuestion[],
  responses: ScoringResponse[]
): ScoringResult {
  const byQ = new Map(responses.map((r) => [r.question_id, r]));
  let totalEvaluable = 0;
  let correct = 0;

  for (const q of questions) {
    if (q.type_reponse !== 'qcm_unique' && q.type_reponse !== 'qcm_multiple') continue;
    if (q.bonne_reponse === null || q.bonne_reponse === undefined) continue;
    totalEvaluable++;
    const r = byQ.get(q.id);
    if (!r) continue;

    if (q.type_reponse === 'qcm_unique') {
      const userAnswer = asScalar(r.valeur_json) ?? r.valeur ?? null;
      const correctAnswer = typeof q.bonne_reponse === 'string' ? q.bonne_reponse : null;
      if (userAnswer && correctAnswer && userAnswer === correctAnswer) {
        correct++;
      }
    } else {
      // qcm_multiple : exact match (ni plus ni moins)
      const userAnswers = asSet(r.valeur_json);
      const correctAnswers = asSet(q.bonne_reponse);
      if (
        userAnswers.size === correctAnswers.size
        && [...userAnswers].every((a) => correctAnswers.has(a))
      ) {
        correct++;
      }
    }
  }

  const scorePct = totalEvaluable === 0 ? null : Math.round((correct / totalEvaluable) * 100);
  return { totalEvaluable, correct, scorePct };
}
