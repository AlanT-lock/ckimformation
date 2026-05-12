'use client';

import { useState, useTransition } from 'react';
import { toggleCreneauAbsence } from './actions';

const FR_SHORT = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });

export interface MatrixCreneau {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  ordre: number;
}

export interface MatrixParticipant {
  inscriptionParticipantId: string;
  fullName: string;
  email: string;
}

interface Props {
  sessionId: string;
  creneaux: MatrixCreneau[];
  participants: MatrixParticipant[];
  /** Set de couples "creneauId:participantId" actuellement absents */
  initialAbsences: string[];
}

function key(creneauId: string, participantId: string) {
  return `${creneauId}:${participantId}`;
}

export function AbsenceMatrix({ sessionId, creneaux, participants, initialAbsences }: Props) {
  const [absences, setAbsences] = useState<Set<string>>(new Set(initialAbsences));
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(creneauId: string, participantId: string) {
    const k = key(creneauId, participantId);
    const willBeAbsent = !absences.has(k);
    // Optimistic update
    setAbsences((s) => {
      const n = new Set(s);
      if (willBeAbsent) n.add(k); else n.delete(k);
      return n;
    });
    setPendingKeys((s) => new Set(s).add(k));
    setError(null);
    startTransition(async () => {
      const res = await toggleCreneauAbsence(sessionId, creneauId, participantId, willBeAbsent);
      setPendingKeys((s) => { const n = new Set(s); n.delete(k); return n; });
      if (!res.ok) {
        setError(res.error);
        // Rollback
        setAbsences((s) => {
          const n = new Set(s);
          if (willBeAbsent) n.delete(k); else n.add(k);
          return n;
        });
      }
    });
  }

  if (participants.length === 0 || creneaux.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">{error}</div>
      )}
      <div className="bg-white border border-dark/10 rounded-lg overflow-x-auto">
        <table className="text-sm min-w-full">
          <thead>
            <tr className="bg-light">
              <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.15em] text-dark/60 sticky left-0 bg-light z-10">
                Stagiaire
              </th>
              {creneaux.map((c) => (
                <th key={c.id} className="px-2 py-2 text-xs uppercase tracking-[0.1em] text-dark/60 whitespace-nowrap text-center">
                  <div className="font-medium capitalize">{FR_SHORT.format(new Date(c.date))}</div>
                  <div className="font-mono text-[10px] text-dark/50 normal-case tracking-normal">
                    {c.heure_debut.slice(0, 5)}–{c.heure_fin.slice(0, 5)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark/10">
            {participants.map((p) => (
              <tr key={p.inscriptionParticipantId} className="hover:bg-light/30">
                <td className="px-3 py-2 sticky left-0 bg-white z-10 border-r border-dark/10">
                  <div className="font-medium">{p.fullName}</div>
                  <div className="text-xs text-dark/50 break-all">{p.email}</div>
                </td>
                {creneaux.map((c) => {
                  const k = key(c.id, p.inscriptionParticipantId);
                  const isAbsent = absences.has(k);
                  const isPendingHere = pendingKeys.has(k);
                  return (
                    <td key={c.id} className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(c.id, p.inscriptionParticipantId)}
                        disabled={pending && isPendingHere}
                        className={`inline-flex items-center justify-center w-16 h-7 rounded-full text-xs font-medium uppercase tracking-wider transition ${
                          isAbsent
                            ? 'bg-orange/15 text-orange hover:bg-orange/25'
                            : 'bg-teal/10 text-teal hover:bg-teal/20'
                        } ${isPendingHere ? 'opacity-50' : ''}`}
                        title={isAbsent ? 'Marquer présent' : 'Marquer absent'}
                      >
                        {isAbsent ? 'Absent' : 'Présent'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-dark/50">
        Cliquez sur un statut pour le basculer. Les absents ne sont pas comptés dans les compteurs d&apos;émargements ni de tests.
      </p>
    </div>
  );
}
