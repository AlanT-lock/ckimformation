'use client';

import { useTransition } from 'react';
import { Button } from '@/components/app/Button';
import { deleteFormation } from '../actions';

export function DeleteFormationButton({ formationId }: { formationId: string }) {
  const [pending, startTransition] = useTransition();
  function onClick() {
    if (!confirm('Supprimer définitivement cette formation ?')) return;
    startTransition(async () => {
      try { await deleteFormation(formationId); }
      catch (err) { alert(err instanceof Error ? err.message : 'Erreur'); }
    });
  }
  return (
    <Button variant="danger" onClick={onClick} disabled={pending}>
      {pending ? 'Suppression…' : 'Supprimer'}
    </Button>
  );
}
