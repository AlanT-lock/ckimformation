'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { submitDocumentResponses } from './actions';

export function SubmitDocumentsButton({ inscriptionId }: { inscriptionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!confirm('Envoyer définitivement vos réponses à C-KIM ?\nVous ne pourrez plus les modifier ensuite.')) return;
    setError(null);
    startTransition(async () => {
      const res = await submitDocumentResponses(inscriptionId);
      if (!res.ok) { setError(res.error); return; }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button onClick={onClick} disabled={pending}>
        {pending ? 'Envoi…' : 'Envoyer mes réponses à C-KIM'}
      </Button>
      {error && (
        <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">
          {error}
        </div>
      )}
    </div>
  );
}
