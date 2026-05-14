'use client';

import { useState, useTransition } from 'react';
import { submitEnqueteFinanceur, type AnswerInput } from './actions';
import type { QuestionType } from '@/lib/supabase/types';

interface Question {
  id: string;
  ordre: number;
  libelle: string;
  type_reponse: QuestionType;
  options: string[];
  echelle_max: number | null;
  required: boolean;
}

type AnswerState =
  | { kind: 'text'; value: string }
  | { kind: 'single'; value: string | null }
  | { kind: 'multi'; values: string[] }
  | { kind: 'echelle'; value: number | null };

function emptyAnswer(q: Question): AnswerState {
  switch (q.type_reponse) {
    case 'qcm_unique': return { kind: 'single', value: null };
    case 'qcm_multiple': return { kind: 'multi', values: [] };
    case 'echelle': return { kind: 'echelle', value: null };
    default: return { kind: 'text', value: '' };
  }
}

function toResponse(q: Question, a: AnswerState): AnswerInput {
  if (a.kind === 'single') return { question_id: q.id, valeur_json: { value: a.value } };
  if (a.kind === 'multi') return { question_id: q.id, valeur_json: { values: a.values } };
  if (a.kind === 'echelle') return { question_id: q.id, valeur: a.value === null ? null : String(a.value) };
  return { question_id: q.id, valeur: a.value };
}

function isAnswered(a: AnswerState): boolean {
  if (a.kind === 'text') return a.value.trim().length > 0;
  if (a.kind === 'single') return a.value !== null;
  if (a.kind === 'multi') return a.values.length > 0;
  if (a.kind === 'echelle') return a.value !== null;
  return false;
}

export function AnswerFormFinanceur({ token, questions }: { token: string; questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, emptyAnswer(q)]))
  );
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function setA(qid: string, a: AnswerState) {
    setAnswers((s) => ({ ...s, [qid]: a }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    for (const q of questions) {
      if (q.required && !isAnswered(answers[q.id])) {
        setError(`La question ${q.ordre} est obligatoire.`);
        return;
      }
    }
    const payload = questions
      .filter((q) => isAnswered(answers[q.id]))
      .map((q) => toResponse(q, answers[q.id]));
    startTransition(async () => {
      const res = await submitEnqueteFinanceur(token, payload);
      if (!res.ok) { setError(res.error); return; }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="bg-teal/10 border border-teal/30 rounded-lg p-8 text-center space-y-3">
        <p className="text-4xl">✓</p>
        <h2 className="font-display text-2xl tracking-wide text-teal">Merci pour votre retour&nbsp;!</h2>
        <p className="text-sm text-dark/70">
          Vos réponses ont bien été enregistrées. Elles nous aident à améliorer la qualité de nos formations.
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white border border-dark/10 rounded-lg p-6 text-sm text-dark/60">
        Cette enquête ne contient aucune question pour le moment.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">{error}</div>
      )}

      {questions.map((q) => (
        <div key={q.id} className="bg-white border border-dark/10 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <span className="text-xs font-mono text-dark/40 mt-1">{q.ordre}.</span>
            <div className="flex-1">
              <p className="font-medium">
                {q.libelle}
                {q.required && <span className="text-orange ml-1">*</span>}
              </p>
              <div className="mt-3">
                <QuestionInput question={q} answer={answers[q.id]} onChange={(a) => setA(q.id, a)} />
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded text-sm font-medium bg-teal hover:bg-teal-l text-white disabled:opacity-50 transition"
      >
        {pending ? 'Envoi…' : 'Envoyer mes réponses'}
      </button>
    </form>
  );
}

function QuestionInput({
  question, answer, onChange,
}: {
  question: Question; answer: AnswerState; onChange: (a: AnswerState) => void;
}) {
  const t = question.type_reponse;

  if (t === 'qcm_unique') {
    const a = answer as Extract<AnswerState, { kind: 'single' }>;
    return (
      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <label key={i} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name={question.id}
              checked={a.value === opt}
              onChange={() => onChange({ kind: 'single', value: opt })}
              className="h-4 w-4 accent-teal"
            />
            <span className="text-sm">{opt}</span>
          </label>
        ))}
      </div>
    );
  }
  if (t === 'qcm_multiple') {
    const a = answer as Extract<AnswerState, { kind: 'multi' }>;
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
    const a = answer as Extract<AnswerState, { kind: 'echelle' }>;
    const max = question.echelle_max ?? 5;
    return (
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
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
  const a = answer as Extract<AnswerState, { kind: 'text' }>;
  return t === 'liste' ? (
    <input
      type="text"
      value={a.value}
      onChange={(e) => onChange({ kind: 'text', value: e.target.value })}
      className="w-full bg-white border border-dark/15 rounded px-3 py-2 text-dark focus:outline-none focus:border-teal"
    />
  ) : (
    <textarea
      value={a.value}
      onChange={(e) => onChange({ kind: 'text', value: e.target.value })}
      rows={3}
      className="w-full bg-white border border-dark/15 rounded px-3 py-2 text-dark focus:outline-none focus:border-teal"
    />
  );
}
