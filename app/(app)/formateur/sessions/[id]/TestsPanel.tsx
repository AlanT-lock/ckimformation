'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/app/Button';
import { createClient } from '@/lib/supabase/client';
import { triggerTest, untriggerTest } from './actions';
import { loadAckedTriggers, markTriggerAcked } from '@/lib/ui/acked-store';

const KIND_LABEL: Record<string, string> = {
  quiz: 'Quiz',
  enquete: 'Enquête',
  info: 'Info',
};

interface Test { id: string; nom: string; kind: string }
interface Trigger { id: string; test_id: string; triggered_at: string }

export function TestsPanel({
  sessionId,
  tests,
  triggers,
  expectedCompletions,
  participantIds,
}: {
  sessionId: string;
  tests: Test[];
  triggers: Trigger[];
  expectedCompletions: number;
  participantIds: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [completions, setCompletions] = useState<Record<string, number>>({});
  const [allDoneFor, setAllDoneFor] = useState<{ triggerId: string; testId: string } | null>(null);
  const ackedRef = useRef<Set<string>>(new Set());

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    ackedRef.current = loadAckedTriggers();
  }, []);

  useEffect(() => {
    if (participantIds.length === 0) return;
    refreshCounts();
    const ch = supabase
      .channel(`tests-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'test_completions' },
        () => refreshCounts()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, participantIds.join(',')]);

  async function refreshCounts() {
    if (participantIds.length === 0) return;
    const { data } = await supabase
      .from('test_completions')
      .select('test_id, inscription_participant_id, completed_at')
      .in('inscription_participant_id', participantIds)
      .not('completed_at', 'is', null);
    const counts: Record<string, number> = {};
    (data ?? []).forEach((r) => {
      counts[r.test_id] = (counts[r.test_id] ?? 0) + 1;
    });
    setCompletions(() => {
      // Détecte les triggers à 100% non encore acquittés
      for (const t of triggers) {
        const now = counts[t.test_id] ?? 0;
        if (
          now === expectedCompletions
          && expectedCompletions > 0
          && !ackedRef.current.has(t.id)
        ) {
          setAllDoneFor({ triggerId: t.id, testId: t.test_id });
        }
      }
      return counts;
    });
  }

  function dismissAllDone() {
    if (allDoneFor) {
      markTriggerAcked(allDoneFor.triggerId);
      ackedRef.current.add(allDoneFor.triggerId);
    }
    setAllDoneFor(null);
  }

  function onTrigger(testId: string) {
    setError(null);
    startTransition(async () => {
      try { await triggerTest(sessionId, testId); }
      catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); }
    });
  }

  function onUntrigger(triggerId: string) {
    if (!confirm('Retirer ce test du parcours ?')) return;
    setError(null);
    startTransition(async () => {
      try { await untriggerTest(sessionId, triggerId); }
      catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); }
    });
  }

  if (tests.length === 0) {
    return (
      <p className="bg-white border border-dark/10 rounded-lg p-6 text-sm text-dark/60">
        Aucun test n&apos;a encore été créé pour cette formation. Demande à l&apos;admin d&apos;en créer.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">{error}</div>
      )}
      <div className="bg-white border border-dark/10 rounded-lg overflow-hidden divide-y divide-dark/10">
        {tests.map((t) => {
          const trig = triggers.find((tr) => tr.test_id === t.id);
          const triggered = !!trig;
          const done = completions[t.id] ?? 0;
          return (
            <div key={t.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium">{t.nom}</p>
                <p className="text-xs text-dark/60 mt-0.5">
                  {KIND_LABEL[t.kind] ?? t.kind}
                  {triggered && trig && (
                    <>
                      {' · '}
                      <span className="text-teal">déclenché le {new Date(trig.triggered_at).toLocaleString('fr-FR')}</span>
                      {expectedCompletions > 0 && (
                        <>{' · '}<span>{done} / {expectedCompletions} complété{done > 1 ? 's' : ''}</span></>
                      )}
                    </>
                  )}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                {triggered && (
                  <Link
                    href={`/formateur/sessions/${sessionId}/tests/${t.id}/reponses`}
                    className="text-sm text-teal hover:underline"
                  >
                    Voir les réponses →
                  </Link>
                )}
                {triggered ? (
                  <Button variant="secondary" onClick={() => onUntrigger(trig!.id)} disabled={pending}>
                    Retirer
                  </Button>
                ) : (
                  <Button onClick={() => onTrigger(t.id)} disabled={pending}>
                    Déclencher
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allDoneFor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="font-display text-2xl text-teal">Tout le monde a terminé.</h3>
            <p className="text-sm text-dark/70">
              Tous les stagiaires ont complété ce test. Vous pouvez passer à la suite ou consulter les réponses.
            </p>
            <div className="flex justify-end gap-2">
              <Link
                href={`/formateur/sessions/${sessionId}/tests/${allDoneFor.testId}/reponses`}
                onClick={dismissAllDone}
                className="inline-flex items-center px-4 py-2 rounded text-sm font-medium bg-white border border-dark/15 hover:border-dark/40 text-dark"
              >
                Voir les réponses
              </Link>
              <Button onClick={dismissAllDone}>OK</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
