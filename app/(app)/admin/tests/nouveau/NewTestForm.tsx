'use client';

import { useState, useTransition } from 'react';
import { Field, Select, Textarea } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { createTest } from '../actions';
import type { TestKind, EnqueteKind } from '@/lib/supabase/types';

interface FormationOpt { id: string; titre: string }

export function NewTestForm({
  formations,
  presetFormationId,
  presetKind,
  presetEnqueteKind,
}: {
  formations: FormationOpt[];
  presetFormationId: string | null;
  presetKind: TestKind;
  presetEnqueteKind: EnqueteKind | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formation_id, setFormationId] = useState(presetFormationId ?? '');
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<TestKind>(presetKind);
  const [enqueteKind, setEnqueteKind] = useState<EnqueteKind | null>(
    presetKind === 'enquete' ? (presetEnqueteKind ?? 'a_chaud') : null
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!formation_id || !nom.trim()) { setError('Formation et nom requis.'); return; }
    if (kind === 'enquete' && !enqueteKind) { setError('Choisissez à chaud ou à froid.'); return; }
    startTransition(async () => {
      try {
        await createTest({
          formation_id,
          nom: nom.trim(),
          description: description.trim() || undefined,
          kind,
          enquete_kind: kind === 'enquete' ? enqueteKind : null,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur';
        if (msg.includes('NEXT_REDIRECT')) return;
        setError(msg);
      }
    });
  }

  function changeKind(k: TestKind) {
    setKind(k);
    if (k === 'enquete') {
      setEnqueteKind(enqueteKind ?? 'a_chaud');
    } else {
      setEnqueteKind(null);
    }
  }

  // Si la formation est déjà figée (clic depuis la page formation), on masque le select
  const showFormationSelect = !presetFormationId;

  return (
    <form onSubmit={onSubmit} className="space-y-5 max-w-2xl bg-white border border-dark/10 rounded-lg p-6">
      {error && (
        <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">{error}</div>
      )}

      {showFormationSelect && (
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
      )}

      <Field
        label="Nom"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder={kind === 'enquete' ? "Ex. Enquête de satisfaction" : "Ex. Test de positionnement"}
        required
      />

      <Select
        label="Type"
        value={kind}
        onChange={(e) => changeKind(e.target.value as TestKind)}
      >
        <option value="quiz">Quiz / Test (avec bonnes réponses)</option>
        <option value="enquete">Enquête de satisfaction</option>
        <option value="info">Informatif (lecture seule)</option>
      </Select>

      {kind === 'enquete' && (
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-dark/60 mb-2">Moment de l&apos;enquête</p>
          <div className="grid grid-cols-2 gap-3">
            <KindChoiceCard
              active={enqueteKind === 'a_chaud'}
              onClick={() => setEnqueteKind('a_chaud')}
              title="À chaud"
              description="Déclenchée par le formateur en fin de session, sur l'espace stagiaire."
            />
            <KindChoiceCard
              active={enqueteKind === 'a_froid'}
              onClick={() => setEnqueteKind('a_froid')}
              title="À froid"
              description="Envoyée par email 15 jours après la formation, relancée tous les 15 jours jusqu'à réponse."
            />
          </div>
        </div>
      )}

      <Textarea
        label="Description (optionnel)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <Button type="submit" disabled={pending}>
        {pending ? 'Création…' : 'Créer et configurer les questions →'}
      </Button>
    </form>
  );
}

function KindChoiceCard({
  active, onClick, title, description,
}: {
  active: boolean; onClick: () => void; title: string; description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg p-4 border transition ${
        active
          ? 'bg-teal/5 border-teal'
          : 'bg-white border-dark/10 hover:border-dark/30'
      }`}
    >
      <p className={`font-medium ${active ? 'text-teal' : ''}`}>{title}</p>
      <p className="text-xs text-dark/60 mt-1">{description}</p>
    </button>
  );
}
