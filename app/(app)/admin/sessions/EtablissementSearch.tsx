'use client';

import { useState, useTransition, useEffect } from 'react';
import { FieldLabel } from '@/components/app/Field';
import { searchEtablissements, type EtablissementSearchResult } from './reservation-actions';

interface Props {
  selected: EtablissementSearchResult | null;
  onSelect: (e: EtablissementSearchResult | null) => void;
}

export function EtablissementSearch({ selected, onSelect }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<EtablissementSearchResult[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (selected) return;
    if (q.trim().length < 2) {
      const t0 = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(t0);
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        try {
          const r = await searchEtablissements(q);
          setResults(r);
        } catch {
          setResults([]);
        }
      });
    }, 250);
    return () => clearTimeout(t);
  }, [q, selected]);

  if (selected) {
    return (
      <div className="border rounded p-3 flex items-center justify-between bg-emerald-50">
        <div>
          <div className="font-semibold">{selected.raison_sociale}</div>
          <div className="text-sm text-gray-600">{selected.email} · SIRET : {selected.siret ?? '—'}</div>
        </div>
        <button type="button" className="text-sm text-red-600" onClick={() => onSelect(null)}>Changer</button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block">
        <FieldLabel>Rechercher un établissement (raison sociale, SIRET ou email)</FieldLabel>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tapez au moins 2 caractères..."
          className="mt-1 w-full bg-white border border-dark/15 rounded px-3 py-2 text-dark focus:outline-none focus:border-teal"
        />
      </label>
      {results.length > 0 && (
        <ul className="border rounded divide-y max-h-64 overflow-auto">
          {results.map((r) => (
            <li key={r.profile_id}>
              <button
                type="button"
                onClick={() => onSelect(r)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
              >
                <div className="font-medium">{r.raison_sociale}</div>
                <div className="text-xs text-gray-600">{r.email} · SIRET {r.siret ?? '—'}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
