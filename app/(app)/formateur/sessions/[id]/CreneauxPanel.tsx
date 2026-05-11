'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/app/Button';
import { createClient } from '@/lib/supabase/client';
import { triggerEmargement, closeEmargement, reopenEmargement } from './actions';
import { loadAckedTriggers, markTriggerAcked } from '@/lib/ui/acked-store';

const FR_DATE = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const FR_TIME = (h: string) => h.slice(0, 5);

export interface CreneauInfo {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  ordre: number;
}

export interface EmargementTriggerInfo {
  id: string;
  creneau_id: string;
  triggered_at: string;
  closed_at: string | null;
}

export function CreneauxPanel({
  sessionId,
  creneaux,
  initialTriggers,
  expectedSignatures,
}: {
  sessionId: string;
  creneaux: CreneauInfo[];
  initialTriggers: EmargementTriggerInfo[];
  expectedSignatures: number;
}) {
  const [triggers, setTriggers] = useState<EmargementTriggerInfo[]>(initialTriggers);
  const [signatures, setSignatures] = useState<Record<string, number>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [allDoneAlert, setAllDoneAlert] = useState<{ triggerId: string; creneauId: string } | null>(null);
  const ackedRef = useRef<Set<string>>(new Set());

  const supabase = useMemo(() => createClient(), []);

  // Charge les triggers déjà acquittés (localStorage) après mount
  useEffect(() => {
    ackedRef.current = loadAckedTriggers();
  }, []);

  // Subscribe : triggers + emargements
  useEffect(() => {
    const ch = supabase
      .channel(`form-cre-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'creneau_emargement_triggers', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as EmargementTriggerInfo & { session_id: string };
          if (!row) return;
          if (payload.eventType === 'DELETE') {
            setTriggers((arr) => arr.filter((t) => t.id !== row.id));
          } else {
            setTriggers((arr) => {
              const filtered = arr.filter((t) => t.id !== row.id);
              return [...filtered, row];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'emargements' },
        () => {
          // Refresh counts (simple: refetch)
          refreshCounts();
        }
      )
      .subscribe();
    refreshCounts();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function refreshCounts() {
    const creneauIds = creneaux.map((c) => c.id);
    if (creneauIds.length === 0) return;
    const { data } = await supabase
      .from('emargements')
      .select('creneau_id')
      .in('creneau_id', creneauIds);
    const counts: Record<string, number> = {};
    (data ?? []).forEach((r) => {
      counts[r.creneau_id] = (counts[r.creneau_id] ?? 0) + 1;
    });
    setSignatures(counts);

    // Détecte si un créneau ouvert vient d'atteindre 100% et n'a pas encore été acquitté
    setTriggers((arr) => {
      const open = arr.find((t) => !t.closed_at);
      if (
        open
        && expectedSignatures > 0
        && counts[open.creneau_id] === expectedSignatures
        && !ackedRef.current.has(open.id)
      ) {
        setAllDoneAlert({ triggerId: open.id, creneauId: open.creneau_id });
      }
      return arr;
    });
  }

  function dismissAllDone() {
    if (allDoneAlert) {
      markTriggerAcked(allDoneAlert.triggerId);
      ackedRef.current.add(allDoneAlert.triggerId);
    }
    setAllDoneAlert(null);
  }

  function open(creneauId: string) {
    setError(null);
    startTransition(async () => {
      try { await triggerEmargement(sessionId, creneauId); }
      catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); }
    });
  }
  function close(triggerId: string) {
    setError(null);
    startTransition(async () => {
      try { await closeEmargement(sessionId, triggerId); }
      catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); }
    });
  }
  function reopen(triggerId: string) {
    setError(null);
    startTransition(async () => {
      try { await reopenEmargement(sessionId, triggerId); }
      catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); }
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">{error}</div>
      )}
      <div className="bg-white border border-dark/10 rounded-lg overflow-hidden divide-y divide-dark/10">
        {creneaux.map((c) => {
          const trig = triggers.find((t) => t.creneau_id === c.id);
          const signed = signatures[c.id] ?? 0;
          const isOpen = trig && !trig.closed_at;
          const isClosed = trig && trig.closed_at;
          return (
            <div key={c.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium capitalize">
                  {FR_DATE.format(new Date(c.date))}
                  <span className="ml-2 text-dark/60 text-sm">{FR_TIME(c.heure_debut)}–{FR_TIME(c.heure_fin)}</span>
                </p>
                <p className="text-xs text-dark/60 mt-0.5">
                  {trig ? (
                    <>
                      {isOpen ? <span className="text-teal">Émargement ouvert</span> : <span className="text-dark/50">Émargement clôturé</span>}
                      {' · '}
                      <span>
                        {signed} signature{signed > 1 ? 's' : ''}
                        {expectedSignatures > 0 && ` / ${expectedSignatures}`}
                      </span>
                    </>
                  ) : (
                    <span>Aucun émargement ouvert</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {!trig && (
                  <Button onClick={() => open(c.id)} disabled={pending}>Ouvrir l&apos;émargement</Button>
                )}
                {isOpen && (
                  <Button variant="secondary" onClick={() => close(trig!.id)} disabled={pending}>
                    Clôturer
                  </Button>
                )}
                {isClosed && (
                  <Button variant="secondary" onClick={() => reopen(trig!.id)} disabled={pending}>
                    Rouvrir
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allDoneAlert && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="font-display text-2xl text-teal">Tout le monde a signé.</h3>
            <p className="text-sm text-dark/70">
              Tous les stagiaires ont signé l&apos;émargement pour ce créneau. Vous pouvez passer à la suite.
            </p>
            <div className="flex justify-end">
              <Button onClick={dismissAllDone}>OK</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
