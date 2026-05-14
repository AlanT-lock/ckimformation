'use client';

import { useState, useTransition } from 'react';
import { Field, Textarea } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { updateEnqueteFinanceurMeta } from '../actions';

interface Props {
  testId: string;
  initial: { nom: string; description: string | null; actif: boolean };
}

export function FinanceurMetaForm({ testId, initial }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [nom, setNom] = useState(initial.nom);
  const [description, setDescription] = useState(initial.description ?? '');
  const [actif, setActif] = useState(initial.actif);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        await updateEnqueteFinanceurMeta(testId, { nom, description, actif });
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-white border border-dark/10 rounded-lg p-6">
      {error && <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">{error}</div>}
      {success && <div className="text-sm text-teal bg-teal/10 border border-teal/30 rounded p-3">Modifications enregistrées.</div>}

      <Field label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
      <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
        Actif (les mails partent et les relances continuent)
      </label>

      <Button type="submit" disabled={pending}>{pending ? 'Enregistrement…' : 'Enregistrer'}</Button>
    </form>
  );
}
