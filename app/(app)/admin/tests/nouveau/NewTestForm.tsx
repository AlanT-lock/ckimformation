'use client';

import { useState, useTransition } from 'react';
import { Field, Select, Textarea } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { createTest } from '../actions';
import type { TestKind } from '@/lib/supabase/types';

interface FormationOpt { id: string; titre: string }

export function NewTestForm({ formations }: { formations: FormationOpt[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formation_id, setFormationId] = useState('');
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<TestKind>('quiz');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!formation_id || !nom) { setError('Formation et nom requis.'); return; }
    startTransition(async () => {
      try {
        await createTest({ formation_id, nom, description: description || undefined, kind });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-2xl bg-white border border-dark/10 rounded-lg p-6">
      {error && (
        <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">{error}</div>
      )}
      <Select
        label="Formation"
        value={formation_id}
        onChange={(e) => setFormationId(e.target.value)}
        required
      >
        <option value="">— Choisir —</option>
        {formations.map((f) => (
          <option key={f.id} value={f.id}>{f.titre}</option>
        ))}
      </Select>
      <Field
        label="Nom du test"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Ex. Test de positionnement, Enquête de satisfaction…"
        required
      />
      <Select
        label="Type"
        value={kind}
        onChange={(e) => setKind(e.target.value as TestKind)}
      >
        <option value="quiz">Quiz / Test (avec bonnes réponses)</option>
        <option value="enquete">Enquête (sans correction)</option>
        <option value="info">Informatif (lecture seule)</option>
      </Select>
      <Textarea
        label="Description (optionnel)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />
      <Button type="submit" disabled={pending}>
        {pending ? 'Création…' : 'Créer et configurer les questions'}
      </Button>
    </form>
  );
}
