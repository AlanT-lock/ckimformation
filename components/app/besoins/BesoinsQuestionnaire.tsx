'use client';

import type { BesoinAnswerInput, BesoinQuestion } from '@/lib/besoins/answers';

export type BesoinAnswerState =
  | { kind: 'text'; value: string }
  | { kind: 'single'; value: string | null; followup: string }
  | { kind: 'multi'; values: string[] }
  | { kind: 'echelle'; value: number | null };

export type BesoinsState = Record<string, BesoinAnswerState>;

function emptyAnswer(q: BesoinQuestion): BesoinAnswerState {
  switch (q.type_reponse) {
    case 'qcm_unique': return { kind: 'single', value: null, followup: '' };
    case 'qcm_multiple': return { kind: 'multi', values: [] };
    case 'echelle': return { kind: 'echelle', value: null };
    default: return { kind: 'text', value: '' };
  }
}

export function emptyBesoinsState(questions: BesoinQuestion[]): BesoinsState {
  return Object.fromEntries(questions.map((q) => [q.id, emptyAnswer(q)]));
}

/** Même format que les réponses des enquêtes (validé côté serveur). */
export function toBesoinsInputs(questions: BesoinQuestion[], state: BesoinsState): BesoinAnswerInput[] {
  return questions.map((q) => {
    const a = state[q.id] ?? emptyAnswer(q);
    if (a.kind === 'single') {
      const needs = a.value !== null && q.follow_up_options.includes(a.value);
      const f = needs ? a.followup.trim() : '';
      return { question_id: q.id, valeur_json: f ? { value: a.value, followup: f } : { value: a.value } };
    }
    if (a.kind === 'multi') return { question_id: q.id, valeur_json: { values: a.values } };
    if (a.kind === 'echelle') return { question_id: q.id, valeur: a.value === null ? null : String(a.value) };
    return { question_id: q.id, valeur: a.value };
  });
}

/** Premier problème bloquant (question obligatoire vide, « précisez » manquant), sinon null. */
export function besoinsClientError(questions: BesoinQuestion[], state: BesoinsState): string | null {
  for (const [i, q] of questions.entries()) {
    const a = state[q.id] ?? emptyAnswer(q);
    const answered =
      a.kind === 'text' ? a.value.trim().length > 0
        : a.kind === 'single' ? a.value !== null
          : a.kind === 'multi' ? a.values.length > 0
            : a.value !== null;
    if (q.required && !answered) return `Analyse des besoins : la question ${i + 1} est obligatoire.`;
    if (a.kind === 'single' && a.value !== null && q.follow_up_options.includes(a.value) && !a.followup.trim()) {
      return `Analyse des besoins : merci de préciser votre réponse à la question ${i + 1}.`;
    }
  }
  return null;
}

export function BesoinsQuestionnaire({
  questions,
  value,
  onChange,
}: {
  questions: BesoinQuestion[];
  value: BesoinsState;
  onChange: (next: BesoinsState) => void;
}) {
  if (questions.length === 0) return null;
  return (
    <ol className="space-y-5">
      {questions.map((q, i) => (
        <li key={q.id}>
          <p className="text-sm font-medium text-dark">
            <span className="text-dark/40 mr-1">{i + 1}.</span>
            {q.libelle}
            {q.required && <span className="text-orange ml-1" aria-label="obligatoire">*</span>}
          </p>
          <div className="mt-2">
            <QuestionInput
              question={q}
              answer={value[q.id] ?? emptyAnswer(q)}
              onChange={(a) => onChange({ ...value, [q.id]: a })}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

function QuestionInput({
  question, answer, onChange,
}: {
  question: BesoinQuestion; answer: BesoinAnswerState; onChange: (a: BesoinAnswerState) => void;
}) {
  const t = question.type_reponse;

  if (t === 'qcm_unique') {
    const a = answer as Extract<BesoinAnswerState, { kind: 'single' }>;
    const needs = a.value !== null && question.follow_up_options.includes(a.value);
    return (
      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <label key={i} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name={`besoins-${question.id}`}
              checked={a.value === opt}
              onChange={() => onChange({ kind: 'single', value: opt, followup: a.value === opt ? a.followup : '' })}
              className="h-4 w-4 accent-teal"
            />
            <span className="text-sm">{opt}</span>
          </label>
        ))}
        {needs && (
          <div className="mt-3 pl-7 border-l-2 border-teal/30">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-teal">Précisez</span>
              <textarea
                value={a.followup}
                onChange={(e) => onChange({ kind: 'single', value: a.value, followup: e.target.value })}
                rows={2}
                maxLength={2000}
                placeholder="Votre précision…"
                className="mt-1 w-full bg-white border border-dark/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
              />
            </label>
          </div>
        )}
      </div>
    );
  }
  if (t === 'qcm_multiple') {
    const a = answer as Extract<BesoinAnswerState, { kind: 'multi' }>;
    return (
      <div className="space-y-2">
        {question.options.map((opt, i) => {
          const checked = a.values.includes(opt);
          return (
            <label key={i} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange({
                  kind: 'multi',
                  values: checked ? a.values.filter((v) => v !== opt) : [...a.values, opt],
                })}
                className="h-4 w-4 accent-teal"
              />
              <span className="text-sm">{opt}</span>
            </label>
          );
        })}
      </div>
    );
  }
  if (t === 'echelle') {
    const a = answer as Extract<BesoinAnswerState, { kind: 'echelle' }>;
    const max = question.echelle_max ?? 5;
    return (
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={a.value === n}
            onClick={() => onChange({ kind: 'echelle', value: n })}
            className={`w-10 h-10 rounded-full border transition ${
              a.value === n ? 'bg-teal border-teal text-white' : 'bg-white border-dark/20 hover:border-dark/40'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    );
  }
  const a = answer as Extract<BesoinAnswerState, { kind: 'text' }>;
  return t === 'liste' ? (
    <input
      type="text"
      value={a.value}
      maxLength={5000}
      onChange={(e) => onChange({ kind: 'text', value: e.target.value })}
      className="w-full bg-white border border-dark/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
    />
  ) : (
    <textarea
      value={a.value}
      rows={3}
      maxLength={5000}
      onChange={(e) => onChange({ kind: 'text', value: e.target.value })}
      className="w-full bg-white border border-dark/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
    />
  );
}

/** Pré-remplit le questionnaire à partir de réponses déjà enregistrées (instantané). */
export function besoinsStateFromSnapshot(
  questions: BesoinQuestion[],
  answers: Array<{ question_id: string; reponse: string; precision?: string }>
): BesoinsState {
  const state = emptyBesoinsState(questions);
  const byId = new Map(answers.map((a) => [a.question_id, a]));
  for (const q of questions) {
    const a = byId.get(q.id);
    if (!a || !a.reponse) continue;
    if (q.type_reponse === 'qcm_unique') {
      if (q.options.includes(a.reponse)) state[q.id] = { kind: 'single', value: a.reponse, followup: a.precision ?? '' };
    } else if (q.type_reponse === 'qcm_multiple') {
      const parts = a.reponse.split(', ');
      state[q.id] = { kind: 'multi', values: q.options.filter((o) => parts.includes(o)) };
    } else if (q.type_reponse === 'echelle') {
      const n = Number(a.reponse.split('/')[0]);
      if (Number.isInteger(n)) state[q.id] = { kind: 'echelle', value: n };
    } else {
      state[q.id] = { kind: 'text', value: a.reponse };
    }
  }
  return state;
}
