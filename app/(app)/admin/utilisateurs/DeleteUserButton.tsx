'use client';

import { useTransition } from 'react';
import { deleteUser } from './actions';

export function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  const [pending, startTransition] = useTransition();
  function onClick() {
    if (!confirm(`Supprimer définitivement le compte ${email} ?`)) return;
    startTransition(async () => {
      try { await deleteUser(userId); }
      catch (err) { alert(err instanceof Error ? err.message : 'Erreur'); }
    });
  }
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="text-orange/80 hover:text-orange text-xs uppercase tracking-wider disabled:opacity-50"
    >
      {pending ? 'Suppression…' : 'Supprimer'}
    </button>
  );
}
