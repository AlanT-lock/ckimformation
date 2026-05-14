'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { terminateSession } from './actions';

const DISMISS_KEY_PREFIX = 'ckim:terminate-dismissed:';

interface Props {
  sessionId: string;
  statut: string;
  testIds: string[];
  participantIds: string[];
  expectedCompletions: number;
}

export function TerminateSessionPopup({
  sessionId,
  statut,
  testIds,
  participantIds,
  expectedCompletions,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [completionsByTest, setCompletionsByTest] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const eligible =
    statut === 'published' && testIds.length > 0 && expectedCompletions > 0;

  // Init dismissed state from localStorage (per session)
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(DISMISS_KEY_PREFIX + sessionId);
      if (v) setDismissed(true);
    } catch {
      // ignore
    }
  }, [sessionId]);

  // Load completions + realtime subscribe
  useEffect(() => {
    if (!eligible || participantIds.length === 0) return;
    let cancelled = false;

    async function refresh() {
      const { data } = await supabase
        .from('test_completions')
        .select('test_id')
        .in('inscription_participant_id', participantIds)
        .in('test_id', testIds)
        .not('completed_at', 'is', null);
      if (cancelled) return;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        counts[r.test_id] = (counts[r.test_id] ?? 0) + 1;
      });
      setCompletionsByTest(counts);
    }

    refresh();
    const ch = supabase
      .channel(`terminate-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'test_completions' },
        () => refresh()
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [supabase, sessionId, eligible, participantIds.join(','), testIds.join(',')]);

  const allDone = useMemo(() => {
    if (!eligible) return false;
    return testIds.every((tid) => (completionsByTest[tid] ?? 0) >= expectedCompletions);
  }, [eligible, testIds, completionsByTest, expectedCompletions]);

  useEffect(() => {
    if (allDone && !dismissed) setOpen(true);
  }, [allDone, dismissed]);

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY_PREFIX + sessionId, String(Date.now()));
    } catch {
      // ignore
    }
    setDismissed(true);
    setOpen(false);
  }

  function onTerminate() {
    setError(null);
    startTransition(async () => {
      try {
        await terminateSession(sessionId);
        try {
          window.localStorage.removeItem(DISMISS_KEY_PREFIX + sessionId);
        } catch {
          // ignore
        }
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur');
      }
    });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terminate-title"
    >
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer"
          className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center rounded-full text-dark/50 hover:text-dark hover:bg-dark/5 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="mx-auto w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center text-3xl">
          ✓
        </div>
        <h2 id="terminate-title" className="font-display text-2xl tracking-wide text-dark mt-4">
          Tous les tests et enquêtes sont complétés
        </h2>
        <p className="mt-3 text-sm text-dark/70 leading-relaxed">
          Tous les stagiaires ont rempli leurs questionnaires. Vous pouvez désormais clôturer
          la formation : elle apparaîtra comme « Terminée » côté administration.
        </p>

        {error && (
          <div className="mt-4 text-sm text-orange bg-orange/10 border border-orange/30 rounded p-2">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onTerminate}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-teal hover:bg-teal-l text-white text-sm font-medium transition w-full disabled:opacity-50"
          >
            {pending ? 'Clôture…' : 'Terminer la formation'}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="text-xs text-dark/50 hover:text-dark transition"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
