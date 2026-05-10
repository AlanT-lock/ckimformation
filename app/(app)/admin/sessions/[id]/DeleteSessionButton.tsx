'use client';

import { useTransition } from 'react';
import { Button } from '@/components/app/Button';
import { deleteSession } from '../actions';

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const [pending, startTransition] = useTransition();
  function onClick() {
    if (!confirm('Supprimer définitivement cette session ?\nLes créneaux et inscriptions associés seront perdus.')) return;
    startTransition(async () => {
      try { await deleteSession(sessionId); }
      catch (err) { alert(err instanceof Error ? err.message : 'Erreur'); }
    });
  }
  return (
    <Button variant="danger" onClick={onClick} disabled={pending}>
      {pending ? 'Suppression…' : 'Supprimer'}
    </Button>
  );
}
