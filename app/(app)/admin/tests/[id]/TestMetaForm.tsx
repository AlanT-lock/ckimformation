'use client';

import { useState, useTransition } from 'react';
import { Field, Select, Textarea } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { updateTest } from '../actions';
import type { TestKind } from '@/lib/supabase/types';

export function TestMetaForm({
  testId,
  initial,
  formationLabel,
}: {
  testId: string;
  initial: { nom: string; description: string | null; kind: TestKind; actif: boolean };
  formationLabel: string;
  formations: { id: string; titre: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [nom, setNom] = useState(initial.nom);
  const [description, setDescription] = useState(initial.description ?? '');
  const [kind, setKind] = useState<TestKind>(initial.kind);
  const [actif, setActif] = useState(initial.actif);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        await updateTest(testId, { nom, description, kind, actif });
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

      <div className="text-xs text-dark/50">
        Formation : <span className="text-dark">{formationLabel}</span>{' '}
        <span className="text-dark/40">(non modifiable — recréer un test pour changer)</span>
      </div>

      <Field label="Nom du test" value={nom} onChange={(e) => setNom(e.target.value)} required />
      <Select label="Type" value={kind} onChange={(e) => setKind(e.target.value as TestKind)}>
        <option value="quiz">Quiz / Test</option>
        <option value="enquete">Enquête</option>
        <option value="info">Informatif</option>
      </Select>
      <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
        Test actif (peut être déclenché par les formateurs)
      </label>
      <Button type="submit" disabled={pending}>{pending ? 'Enregistrement…' : 'Enregistrer'}</Button>
    </form>
  );
}
