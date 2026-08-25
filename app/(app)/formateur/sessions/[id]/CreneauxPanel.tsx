'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/app/Button';
import { SignaturePad } from '@/components/app/SignaturePad';
import { createClient } from '@/lib/supabase/client';
import { triggerEmargement, closeEmargement, reopenEmargement, signFormateurEmargement } from './actions';
import { loadAckedTriggers, markTriggerAcked } from '@/lib/ui/acked-store';
import { formatDateLong } from '@/lib/date';

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
  expectedByCreneau,
  formateurSignedCreneauIds,
}: {
  sessionId: string;
  creneaux: CreneauInfo[];
  initialTriggers: EmargementTriggerInfo[];
  expectedByCreneau: Record<string, number>;
  formateurSignedCreneauIds: string[];
}) {
  const [triggers, setTriggers] = useState<EmargementTriggerInfo[]>(initialTriggers);
  const [signatures, setSignatures] = useState<Record<string, number>>({});
  const [formateurSigned, setFormateurSigned] = useState<Set<string>>(() => new Set(formateurSignedCreneauIds));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [allDoneAlert, setAllDoneAlert] = useState<{ triggerId: string; creneauId: string } | null>(null);
  const [signing, setSigning] = useState<CreneauInfo | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const ackedRef = useRef<Set<string>>(new Set());

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    ackedRef.current = loadAckedTriggers();
  }, []);

  useEffect(() => {
    setFormateurSigned(new Set(formateurSignedCreneauIds));
  }, [formateurSignedCreneauIds]);

  useEffect(() => {
    setTriggers(initialTriggers);
  }, [initialTriggers]);

  // Comme côté stagiaire : dès qu'un émargement est ouvert et non signé, on ouvre le pad.
  useEffect(() => {
    if (signing) return;
    const next = creneaux.find((c) => {
      const trig = triggers.find((t) => t.creneau_id === c.id);
      return trig && !trig.closed_at && !formateurSigned.has(c.id);
    });
    if (next) {
      setSignature(null);
      setSigning(next);
    }
  }, [creneaux, triggers, formateurSigned, signing]);

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

    setTriggers((arr) => {
      for (const trig of arr) {
        if (trig.closed_at) continue;
        const expected = expectedByCreneau[trig.creneau_id] ?? 0;
        const got = counts[trig.creneau_id] ?? 0;
        if (expected > 0 && got >= expected && !ackedRef.current.has(trig.id)) {
          setAllDoneAlert({ triggerId: trig.id, creneauId: trig.creneau_id });
          break;
        }
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
      try {
        const trig = await triggerEmargement(sessionId, creneauId);
        setTriggers((arr) => {
          const filtered = arr.filter((t) => t.id !== trig.id && t.creneau_id !== trig.creneau_id);
          return [...filtered, trig];
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur');
      }
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

  function submitFormateurSignature() {
    if (!signing || !signature) return;
    setError(null);
    const creneauId = signing.id;
    startTransition(async () => {
      const res = await signFormateurEmargement(sessionId, creneauId, signature);
      if (!res.ok) { setError(res.error); return; }
      setFormateurSigned((s) => new Set([...s, creneauId]));
      setSignature(null);
      setSigning(null);
    });
  }

  return (
    <div className="space-y-3">
      {error && !signing && (
        <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">{error}</div>
      )}
      <div className="bg-white border border-dark/10 rounded-lg overflow-hidden divide-y divide-dark/10">
        {creneaux.map((c) => {
          const trig = triggers.find((t) => t.creneau_id === c.id);
          const signed = signatures[c.id] ?? 0;
          const expected = expectedByCreneau[c.id] ?? 0;
          const isOpen = trig && !trig.closed_at;
          const isClosed = trig && trig.closed_at;
          const formateurOk = formateurSigned.has(c.id);
          return (
            <div key={c.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium capitalize">
                  {formatDateLong(c.date)}
                  <span className="ml-2 text-dark/60 text-sm">{FR_TIME(c.heure_debut)}–{FR_TIME(c.heure_fin)}</span>
                </p>
                <p className="text-xs text-dark/60 mt-0.5">
                  {trig ? (
                    <>
                      {isOpen ? <span className="text-teal">Émargement ouvert</span> : <span className="text-dark/50">Émargement clôturé</span>}
                      {' · '}
                      <span>
                        {signed} signature{signed > 1 ? 's' : ''} stagiaire{signed > 1 ? 's' : ''}
                        {expected > 0 && ` / ${expected} attendue${expected > 1 ? 's' : ''}`}
                      </span>
                      {' · '}
                      <span className={formateurOk ? 'text-orange' : 'text-dark/50'}>
                        {formateurOk ? 'Formateur signé' : 'Formateur non signé'}
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

      {signing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-2xl">Votre émargement formateur</h3>
            <p className="text-sm text-dark/70 mt-1">
              <span className="capitalize">{formatDateLong(signing.date)}</span>
              {' '}({FR_TIME(signing.heure_debut)}–{FR_TIME(signing.heure_fin)})
            </p>
            <p className="text-sm text-dark/60 mt-2">
              L&apos;émargement est ouvert pour les stagiaires. Signez maintenant pour tracer votre présence.
            </p>
            <div className="mt-4">
              <SignaturePad onChange={setSignature} />
            </div>
            {error && <div className="mt-3 text-sm text-orange bg-orange/10 border border-orange/30 rounded p-2">{error}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={submitFormateurSignature} disabled={!signature || pending}>
                {pending ? 'Envoi…' : 'Valider ma signature'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {allDoneAlert && !signing && (
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
