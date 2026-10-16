'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function SearchInput({
  initial,
  basePath = '/admin/stagiaires',
  placeholder = 'Recherche par nom, prénom, email ou téléphone…',
}: {
  initial: string;
  basePath?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  function go(q: string) {
    startTransition(() => {
      // Conserve les autres filtres éventuels (dates, entreprise, tri…)
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) params.set('q', q.trim());
      else params.delete('q');
      const qs = params.toString();
      router.replace(`${basePath}${qs ? `?${qs}` : ''}`);
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    go(value);
  }

  function onClear() {
    setValue('');
    go('');
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2 items-stretch">
      <div className="flex-1 relative">
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white border border-dark/15 rounded px-4 py-3 text-sm focus:outline-none focus:border-teal placeholder:text-dark/40"
          autoFocus
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dark/40 hover:text-dark"
            aria-label="Effacer la recherche"
          >
            ✕
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="bg-teal hover:bg-teal-l text-white px-5 rounded text-sm font-semibold uppercase tracking-[0.15em] transition disabled:opacity-50"
      >
        {pending ? '…' : 'Rechercher'}
      </button>
    </form>
  );
}
