'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { submitTestResponses, type ResponseInput } from '../../actions';
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

function toResponse(q: Question, a: AnswerState): ResponseInput {
  if (a.kind === 'single') return { question_id: q.id, valeur_json: { value: a.value } };
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

const GOOGLE_REVIEW_URL = 'https://g.page/r/CbIN1WQ_itEyEAE/review';
const GOOGLE_REVIEW_FLAG = 'ckim_google_review_clicked';

export function TestResponseForm({
  sessionId,
  testId,
  isEnqueteChaud = false,
  questions,
}: {
  sessionId: string;
  testId: string;
  isEnqueteChaud?: boolean;
  questions: Question[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, emptyAnswer(q)]))
  );

  function set(qid: string, a: AnswerState) {
    setAnswers((s) => ({ ...s, [qid]: a }));
  }

  function closeReviewPopup() {
    setShowReviewPopup(false);
    router.replace(`/stagiaire/parcours/${sessionId}`);
    router.refresh();
  }

  function handleReviewClick() {
    try {
      window.localStorage.setItem(GOOGLE_REVIEW_FLAG, String(Date.now()));
    } catch {
      // ignore
    }
    window.open(GOOGLE_REVIEW_URL, '_blank', 'noopener,noreferrer');
    setShowReviewPopup(false);
    router.replace(`/stagiaire/parcours/${sessionId}`);
    router.refresh();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Vérifie required
    for (const q of questions) {
      const a = answers[q.id];
      if (q.required && !isAnswered(a)) {
        setError(`La question ${q.ordre} est obligatoire.`);
        return;
      }
    }
    const payload = questions
      .filter((q) => isAnswered(answers[q.id]))
      .map((q) => toResponse(q, answers[q.id]));

    startTransition(async () => {
      try {
        await submitTestResponses(sessionId, testId, payload);
        if (isEnqueteChaud) {
          setShowReviewPopup(true);
        } else {
          router.replace(`/stagiaire/parcours/${sessionId}`);
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur');
      }
    });
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white border border-dark/10 rounded-lg p-6 text-sm text-dark/60">
        Ce test ne contient aucune question.
      </div>
    );
  }

  return (
    <>
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
                  <QuestionInput question={q} answer={answers[q.id]} onChange={(a) => set(q.id, a)} />
                </div>
              </div>
            </div>
          </div>
        ))}

        <Button type="submit" disabled={pending}>
          {pending ? 'Envoi…' : 'Soumettre mes réponses'}
        </Button>
      </form>

      {showReviewPopup && (
        <ReviewPopup onClose={closeReviewPopup} onReview={handleReviewClick} />
      )}
    </>
  );
}

function ReviewPopup({ onClose, onReview }: { onClose: () => void; onReview: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-popup-title"
    >
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center rounded-full text-dark/50 hover:text-dark hover:bg-dark/5 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="mx-auto w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center text-3xl">
          🎓
        </div>
        <h2 id="review-popup-title" className="font-display text-2xl tracking-wide text-dark mt-4">
          Bravo, formation terminée&nbsp;!
        </h2>
        <p className="mt-3 text-sm text-dark/70 leading-relaxed">
          Merci pour votre engagement tout au long de cette formation. Si vous avez quelques secondes,
          un avis Google nous aiderait énormément à faire connaître notre travail — merci d&apos;avance&nbsp;!
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onReview}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-teal hover:bg-teal-l text-white text-sm font-medium transition w-full"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Laisser un avis sur Google
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-dark/50 hover:text-dark transition"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
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
    return (
      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <label key={i} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name={question.id}
              checked={a.value === opt}
              onChange={() => onChange({ kind: 'single', value: opt })}
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
        list={`opts-${question.id}`}
      />
    );
  }

  // texte_libre
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
