'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/app/Button';
import { Textarea } from '@/components/app/Field';
import { demanderInscriptionParticulier } from './actions';

export function InscriptionParticulierForm({ sessionId }: { sessionId: string }) {
  const [analyseBesoins, setAnalyseBesoins] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (analyseBesoins.trim().length < 10) {
      setError("Merci de détailler l'analyse des besoins (10 caractères minimum).");
      return;
    }
    startTransition(async () => {
      try {
        await demanderInscriptionParticulier(sessionId, analyseBesoins);
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

      <Textarea
        label="Analyse des besoins (obligatoire)"
        rows={5}
        required
        value={analyseBesoins}
        onChange={(e) => setAnalyseBesoins(e.target.value)}
        placeholder="Pourquoi souhaitez-vous suivre cette formation ? Contexte, attentes, objectifs…"
      />
      <p className="-mt-2 text-xs text-dark/50">
        Cette information est exigée dans le cadre Qualiopi et nous aide à adapter la formation.
      </p>

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
