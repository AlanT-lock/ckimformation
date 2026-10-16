'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/app/Button';
import { demanderInscriptionParticulier } from './actions';
import {
  BesoinsQuestionnaire,
  besoinsClientError,
  emptyBesoinsState,
  toBesoinsInputs,
  type BesoinsState,
} from '@/components/app/besoins/BesoinsQuestionnaire';
import type { BesoinQuestion } from '@/lib/besoins/answers';

export function InscriptionParticulierForm({
  sessionId,
  besoinsQuestions,
}: {
  sessionId: string;
  besoinsQuestions: BesoinQuestion[];
}) {
  const [besoins, setBesoins] = useState<BesoinsState>(() => emptyBesoinsState(besoinsQuestions));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const besoinsError = besoinsClientError(besoinsQuestions, besoins);
    if (besoinsError) {
      setError(besoinsError);
      return;
    }
    startTransition(async () => {
      try {
        await demanderInscriptionParticulier(sessionId, toBesoinsInputs(besoinsQuestions, besoins));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur';
        if (msg.includes('NEXT_REDIRECT')) return;
        setError(msg);
      }
    });
  }

  return (
    <form onSubmit={submit} className="bg-white border border-dark/10 rounded-lg p-6 space-y-5">
      <h2 className="font-display text-2xl tracking-wide">Demande d&apos;inscription</h2>
      <p className="text-sm text-dark/70">
        En envoyant cette demande, vous nous indiquez votre souhait de participer à cette session. Nous vous recontacterons
        pour valider votre inscription et convenir des modalités.
      </p>

{besoinsQuestions.length > 0 && (
      <section className="space-y-3">
        <div>
          <h3 className="font-display text-xl tracking-wide">Analyse des besoins</h3>
          <p className="text-xs text-dark/50 mt-1">
            Exigée dans le cadre Qualiopi : vos réponses nous aident à adapter la formation.
          </p>
        </div>
        <BesoinsQuestionnaire questions={besoinsQuestions} value={besoins} onChange={setBesoins} />
      </section>
      )}

      {error && (
        <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3 whitespace-pre-line">
          {error}
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Envoi de la demande…' : "Envoyer la demande d'inscription"}
      </Button>
    </form>
  );
}
