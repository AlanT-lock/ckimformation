'use client';

import { useTransition } from 'react';
import { Button } from '@/components/app/Button';
import { deleteSession } from '../actions';

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const [pending, startTransition] = useTransition();
  function onClick() {
    if (!confirm('Supprimer définitivement cette session ?\nLes créneaux associés seront perdus.')) return;
    startTransition(async () => {
      try {
        const res = await deleteSession(sessionId);
        if (res && res.ok === false) alert(res.error);
      } catch (err) {
        // redirect() lance NEXT_REDIRECT — pas une vraie erreur
        if (err instanceof Error && err.message !== 'NEXT_REDIRECT') {
          alert(err.message);
        }
      }
    });
  }
  return (
    <Button variant="danger" onClick={onClick} disabled={pending}>
      {pending ? 'Suppression…' : 'Supprimer'}
    </Button>
  );
}
