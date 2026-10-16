'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface EntrepriseOption {
  id: string;
  label: string;
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function StagiairesFilters({
  entreprises,
  du,
  au,
  entreprise,
  tri,
}: {
  entreprises: EntrepriseOption[];
  du: string | null;
  au: string | null;
  entreprise: string | null;
  tri: 'nom' | 'recent';
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    startTransition(() => router.replace(`${pathname}${qs ? `?${qs}` : ''}`));
  }

  const hasFilters = !!(du || au || entreprise || tri !== 'nom');

  return (
    <div className={`bg-white border border-dark/10 rounded-lg p-4 grid gap-4 md:grid-cols-[auto_auto_minmax(0,1fr)_auto] md:items-end ${pending ? 'opacity-60' : ''}`}>
      <label className="block">
        <span className="text-xs uppercase tracking-[0.15em] text-dark/60">Inscrit du</span>
        <input
          type="date"
          value={du ?? ''}
          max={au ?? undefined}
          onChange={(e) => update({ du: e.target.value || null })}
          className="mt-1 w-full bg-white border border-dark/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
        />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-[0.15em] text-dark/60">Au</span>
        <input
          type="date"
          value={au ?? ''}
          min={du ?? undefined}
          onChange={(e) => update({ au: e.target.value || null })}
          className="mt-1 w-full bg-white border border-dark/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
        />
      </label>
      <div>
        <span className="text-xs uppercase tracking-[0.15em] text-dark/60">Entreprise</span>
        <EntrepriseCombobox
          options={entreprises}
          value={entreprise}
          onChange={(id) => update({ entreprise: id })}
        />
      </div>
      <div className="flex items-end gap-3">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.15em] text-dark/60">Tri</span>
          <select
            value={tri}
            onChange={(e) => update({ tri: e.target.value === 'recent' ? 'recent' : null })}
            className="mt-1 w-full bg-white border border-dark/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
          >
            <option value="nom">Nom (A → Z)</option>
            <option value="recent">Plus récents d&apos;abord</option>
          </select>
        </label>
        {hasFilters && (
          <button
            type="button"
            onClick={() => update({ du: null, au: null, entreprise: null, tri: null })}
            className="pb-2 text-xs text-dark/50 hover:text-dark whitespace-nowrap"
          >
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}

function EntrepriseCombobox({
  options,
  value,
  onChange,
}: {
  options: EntrepriseOption[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.id === value) ?? null;

  const filtered = useMemo(() => {
    const n = normalize(search.trim());
    return n ? options.filter((o) => normalize(o.label).includes(n)) : options;
  }, [options, search]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function choose(id: string | null) {
    onChange(id);
    setOpen(false);
    setSearch('');
  }

  return (
    <div ref={rootRef} className="relative mt-1">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 bg-white border border-dark/15 rounded px-3 py-2 text-sm text-left focus:outline-none focus:border-teal"
      >
        <span className={`truncate ${selected ? 'text-dark' : 'text-dark/50'}`}>
          {selected ? selected.label : 'Toutes les entreprises'}
        </span>
        <span aria-hidden="true" className="text-dark/40 text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-[260px] bg-white border border-dark/15 rounded-lg shadow-lg">
          <div className="p-2 border-b border-dark/10">
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filtered.length > 0) {
                  e.preventDefault();
                  choose(filtered[0].id);
                }
              }}
              placeholder="Rechercher une entreprise…"
              className="w-full bg-light/60 border border-dark/10 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal"
            />
          </div>
          <ul role="listbox" className="max-h-64 overflow-auto py-1 text-sm">
            <li>
              <button
                type="button"
                onClick={() => choose(null)}
                className={`w-full text-left px-3 py-2 hover:bg-light ${!value ? 'font-semibold text-teal' : 'text-dark/70'}`}
              >
                Toutes les entreprises
              </button>
            </li>
            {filtered.map((o) => (
              <li key={o.id} role="option" aria-selected={o.id === value}>
                <button
                  type="button"
                  onClick={() => choose(o.id)}
                  className={`w-full text-left px-3 py-2 hover:bg-light ${o.id === value ? 'font-semibold text-teal' : ''}`}
                >
                  {o.label}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-dark/50">Aucune entreprise trouvée.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
