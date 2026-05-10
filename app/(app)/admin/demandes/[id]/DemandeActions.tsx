'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/app/Button';
import { Textarea } from '@/components/app/Field';
import { confirmerDemande, refuserDemande } from '../actions';

export function DemandeActions({ inscriptionId, statut }: { inscriptionId: string; statut: string }) {
  const [showRefus, setShowRefus] = useState(false);
  const [motif, setMotif] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    if (!confirm('Confirmer cette demande ? Un email de confirmation sera envoyé au demandeur.')) return;
    setError(null);
    startTransition(async () => {
      try {
        await confirmerDemande(inscriptionId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur';
        if (msg.includes('NEXT_REDIRECT')) return;
        setError(msg);
      }
    });
  }

  function handleRefus(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (motif.trim().length < 5) {
      setError('Motif trop court (5 caractères minimum).');
      return;
    }
    startTransition(async () => {
      try {
        await refuserDemande(inscriptionId, motif);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur';
        if (msg.includes('NEXT_REDIRECT')) return;
        setError(msg);
      }
    });
  }

  if (statut === 'confirmee') {
    return (
      <div className="bg-teal/10 border border-teal/30 rounded p-4 text-sm text-teal">
        Demande confirmée. L&apos;email de confirmation a été envoyé au demandeur.
      </div>
    );
  }
  if (statut === 'refusee') {
    return (
      <div className="bg-dark/5 border border-dark/15 rounded p-4 text-sm text-dark/70">
        Demande refusée.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-dark/10 p-6 space-y-4">
      <h2 className="font-display text-xl">Actions</h2>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleConfirm} disabled={pending}>
          {pending ? '…' : 'Confirmer la demande'}
        </Button>
        <Button variant="secondary" onClick={() => setShowRefus((v) => !v)} disabled={pending}>
          {showRefus ? 'Annuler' : 'Refuser la demande'}
        </Button>
      </div>

      {showRefus && (
        <form onSubmit={handleRefus} className="space-y-3 pt-3 border-t border-dark/10">
          <Textarea
            label="Motif du refus"
            rows={4}
            required
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Indiquez le motif qui sera communiqué au demandeur."
          />
          <Button type="submit" variant="danger" disabled={pending}>
            {pending ? '…' : 'Envoyer le refus'}
          </Button>
        </form>
      )}

      {error && (
        <div className="bg-orange/10 border border-orange/30 rounded p-3 text-sm text-orange whitespace-pre-line">
          {error}
        </div>
      )}
    </div>
  );
}
