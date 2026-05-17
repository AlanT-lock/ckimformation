'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { submitFormateurEvaluation, type ResponseInput } from '../../actions';
import type { QuestionType } from '@/lib/supabase/types';

interface Question {
  id: string;
  ordre: number;
  libelle: string;
  type_reponse: QuestionType;
  options: string[];
  echelle_max: number | null;
  required: boolean;
  follow_up_options: string[];
}

interface ExistingResponse {
  question_id: string;
  valeur: string | null;
  valeur_json: unknown;
}

type AnswerState =
  | { kind: 'text'; value: string }
  | { kind: 'single'; value: string | null; followup: string }
  | { kind: 'multi'; values: string[] }
  | { kind: 'echelle'; value: number | null };

function emptyAnswer(q: Question): AnswerState {
  switch (q.type_reponse) {
    case 'qcm_unique': return { kind: 'single', value: null, followup: '' };
    case 'qcm_multiple': return { kind: 'multi', values: [] };
    case 'echelle': return { kind: 'echelle', value: null };
    default: return { kind: 'text', value: '' };
  }
}

function hydrateAnswer(q: Question, r: ExistingResponse | undefined): AnswerState {
  if (!r) return emptyAnswer(q);
  const t = q.type_reponse;
  if (t === 'qcm_unique') {
    const json = r.valeur_json as { value?: string | null; followup?: string } | null;
    return { kind: 'single', value: json?.value ?? null, followup: json?.followup ?? '' };
  }
  if (t === 'qcm_multiple') {
    const json = r.valeur_json as { values?: string[] } | null;
    return { kind: 'multi', values: json?.values ?? [] };
  }
  if (t === 'echelle') {
    const n = r.valeur ? Number(r.valeur) : null;
    return { kind: 'echelle', value: Number.isFinite(n) ? n : null };
  }
  return { kind: 'text', value: r.valeur ?? '' };
}

function toResponse(q: Question, a: AnswerState): ResponseInput {
  if (a.kind === 'single') {
    const needsFollowup = a.value !== null && q.follow_up_options.includes(a.value);
    const followup = needsFollowup ? a.followup.trim() : '';
    return { question_id: q.id, valeur_json: followup ? { value: a.value, followup } : { value: a.value } };
  }
  if (a.kind === 'multi')  return { question_id: q.id, valeur_json: { values: a.values } };
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

function followupMissing(q: Question, a: AnswerState): boolean {
  if (a.kind !== 'single' || a.value === null) return false;
  if (!q.follow_up_options.includes(a.value)) return false;
  return a.followup.trim().length === 0;
}

export function EvaluationForm({
  sessionId,
  testId,
  participantId,
  questions,
  existingResponses,
}: {
  sessionId: string;
  testId: string;
  participantId: string;
  questions: Question[];
  existingResponses: ExistingResponse[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const initialByQ = new Map(existingResponses.map((r) => [r.question_id, r]));
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, hydrateAnswer(q, initialByQ.get(q.id))]))
  );

  function set(qid: string, a: AnswerState) {
    setAnswers((s) => ({ ...s, [qid]: a }));
    setSuccess(false);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    for (const q of questions) {
      const a = answers[q.id];
      if (q.required && !isAnswered(a)) {
        setError(`La question ${q.ordre} est obligatoire.`);
        return;
      }
      if (q.required && followupMissing(q, a)) {
        setError(`Question ${q.ordre} : précisez votre réponse dans le champ texte.`);
        return;
      }
    }
    const payload = questions
      .filter((q) => isAnswered(answers[q.id]))
      .map((q) => toResponse(q, answers[q.id]));

    startTransition(async () => {
      try {
        await submitFormateurEvaluation(sessionId, testId, participantId, payload);
        setSuccess(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur');
      }
    });
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white border border-dark/10 rounded-lg p-6 text-sm text-dark/60">
        Cette évaluation ne contient aucune question.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">{error}</div>
      )}
      {success && (
        <div className="text-sm text-teal bg-teal/10 border border-teal/30 rounded p-3">
          Évaluation enregistrée.
        </div>
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
                <QuestionInput question={q} answer={answers[q.id]} onChange={(a) => set(q.id, a)} />
              </div>
            </div>
          </div>
        </div>
      ))}

      <Button type="submit" disabled={pending}>
        {pending ? 'Enregistrement…' : 'Enregistrer l\'évaluation'}
      </Button>
    </form>
  );
}

function QuestionInput({
  question,
  answer,
  onChange,
}: {
  question: Question;
  answer: AnswerState;
  onChange: (a: AnswerState) => void;
}) {
  const t = question.type_reponse;

  if (t === 'qcm_unique') {
    const a = answer as Extract<AnswerState, { kind: 'single' }>;
    const needsFollowup = a.value !== null && question.follow_up_options.includes(a.value);
    return (
      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <label key={i} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name={question.id}
              checked={a.value === opt}
              onChange={() => onChange({ kind: 'single', value: opt, followup: a.value === opt ? a.followup : '' })}
            />
            <span className="text-sm">{opt}</span>
          </label>
        ))}
        {needsFollowup && (
          <div className="mt-3 pl-7 border-l-2 border-teal/30">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-teal">Précisez</span>
              <textarea
                value={a.followup}
                onChange={(e) => onChange({ kind: 'single', value: a.value, followup: e.target.value })}
                rows={2}
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
                onChange={() => {
                  const next = checked ? a.values.filter((v) => v !== opt) : [...a.values, opt];
                  onChange({ kind: 'multi', values: next });
                }}
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
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange({ kind: 'echelle', value: n })}
            className={`w-10 h-10 rounded border text-sm font-medium transition ${
              a.value === n
                ? 'bg-teal text-white border-teal'
                : 'bg-white border-dark/15 hover:border-teal'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    );
  }

  if (t === 'liste') {
    const a = answer as Extract<AnswerState, { kind: 'text' }>;
    return (
      <input
        type="text"
        value={a.value}
        onChange={(e) => onChange({ kind: 'text', value: e.target.value })}
        className="w-full bg-white border border-dark/15 rounded px-3 py-2 focus:outline-none focus:border-teal"
      />
    );
  }

  const a = answer as Extract<AnswerState, { kind: 'text' }>;
  return (
    <textarea
      value={a.value}
      onChange={(e) => onChange({ kind: 'text', value: e.target.value })}
      rows={4}
      className="w-full bg-white border border-dark/15 rounded px-3 py-2 focus:outline-none focus:border-teal"
    />
  );
}
