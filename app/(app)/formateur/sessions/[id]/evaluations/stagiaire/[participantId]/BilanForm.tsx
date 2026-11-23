'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { formatDate } from '@/lib/date';
import { NIVEAUX, NIVEAU_LABEL, competencesManquantes, type Niveau } from '@/lib/suivi/bilan';
import { submitBilanStagiaire } from '../../actions';
import {
  QuestionInput,
  followupMissing,
  hydrateAnswer,
  isAnswered,
  toResponse,
  type AnswerState,
  type ExistingResponse,
  type Question,
} from '../../question-fields';

export interface BilanEvaluationProps {
  id: string;
  nom: string;
  description: string | null;
  questions: Question[];
  existingResponses: ExistingResponse[];
}

export interface BilanCompetenceProps {
  id: string;
  libelle: string;
  /** Date de la journée où la compétence a été cochée comme vue, null sinon */
  vueLe: string | null;
}

const NIVEAU_SELECTED: Record<Niveau, string> = {
  acquise: 'bg-teal text-white border-teal',
  en_cours: 'bg-orange text-white border-orange',
  non_acquise: 'bg-dark text-white border-dark',
};

/**
 * Bilan de fin de formation d'un stagiaire, sur une seule page : questionnaires
 * d'évaluation formateur puis niveau d'acquisition de chaque compétence.
 */
export function BilanForm({
  sessionId,
  participantId,
  evaluations,
  competences,
  initialNiveaux,
  listHref,
  nextHref,
}: {
  sessionId: string;
  participantId: string;
  evaluations: BilanEvaluationProps[];
  competences: BilanCompetenceProps[];
  initialNiveaux: Record<string, Niveau>;
  listHref: string;
  /** Prochain stagiaire dont le bilan reste à remplir */
  nextHref: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showMissing, setShowMissing] = useState(false);

  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() => {
    const out: Record<string, AnswerState> = {};
    for (const e of evaluations) {
      const byQuestion = new Map(e.existingResponses.map((r) => [r.question_id, r]));
      for (const q of e.questions) out[q.id] = hydrateAnswer(q, byQuestion.get(q.id));
    }
    return out;
  });
  const [niveaux, setNiveaux] = useState<Record<string, Niveau>>(initialNiveaux);

  const competenceIds = competences.map((c) => c.id);
  const manquantes = competencesManquantes(competenceIds, niveaux);

  function setAnswer(questionId: string, a: AnswerState) {
    setAnswers((s) => ({ ...s, [questionId]: a }));
    setSuccess(false);
    setError(null);
  }

  function setNiveau(competenceId: string, niveau: Niveau) {
    setNiveaux((s) => ({ ...s, [competenceId]: niveau }));
    setSuccess(false);
    setError(null);
  }

  function fillRemainingAsAcquise() {
    setNiveaux((s) => {
      const next = { ...s };
      for (const id of competenceIds) if (!next[id]) next[id] = 'acquise';
      return next;
    });
    setSuccess(false);
    setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    for (const ev of evaluations) {
      const prefix = evaluations.length > 1 ? `« ${ev.nom} » — ` : '';
      for (const q of ev.questions) {
        const a = answers[q.id];
        if (q.required && !isAnswered(a)) {
          setError(`${prefix}la question ${q.ordre} est obligatoire.`);
          return;
        }
        if (q.required && followupMissing(q, a)) {
          setError(`${prefix}question ${q.ordre} : précisez votre réponse dans le champ texte.`);
          return;
        }
      }
    }
    if (manquantes.length > 0) {
      setShowMissing(true);
      setError(
        manquantes.length === 1
          ? 'Il reste 1 compétence sans niveau d’acquisition.'
          : `Il reste ${manquantes.length} compétences sans niveau d’acquisition.`
      );
      return;
    }

    const payload = {
      evaluations: evaluations.map((ev) => ({
        testId: ev.id,
        responses: ev.questions.filter((q) => isAnswered(answers[q.id])).map((q) => toResponse(q, answers[q.id])),
      })),
      competences: competenceIds.map((id) => ({ competenceId: id, niveau: niveaux[id] })),
    };

    startTransition(async () => {
      const res = await submitBilanStagiaire(sessionId, participantId, payload);
      if (!res.ok) { setError(res.error); return; }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      {evaluations.map((ev) => (
        <section key={ev.id} className="space-y-4">
          <div>
            <h2 className="font-display text-2xl tracking-wide">{ev.nom}</h2>
            {ev.description && <p className="text-xs text-dark/60 mt-1">{ev.description}</p>}
          </div>
          {ev.questions.length === 0 ? (
            <div className="bg-white border border-dark/10 rounded-lg p-6 text-sm text-dark/60">
              Cette évaluation ne contient aucune question.
            </div>
          ) : (
            ev.questions.map((q) => (
              <div key={q.id} className="bg-white border border-dark/10 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-dark/40 mt-1">{q.ordre}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {q.libelle}
                      {q.required && <span className="text-orange ml-1">*</span>}
                    </p>
                    <div className="mt-3">
                      <QuestionInput question={q} answer={answers[q.id]} onChange={(a) => setAnswer(q.id, a)} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      ))}

      {competences.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-display text-2xl tracking-wide">Compétences</h2>
              <p className="text-xs text-dark/60 mt-1">
                Indique pour chaque compétence le niveau atteint par ce stagiaire en fin de formation.{' '}
                <span className="text-dark/80">
                  {competences.length - manquantes.length} / {competences.length} renseignée
                  {competences.length - manquantes.length > 1 ? 's' : ''}
                </span>
              </p>
            </div>
            {manquantes.length > 0 && (
              <button
                type="button"
                onClick={fillRemainingAsAcquise}
                className="text-xs uppercase tracking-[0.15em] text-teal hover:underline"
              >
                Marquer les {manquantes.length} restante{manquantes.length > 1 ? 's' : ''} comme acquise
                {manquantes.length > 1 ? 's' : ''}
              </button>
            )}
          </div>

          <ul className="bg-white border border-dark/10 rounded-lg divide-y divide-dark/10">
            {competences.map((c) => {
              const missing = showMissing && !niveaux[c.id];
              return (
                <li
                  key={c.id}
                  className={`p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between ${
                    missing ? 'bg-orange/5' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p id={`competence-${c.id}`} className="font-medium">{c.libelle}</p>
                    <p className={`text-xs mt-0.5 ${c.vueLe ? 'text-dark/50' : 'text-orange'}`}>
                      {c.vueLe ? `Vue en journée le ${formatDate(c.vueLe)}` : 'Non vue en journée'}
                      {missing && <span className="text-orange"> · niveau à indiquer</span>}
                    </p>
                  </div>
                  <div
                    role="radiogroup"
                    aria-labelledby={`competence-${c.id}`}
                    className="grid grid-cols-3 gap-2 lg:shrink-0 lg:w-[33rem]"
                  >
                    {NIVEAUX.map((n) => {
                      const selected = niveaux[c.id] === n;
                      return (
                        <label
                          key={n}
                          className={`cursor-pointer rounded border px-2 py-2 text-xs sm:text-sm text-center font-medium leading-tight flex items-center justify-center transition focus-within:ring-2 focus-within:ring-teal/40 ${
                            selected ? NIVEAU_SELECTED[n] : 'bg-white border-dark/15 text-dark/70 hover:border-dark/40'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`niveau-${c.id}`}
                            value={n}
                            checked={selected}
                            onChange={() => setNiveau(c.id, n)}
                            className="sr-only"
                          />
                          {NIVEAU_LABEL[n]}
                        </label>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="space-y-3">
        {error && (
          <div role="alert" className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="text-sm text-teal bg-teal/10 border border-teal/30 rounded p-3 flex items-center justify-between gap-3 flex-wrap">
            <span>Bilan enregistré.</span>
            <span className="flex items-center gap-4">
              <Link href={listHref} className="underline">Retour à la liste</Link>
              {nextHref && <Link href={nextHref} className="underline font-medium">Stagiaire suivant →</Link>}
            </span>
          </div>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer le bilan'}
        </Button>
      </div>
    </form>
  );
}
