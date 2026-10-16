// Analyse des besoins : validation des réponses, instantané des questions et
// résumé texte (logique pure, partagée client / serveur).
import type { QuestionType } from '@/lib/supabase/types';

export interface BesoinQuestion {
  id: string;
  ordre: number;
  libelle: string;
  type_reponse: QuestionType;
  options: string[];
  echelle_max: number | null;
  required: boolean;
  follow_up_options: string[];
}

/** Même format que les réponses des enquêtes (responses.valeur / valeur_json). */
export interface BesoinAnswerInput {
  question_id: string;
  valeur?: string | null;
  valeur_json?: unknown;
}

/** Instantané conservé avec la demande : la trace reste exacte si les questions changent. */
export interface BesoinAnswerSnapshot {
  question_id: string;
  ordre: number;
  libelle: string;
  type: QuestionType;
  reponse: string;
  precision?: string;
}

function readSingle(v: unknown): { value: string | null; followup: string } {
  if (typeof v === 'string') return { value: v, followup: '' };
  if (v && typeof v === 'object') {
    const o = v as { value?: unknown; followup?: unknown };
    return {
      value: typeof o.value === 'string' ? o.value : null,
      followup: typeof o.followup === 'string' ? o.followup.trim() : '',
    };
  }
  return { value: null, followup: '' };
}

function readMulti(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (v && typeof v === 'object' && Array.isArray((v as { values?: unknown }).values)) {
    return ((v as { values: unknown[] }).values).map(String);
  }
  return [];
}

/**
 * Vérifie les réponses (questions obligatoires, « précisez », valeurs
 * autorisées) et construit l'instantané. Les réponses à des questions
 * inconnues sont ignorées.
 */
export function buildBesoinsSnapshot(
  questions: BesoinQuestion[],
  inputs: BesoinAnswerInput[]
): { ok: true; answers: BesoinAnswerSnapshot[] } | { ok: false; error: string } {
  const byId = new Map(inputs.map((i) => [i.question_id, i]));
  const answers: BesoinAnswerSnapshot[] = [];
  const sorted = questions.slice().sort((a, b) => a.ordre - b.ordre);

  for (const [index, q] of sorted.entries()) {
    const n = index + 1;
    const input = byId.get(q.id);
    let reponse = '';
    let precision: string | undefined;

    if (q.type_reponse === 'qcm_unique') {
      const { value, followup } = readSingle(input?.valeur_json ?? input?.valeur);
      if (value !== null && !q.options.includes(value)) return { ok: false, error: `Question ${n} : réponse invalide.` };
      reponse = value ?? '';
      if (value !== null && q.follow_up_options.includes(value)) {
        if (!followup) return { ok: false, error: `Question ${n} : merci de préciser votre réponse.` };
        precision = followup;
      }
    } else if (q.type_reponse === 'qcm_multiple') {
      const values = readMulti(input?.valeur_json);
      if (values.some((v) => !q.options.includes(v))) return { ok: false, error: `Question ${n} : réponse invalide.` };
      reponse = values.join(', ');
    } else if (q.type_reponse === 'echelle') {
      const raw = (input?.valeur ?? '').toString().trim();
      if (raw) {
        const v = Number(raw);
        const max = q.echelle_max ?? 5;
        if (!Number.isInteger(v) || v < 1 || v > max) return { ok: false, error: `Question ${n} : réponse invalide.` };
        reponse = `${v} / ${max}`;
      }
    } else {
      reponse = (input?.valeur ?? '').toString().trim();
      if (reponse.length > 5000) return { ok: false, error: `Question ${n} : réponse trop longue.` };
    }

    if (q.required && !reponse) return { ok: false, error: `La question ${n} est obligatoire.` };
    answers.push({
      question_id: q.id,
      ordre: n,
      libelle: q.libelle,
      type: q.type_reponse,
      reponse,
      ...(precision ? { precision } : {}),
    });
  }
  return { ok: true, answers };
}

/** Résumé texte (« 1. Question\nRéponse ») stocké sur la demande pour les écrans et emails existants. */
export function besoinsSummary(answers: BesoinAnswerSnapshot[]): string {
  return answers
    .map((a) => {
      const rep = a.reponse || '—';
      return `${a.ordre}. ${a.libelle}\n${rep}${a.precision ? ` (${a.precision})` : ''}`;
    })
    .join('\n\n');
}
