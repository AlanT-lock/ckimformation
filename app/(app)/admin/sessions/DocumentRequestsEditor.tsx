'use client';

import { Button } from '@/components/app/Button';

export interface DocRequestDraft {
  label: string;
  description: string;
  required: boolean;
}

interface Props {
  value: DocRequestDraft[];
  onChange: (v: DocRequestDraft[]) => void;
}

export function DocumentRequestsEditor({ value, onChange }: Props) {
  function update(i: number, patch: Partial<DocRequestDraft>) {
    onChange(value.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function add() {
    onChange([...value, { label: '', description: '', required: true }]);
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700">
        Liste des documents que l&apos;établissement devra fournir dans son espace.
      </div>
      {value.map((d, i) => (
        <div key={i} className="border rounded p-3 space-y-2">
          <label className="block text-sm font-medium">
            Intitulé
            <input
              className="mt-1 w-full bg-white border border-dark/15 rounded px-3 py-2 focus:outline-none focus:border-teal"
              value={d.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Ex : Convention de formation signée"
            />
          </label>
          <label className="block text-sm font-medium">
            Description (optionnel)
            <textarea
              className="mt-1 w-full bg-white border border-dark/15 rounded px-3 py-2 focus:outline-none focus:border-teal"
              rows={2}
              value={d.description}
              onChange={(e) => update(i, { description: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={d.required}
              onChange={(e) => update(i, { required: e.target.checked })}
            />
            Obligatoire
          </label>
          <button type="button" className="text-sm text-red-600" onClick={() => remove(i)}>
            Supprimer
          </button>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={add}>
        + Ajouter une demande
      </Button>
    </div>
  );
}
