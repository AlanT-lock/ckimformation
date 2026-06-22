import type { QuestionType } from '@/lib/supabase/types';
import { evaluateQuestion, type ScoringResponse } from '@/lib/scoring';

export function renderAnswer(
  q: { type_reponse: QuestionType; options: string[] },
  valeur: string | null,
  valeurJson: unknown,
): React.ReactNode {
  switch (q.type_reponse) {
    case 'qcm_unique': {
      const json = (valeurJson ?? {}) as { value?: string | null; followup?: string };
      const value = json.value ?? valeur ?? null;
      if (!value) return <span>—</span>;
      return (
        <div>
          <span>{value}</span>
          {json.followup && (
            <p className="mt-1 text-xs text-dark/60 italic whitespace-pre-wrap">
              Précision : {json.followup}
            </p>
          )}
        </div>
      );
    }
    case 'qcm_multiple': {
      const json = (valeurJson ?? {}) as { values?: string[] };
      const arr = Array.isArray(json.values)
        ? json.values
        : Array.isArray(valeurJson)
          ? (valeurJson as string[])
          : [];
      if (arr.length === 0) return <span>—</span>;
      return <ul className="list-disc list-inside">{arr.map((v, i) => <li key={i}>{v}</li>)}</ul>;
    }
    case 'echelle':
      return <span>{valeur ?? '—'}</span>;
    case 'texte_libre':
    case 'liste':
    default:
      return <span className="whitespace-pre-wrap">{valeur || '—'}</span>;
  }
}

export interface AnswerListQuestion {
  id: string;
  libelle: string;
  type_reponse: QuestionType;
  options: string[];
  bonne_reponse: unknown;
}

export function TestAnswerList({
  questions,
  responses,
  showCorrectness = false,
}: {
  questions: AnswerListQuestion[];
  responses: ScoringResponse[];
  showCorrectness?: boolean;
}) {
  const byQ = new Map(responses.map((r) => [r.question_id, r]));
  if (questions.length === 0) {
    return <p className="text-sm text-dark/50">Aucune question.</p>;
  }
  return (
    <ol className="mt-3 space-y-3">
      {questions.map((q, i) => {
        const r = byQ.get(q.id);
        const verdict = showCorrectness
          ? evaluateQuestion(
              { id: q.id, type_reponse: q.type_reponse, bonne_reponse: q.bonne_reponse, options: q.options },
              r,
            )
          : null;
        return (
          <li key={q.id} className="text-sm">
            <p className="font-medium flex items-start gap-2">
              <span className="text-dark/40">{i + 1}.</span>
              <span className="flex-1">{q.libelle}</span>
              {verdict === 'correct' && <span className="text-teal text-xs whitespace-nowrap">✓ juste</span>}
              {verdict === 'incorrect' && <span className="text-orange text-xs whitespace-nowrap">✗ faux</span>}
            </p>
            <div className="mt-1 pl-5 text-dark/80">
              {renderAnswer({ type_reponse: q.type_reponse, options: q.options }, r?.valeur ?? null, r?.valeur_json ?? null)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
