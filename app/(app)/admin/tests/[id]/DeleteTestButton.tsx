'use client';

import { useTransition } from 'react';
import { Button } from '@/components/app/Button';
import { deleteTest } from '../actions';

export function DeleteTestButton({ testId }: { testId: string }) {
  const [pending, startTransition] = useTransition();
  function onClick() {
    if (!confirm('Supprimer définitivement ce test et toutes ses questions ?')) return;
    startTransition(async () => {
      try { await deleteTest(testId); }
      catch (err) { alert(err instanceof Error ? err.message : 'Erreur'); }
    });
  }
  return (
    <Button variant="danger" onClick={onClick} disabled={pending}>
      {pending ? 'Suppression…' : 'Supprimer'}
    </Button>
  );
}
