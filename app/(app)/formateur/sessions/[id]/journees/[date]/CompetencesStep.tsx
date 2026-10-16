'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { formatDate } from '@/lib/date';
import { saveJourneeCompetences } from '../actions';

export interface CompetenceOption {
  id: string;
  libelle: string;
  /** Date d'une AUTRE journée où elle a déjà été vue (non proposée) */
  vueAutreJour: string | null;
  /** Déjà cochée pour cette journée (modification) */
  cocheeCeJour: boolean;
}

export function CompetencesStep({
  sessionId,
  date,
  options,
}: {
  sessionId: string;
  date: string;
  options: CompetenceOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(options.filter((o) => o.cocheeCeJour).map((o) => o.id))
  );

  const disponibles = options.filter((o) => !o.vueAutreJour);
  const dejaVues = options.filter((o) => o.vueAutreJour);

  function toggle(id: string) {
    setChecked((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await saveJourneeCompetences(sessionId, date, [...checked]);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/formateur/sessions/${sessionId}/journees/${date}/commentaires`);
    });
  }

  return (
    <div className="space-y-6">
      {error && <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">{error}</div>}

      {options.length === 0 ? (
        <div className="bg-white rounded-lg border border-dark/10 p-6 text-sm text-dark/60">
          Aucune compétence n&apos;est définie pour cette formation. Tu peux tout de même terminer la journée et ajouter tes
          commentaires.
        </div>
      ) : disponibles.length === 0 ? (
        <div className="bg-teal/5 border border-teal/30 rounded-lg p-6 text-sm text-teal">
          Toutes les compétences de la formation ont déjà été vues les jours précédents.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-dark/10">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-dark/10">
            <p className="text-sm font-medium">Compétences vues aujourd&apos;hui</p>
            <button
              type="button"
              onClick={() =>
                setChecked((s) => (s.size === disponibles.length ? new Set() : new Set(disponibles.map((o) => o.id))))
              }
              className="text-xs text-teal hover:underline"
            >
              {checked.size === disponibles.length ? 'Tout décocher' : 'Tout cocher'}
            </button>
          </div>
          <ul className="divide-y divide-dark/10">
            {disponibles.map((o) => (
              <li key={o.id}>
                <label className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-light/50">
                  <input
                    type="checkbox"
                    checked={checked.has(o.id)}
                    onChange={() => toggle(o.id)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-teal"
                  />
                  <span className="text-sm">{o.libelle}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dejaVues.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-dark/50 mb-2">Déjà vues les jours précédents</p>
          <ul className="bg-light/60 rounded-lg border border-dark/10 divide-y divide-dark/5">
            {dejaVues.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-dark/50">
                <span>✓ {o.libelle}</span>
                <span className="text-xs whitespace-nowrap">le {formatDate(o.vueAutreJour)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={pending}>
          {pending ? 'Enregistrement…' : 'Valider et passer aux commentaires →'}
        </Button>
      </div>
    </div>
  );
}
