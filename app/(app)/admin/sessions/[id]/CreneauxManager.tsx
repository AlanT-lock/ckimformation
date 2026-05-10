'use client';

import { useState, useTransition } from 'react';
import { Field } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { addCreneau, deleteCreneau } from '../actions';

interface CreneauRow {
  id: string;
  ordre: number;
  date: string;
  heure_debut: string;
  heure_fin: string;
}

const FR_DATE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function CreneauxManager({
  sessionId,
  initial,
}: {
  sessionId: string;
  initial: CreneauRow[];
}) {
  const [rows, setRows] = useState<CreneauRow[]>(initial);
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState('');
  const [heure_debut, setHd] = useState('09:00');
  const [heure_fin, setHf] = useState('12:30');
  const [error, setError] = useState<string | null>(null);

  function onAdd() {
    setError(null);
    if (!date) { setError('Choisis une date.'); return; }
    startTransition(async () => {
      try {
        await addCreneau(sessionId, { date, heure_debut, heure_fin });
        setRows((r) => [
          ...r,
          {
            id: crypto.randomUUID(),
            ordre: (r[r.length - 1]?.ordre ?? 0) + 1,
            date, heure_debut, heure_fin,
          },
        ]);
        setDate('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur');
      }
    });
  }

  function onDelete(id: string) {
    if (!confirm('Supprimer ce créneau ?')) return;
    startTransition(async () => {
      try {
        await deleteCreneau(id, sessionId);
        setRows((r) => r.filter((c) => c.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur');
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-dark/10 rounded-lg overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-dark/60">Aucun créneau.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-2 px-4">#</th>
                <th className="text-left py-2 px-4">Date</th>
                <th className="text-left py-2 px-4">Horaires</th>
                <th className="py-2 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 px-4 text-dark/50">{c.ordre}</td>
                  <td className="py-2 px-4 capitalize">
                    {FR_DATE.format(new Date(c.date))}
                  </td>
                  <td className="py-2 px-4 text-dark/70">{c.heure_debut.slice(0, 5)} – {c.heure_fin.slice(0, 5)}</td>
                  <td className="py-2 px-4 text-right">
                    <button
                      onClick={() => onDelete(c.id)}
                      disabled={pending}
                      className="text-orange/80 hover:text-orange text-xs uppercase tracking-wider"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white border border-dark/10 rounded-lg p-4 space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-teal">Ajouter un créneau</p>
        {error && (
          <div className="text-xs text-orange bg-orange/10 border border-orange/30 rounded p-2">{error}</div>
        )}
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-5">
            <Field label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="col-span-3">
            <Field label="Début" type="time" value={heure_debut} onChange={(e) => setHd(e.target.value)} />
          </div>
          <div className="col-span-3">
            <Field label="Fin" type="time" value={heure_fin} onChange={(e) => setHf(e.target.value)} />
          </div>
          <div className="col-span-1">
            <Button onClick={onAdd} disabled={pending}>+</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
