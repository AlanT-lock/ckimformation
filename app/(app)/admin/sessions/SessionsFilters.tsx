'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface Props {
  statut: string;
  formationId: string;
  formations: { id: string; titre: string }[];
}

const STATUTS: { value: string; label: string }[] = [
  { value: '', label: 'Tous statuts' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'published', label: 'Publiée' },
  { value: 'completed', label: 'Terminée' },
  { value: 'cancelled', label: 'Annulée' },
];

export function SessionsFilters({ statut, formationId, formations }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/admin/sessions?${qs}` : '/admin/sessions');
    });
  }

  function reset() {
    startTransition(() => {
      router.push('/admin/sessions');
    });
  }

  const hasFilter = !!statut || !!formationId;

  return (
    <div className="bg-white rounded-lg border border-dark/10 p-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1 min-w-[180px]">
        <label htmlFor="filter-statut" className="text-xs uppercase tracking-[0.2em] text-dark/50">
          Statut
        </label>
        <select
          id="filter-statut"
          value={statut}
          onChange={(e) => updateParam('statut', e.target.value)}
          disabled={pending}
          className="bg-white border border-dark/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
        >
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 min-w-[240px] flex-1">
        <label htmlFor="filter-formation" className="text-xs uppercase tracking-[0.2em] text-dark/50">
          Formation
        </label>
        <select
          id="filter-formation"
          value={formationId}
          onChange={(e) => updateParam('formation', e.target.value)}
          disabled={pending}
          className="bg-white border border-dark/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
        >
          <option value="">Toutes formations</option>
          {formations.map((f) => (
            <option key={f.id} value={f.id}>{f.titre}</option>
          ))}
        </select>
      </div>

      {hasFilter && (
        <button
          type="button"
          onClick={reset}
          disabled={pending}
          className="text-xs text-dark/60 hover:text-dark underline px-2 py-2"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
