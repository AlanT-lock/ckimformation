'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { personnaliserBesoins, revenirBesoinsParDefaut } from './actions';

export function BesoinsModeButtons({ formationId, isCustom }: { formationId: string; isCustom: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {isCustom ? (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => {
            if (!confirm('Supprimer les questions propres à cette formation et revenir aux questions par défaut ?\nLes réponses déjà reçues restent conservées.')) return;
            run(() => revenirBesoinsParDefaut(formationId));
          }}
        >
          Revenir aux questions par défaut
        </Button>
      ) : (
        <Button disabled={pending} onClick={() => run(() => personnaliserBesoins(formationId))}>
          {pending ? '…' : 'Personnaliser pour cette formation'}
        </Button>
      )}
      {error && <p className="text-xs text-orange">{error}</p>}
    </div>
  );
}
