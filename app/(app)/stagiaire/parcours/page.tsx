import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { ParcoursClient, type ParticipantSession, type ActiveEmargement, type ActiveTest } from './ParcoursClient';

export const dynamic = 'force-dynamic';

export default async function StagiaireParcoursPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'stagiaire') redirect('/login');

  const supabase = await createClient();

  // Toutes les participations confirmées du user (via profile direct OU employee.profile_id)
  const { data: parts } = await supabase
    .from('inscription_participants')
    .select(`
      id, inscription_id, participant_profile_id, employee_id,
      inscription:inscriptions!inner(
        id, session_id, statut,
        session:sessions(
          id,
          formation:formations(titre),
          creneaux:session_creneaux(id, ordre, date, heure_debut, heure_fin)
        )
      ),
      employee:employees(profile_id)
    `)
    .eq('inscription.statut', 'confirmee');

  const myParts = (parts ?? []).filter((p) => {
    const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
    return p.participant_profile_id === profile.id || emp?.profile_id === profile.id;
  });

  const sessions: ParticipantSession[] = myParts.map((p) => {
    const ins = Array.isArray(p.inscription) ? p.inscription[0] : p.inscription;
    const sess = ins && (Array.isArray(ins.session) ? ins.session[0] : ins.session);
    const formation = sess && (Array.isArray(sess.formation) ? sess.formation[0] : sess.formation);
    const creneaux = ((sess?.creneaux ?? []) as { id: string; ordre: number; date: string; heure_debut: string; heure_fin: string }[])
      .slice()
      .sort((a, b) => a.ordre - b.ordre);
    return {
      inscriptionParticipantId: p.id,
      inscriptionId: p.inscription_id,
      sessionId: sess?.id ?? '',
      formationTitre: formation?.titre ?? 'Formation',
      creneaux,
    };
  }).filter((s) => s.sessionId);

  const sessionIds = sessions.map((s) => s.sessionId);
  const partIds = sessions.map((s) => s.inscriptionParticipantId);

  // Triggers ouverts + tests déclenchés + signés/complétés + absences propres
  const [{ data: emargTrigs }, { data: testTrigs }, { data: signed }, { data: completions }, { data: myAbsences }] = await Promise.all([
    sessionIds.length > 0
      ? supabase
          .from('creneau_emargement_triggers')
          .select('id, session_id, creneau_id, triggered_at, closed_at')
          .in('session_id', sessionIds)
          .is('closed_at', null)
      : Promise.resolve({ data: [] }),
    sessionIds.length > 0
      ? supabase
          .from('session_test_triggers')
          .select('id, session_id, test_id, triggered_at, test:tests(nom, kind)')
          .in('session_id', sessionIds)
      : Promise.resolve({ data: [] }),
    partIds.length > 0
      ? supabase
          .from('emargements')
          .select('creneau_id')
          .in('inscription_participant_id', partIds)
      : Promise.resolve({ data: [] }),
    partIds.length > 0
      ? supabase
          .from('test_completions')
          .select('test_id, completed_at')
          .in('inscription_participant_id', partIds)
          .not('completed_at', 'is', null)
      : Promise.resolve({ data: [] }),
    partIds.length > 0
      ? supabase
          .from('creneau_absences')
          .select('creneau_id, inscription_participant_id')
          .in('inscription_participant_id', partIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Créneaux où je suis absent
  const myAbsentCreneauIds = (myAbsences ?? []).map((a) => a.creneau_id);

  // Sessions où je suis absent à TOUS les créneaux → exclu des tests
  const fullyAbsentSessionIds = new Set<string>();
  for (const s of sessions) {
    if (s.creneaux.length === 0) continue;
    const allAbsent = s.creneaux.every((c) => myAbsentCreneauIds.includes(c.id));
    if (allAbsent) fullyAbsentSessionIds.add(s.sessionId);
  }

  const initialEmargements: ActiveEmargement[] = (emargTrigs ?? []).map((t) => ({
    triggerId: t.id,
    creneauId: t.creneau_id,
    sessionId: t.session_id,
    openedAt: t.triggered_at,
  }));

  const initialTests: ActiveTest[] = (testTrigs ?? [])
    .map((t) => {
      const test = Array.isArray(t.test) ? t.test[0] : t.test;
      return {
        triggerId: t.id,
        testId: t.test_id,
        testNom: test?.nom ?? 'Test',
        testKind: test?.kind ?? 'quiz',
        sessionId: t.session_id,
        triggeredAt: t.triggered_at,
      };
    })
    // Les évaluations formateur ne sont jamais affichées côté stagiaire
    .filter((t) => t.testKind !== 'evaluation_formateur');

  const signedCreneauIds = (signed ?? []).map((r) => r.creneau_id);
  const completedTestIds = (completions ?? []).map((c) => c.test_id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="En formation"
        title="Espace de formation"
        description="Émargements, tests et enquêtes : ils s'activent en direct le jour J."
      />
      <ParcoursClient
        userId={profile.id}
        sessions={sessions}
        signedCreneauIds={signedCreneauIds}
        completedTestIds={completedTestIds}
        initialEmargements={initialEmargements}
        initialTests={initialTests}
        absentCreneauIds={myAbsentCreneauIds}
        fullyAbsentSessionIds={Array.from(fullyAbsentSessionIds)}
      />
    </div>
  );
}
