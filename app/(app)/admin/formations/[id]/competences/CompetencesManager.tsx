'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { addCompetences, deleteCompetence, moveCompetence, renameCompetence } from './actions';

export interface CompetenceRow {
  id: string;
  libelle: string;
  /** Nombre de sessions où elle a déjà été cochée */
  usage: number;
}

export function CompetencesManager({ formationId, initial }: { formationId: string; initial: CompetenceRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      after?.();
      router.refresh();
    });
  }

  function onDelete(c: CompetenceRow) {
    const warning = c.usage > 0
      ? `\n\nElle a déjà été cochée dans ${c.usage} session${c.usage > 1 ? 's' : ''} : elle disparaîtra aussi du suivi de ces sessions.`
      : '';
    if (!confirm(`Supprimer la compétence « ${c.libelle} » ?${warning}`)) return;
    run(() => deleteCompetence(formationId, c.id));
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">{error}</div>}

      <div className="bg-white border border-dark/10 rounded-lg">
        {initial.length === 0 ? (
          <p className="p-6 text-sm text-dark/60">
            Aucune compétence pour cette formation. Ajoutez-en ci-dessous : le formateur les cochera à la fin de chaque journée.
          </p>
        ) : (
          <ol className="divide-y divide-dark/10">
            {initial.map((c, i) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                <span className="w-6 text-xs font-mono text-dark/40 shrink-0">{i + 1}.</span>
                {editing?.id === c.id ? (
                  <form
                    className="flex-1 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(() => renameCompetence(formationId, c.id, editing.value), () => setEditing(null));
                    }}
                  >
                    <input
                      value={editing.value}
                      onChange={(e) => setEditing({ id: c.id, value: e.target.value })}
                      autoFocus
                      maxLength={300}
                      className="flex-1 bg-white border border-dark/15 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal"
                    />
                    <Button type="submit" disabled={pending}>OK</Button>
                    <button type="button" onClick={() => setEditing(null)} className="text-xs text-dark/50 hover:text-dark">
                      Annuler
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="flex-1 min-w-[12rem] text-sm">{c.libelle}</span>
                    {c.usage > 0 && (
                      <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-dark/40 whitespace-nowrap">
                        Vue dans {c.usage} session{c.usage > 1 ? 's' : ''}
                      </span>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      <IconButton label="Monter" disabled={pending || i === 0} onClick={() => run(() => moveCompetence(formationId, c.id, 'up'))}>↑</IconButton>
                      <IconButton label="Descendre" disabled={pending || i === initial.length - 1} onClick={() => run(() => moveCompetence(formationId, c.id, 'down'))}>↓</IconButton>
                      <button
                        type="button"
                        onClick={() => setEditing({ id: c.id, value: c.libelle })}
                        className="text-xs text-teal hover:underline px-2"
                      >
                        Renommer
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(c)}
                        disabled={pending}
                        className="text-xs text-orange/80 hover:text-orange px-2"
                      >
                        Supprimer
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      <form
        className="bg-white border border-dark/10 rounded-lg p-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => addCompetences(formationId, draft), () => setDraft(''));
        }}
      >
        <label className="block">
          <span className="text-xs uppercase tracking-[0.2em] text-teal">Ajouter des compétences</span>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder={'Une compétence par ligne, par ex. :\nProtéger la victime et les témoins\nAlerter les secours'}
            className="mt-2 w-full bg-white border border-dark/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
          />
        </label>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending || !draft.trim()}>
            {pending ? '…' : 'Ajouter'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="w-7 h-7 inline-flex items-center justify-center rounded text-dark/60 hover:bg-light disabled:opacity-30"
    >
      {children}
    </button>
  );
}
