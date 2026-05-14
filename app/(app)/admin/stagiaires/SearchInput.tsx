'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function SearchInput({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  function go(q: string) {
    startTransition(() => {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      const qs = params.toString();
      router.replace(`/admin/stagiaires${qs ? `?${qs}` : ''}`);
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
          placeholder="Recherche par nom, prénom, email ou téléphone…"
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
