'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { SignaturePad } from '@/components/app/SignaturePad';
import { createClient } from '@/lib/supabase/client';
import { signCreneauForCurrentUser } from './actions';

export interface ParticipantSession {
  inscriptionParticipantId: string;
  inscriptionId: string;
  sessionId: string;
  formationTitre: string;
  creneaux: { id: string; ordre: number; date: string; heure_debut: string; heure_fin: string }[];
}

export interface ActiveEmargement {
  triggerId: string;
  creneauId: string;
  sessionId: string;
  openedAt: string;
}

export interface ActiveTest {
  triggerId: string;
  testId: string;
  testNom: string;
  testKind: string;
  sessionId: string;
  triggeredAt: string;
}

interface Props {
  userId: string;
  sessions: ParticipantSession[];
  signedCreneauIds: string[];
  completedTestIds: string[];
  initialEmargements: ActiveEmargement[];
  initialTests: ActiveTest[];
  /** Créneaux où le user est absent : pas de popup d'émargement */
  absentCreneauIds: string[];
  /** Sessions où le user est absent à tous les créneaux : pas de popup test non plus */
  fullyAbsentSessionIds: string[];
}

const FR_DATE = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const FR_TIME = (h: string) => h.slice(0, 5);

export function ParcoursClient({
  userId: _userId,
  sessions,
  signedCreneauIds,
  completedTestIds,
  initialEmargements,
  initialTests,
  absentCreneauIds,
  fullyAbsentSessionIds,
}: Props) {
  const router = useRouter();
  const [emargements, setEmargements] = useState<ActiveEmargement[]>(initialEmargements);
  const [tests, setTests] = useState<ActiveTest[]>(initialTests);
  const [signed, setSigned] = useState<Set<string>>(new Set(signedCreneauIds));
  const [completed, setCompleted] = useState<Set<string>>(new Set(completedTestIds));
  const absentSet = useMemo(() => new Set(absentCreneauIds), [absentCreneauIds]);
  const fullyAbsentSet = useMemo(() => new Set(fullyAbsentSessionIds), [fullyAbsentSessionIds]);
  const [popup, setPopup] = useState<
    | { kind: 'emargement'; emargement: ActiveEmargement; creneau: ParticipantSession['creneaux'][number]; session: ParticipantSession }
    | { kind: 'test'; test: ActiveTest; session: ParticipantSession }
    | null
  >(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const supabase = useMemo(() => createClient(), []);
  const sessionIds = useMemo(() => sessions.map((s) => s.sessionId), [sessions]);

  // Recherche du créneau pour un émargement actif
  const findCreneau = (e: ActiveEmargement): ParticipantSession['creneaux'][number] | undefined => {
    const sess = sessions.find((s) => s.sessionId === e.sessionId);
    return sess?.creneaux.find((c) => c.id === e.creneauId);
  };
  const findSession = (sessId: string) => sessions.find((s) => s.sessionId === sessId);

  // Recherche la prochaine action non faite et l'ouvre en popup
  useEffect(() => {
    if (popup) return;
    // Priorité émargement — on saute les créneaux où le user est marqué absent
    const pendingEmargement = emargements.find(
      (e) => !signed.has(e.creneauId) && !absentSet.has(e.creneauId)
    );
    if (pendingEmargement) {
      const cre = findCreneau(pendingEmargement);
      const sess = findSession(pendingEmargement.sessionId);
      if (cre && sess) {
        setPopup({ kind: 'emargement', emargement: pendingEmargement, creneau: cre, session: sess });
        return;
      }
    }
    // Tests — on saute les sessions où le user est totalement absent
    const pendingTest = tests.find(
      (t) => !completed.has(t.testId) && !fullyAbsentSet.has(t.sessionId)
    );
    if (pendingTest) {
      const sess = findSession(pendingTest.sessionId);
      if (sess) {
        setPopup({ kind: 'test', test: pendingTest, session: sess });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emargements, tests, signed, completed, popup, absentSet, fullyAbsentSet]);

  // Subscription realtime
  useEffect(() => {
    if (sessionIds.length === 0) return;
    const filter = `session_id=in.(${sessionIds.join(',')})`;
    const ch = supabase
      .channel('stagiaire-parcours')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'creneau_emargement_triggers' },
        (payload) => {
          const row = (payload.new ?? payload.old) as { id: string; session_id: string; creneau_id: string; triggered_at: string; closed_at: string | null };
          if (!sessionIds.includes(row.session_id)) return;
          if (payload.eventType === 'DELETE') {
            setEmargements((arr) => arr.filter((e) => e.triggerId !== row.id));
            return;
          }
          if (row.closed_at) {
            setEmargements((arr) => arr.filter((e) => e.triggerId !== row.id));
          } else {
            setEmargements((arr) => {
              const filtered = arr.filter((e) => e.triggerId !== row.id);
              return [...filtered, { triggerId: row.id, creneauId: row.creneau_id, sessionId: row.session_id, openedAt: row.triggered_at }];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_test_triggers' },
        async (payload) => {
          const row = payload.new as { id: string; session_id: string; test_id: string; triggered_at: string };
          if (!sessionIds.includes(row.session_id)) return;
          const { data: t } = await supabase.from('tests').select('nom, kind').eq('id', row.test_id).single();
          if (!t) return;
          setTests((arr) => {
            if (arr.some((x) => x.triggerId === row.id)) return arr;
            return [...arr, { triggerId: row.id, testId: row.test_id, testNom: t.nom, testKind: t.kind, sessionId: row.session_id, triggeredAt: row.triggered_at }];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'session_test_triggers' },
        (payload) => {
          const row = payload.old as { id: string };
          setTests((arr) => arr.filter((t) => t.triggerId !== row.id));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionIds.join(',')]);

  function submitSignature() {
    if (!popup || popup.kind !== 'emargement' || !signature) return;
    setError(null);
    const creneauId = popup.creneau.id;
    const sessionId = popup.session.sessionId;
    startTransition(async () => {
      const res = await signCreneauForCurrentUser(sessionId, creneauId, signature);
      if (!res.ok) { setError(res.error); return; }
      setSigned((s) => new Set([...s, creneauId]));
      setSignature(null);
      setPopup(null);
    });
  }

  function goToTest() {
    if (!popup || popup.kind !== 'test') return;
    router.push(`/stagiaire/parcours/${popup.session.sessionId}/test/${popup.test.testId}`);
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-teal/5 border border-teal/30 rounded-lg p-6 text-sm space-y-2">
        <p className="font-medium text-teal">Aucune action disponible pour le moment.</p>
        <p className="text-dark/70">
          Cette page est réservée aux jours de formation. Votre formateur l&apos;activera au démarrage de la session
          afin que vous puissiez signer les émargements et compléter les questionnaires.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-dark/10 p-6">
        <h2 className="font-display text-xl">Sessions où vous êtes inscrit·e</h2>
        <ul className="mt-3 divide-y divide-dark/10">
          {sessions.map((s) => {
            const first = s.creneaux[0]?.date;
            const last = s.creneaux[s.creneaux.length - 1]?.date;
            return (
              <li key={s.sessionId} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{s.formationTitre}</p>
                  <p className="text-xs text-dark/60 mt-0.5">
                    {first && new Date(first).toLocaleDateString('fr-FR')}
                    {last && first && last !== first && <> → {new Date(last).toLocaleDateString('fr-FR')}</>}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-[0.2em] text-dark/40">
                  {emargements.some((e) => e.sessionId === s.sessionId && !signed.has(e.creneauId))
                    || tests.some((t) => t.sessionId === s.sessionId && !completed.has(t.testId))
                    ? <span className="text-teal">Action en cours</span>
                    : 'En attente du formateur'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {!popup && (
        <div className="bg-teal/5 border border-teal/30 rounded-lg p-6 text-sm space-y-2">
          <p className="font-medium text-teal">Tout est à jour.</p>
          <p className="text-dark/70">
            Aucune action en attente. Une fenêtre s&apos;ouvrira automatiquement dès que votre formateur déclenchera un émargement ou un test.
          </p>
        </div>
      )}

      {popup?.kind === 'emargement' && (
        <Modal onClose={() => setPopup(null)} closeable={false}>
          <h3 className="font-display text-2xl">Émargement</h3>
          <p className="text-sm text-dark/70 mt-1">
            <strong>{popup.session.formationTitre}</strong> — <span className="capitalize">{FR_DATE.format(new Date(popup.creneau.date))}</span>
            {' '}({FR_TIME(popup.creneau.heure_debut)}–{FR_TIME(popup.creneau.heure_fin)})
          </p>
          <div className="mt-4">
            <SignaturePad onChange={setSignature} />
          </div>
          {error && <div className="mt-3 text-sm text-orange bg-orange/10 border border-orange/30 rounded p-2">{error}</div>}
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={submitSignature} disabled={!signature || pending}>
              {pending ? 'Envoi…' : 'Valider ma signature'}
            </Button>
          </div>
        </Modal>
      )}

      {popup?.kind === 'test' && (
        <Modal onClose={() => setPopup(null)} closeable={false}>
          <h3 className="font-display text-2xl">{popup.test.testKind === 'enquete' ? 'Enquête' : 'Test'} à démarrer</h3>
          <p className="text-sm text-dark/70 mt-1">
            <strong>{popup.session.formationTitre}</strong>
          </p>
          <p className="mt-4">
            Votre formateur a déclenché : <strong>{popup.test.testNom}</strong>. Cliquez sur démarrer pour ouvrir le test.
          </p>
          <div className="mt-4 flex justify-end">
            <Button onClick={goToTest}>Démarrer →</Button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({ children, onClose: _onClose, closeable }: { children: React.ReactNode; onClose: () => void; closeable: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {children}
        {closeable && null}
      </div>
    </div>
  );
}
