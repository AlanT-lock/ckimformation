import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { TestsPanel } from './TestsPanel';
import { CreneauxPanel } from './CreneauxPanel';
import { TerminateSessionPopup } from './TerminateSessionPopup';

interface PageProps { params: Promise<{ id: string }> }

export default async function FormateurSessionDetail({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== 'formateur' && profile.role !== 'admin')) redirect('/login');

  const supabase = await createClient();
  const { data: session } = await supabase
    .from('sessions')
    .select(`
      id, statut, adresse, formateur_id,
      formation:formations(id, slug, titre)
    `)
    .eq('id', id)
    .single();
  if (!session) notFound();
  if (profile.role === 'formateur' && session.formateur_id !== profile.id) {
    redirect('/formateur/sessions');
  }

  const formation = Array.isArray(session.formation) ? session.formation[0] : session.formation;

  const [{ data: creneaux }, { data: inscriptions }, { data: tests }, { data: triggers }, { data: emargementTriggers }, { data: absences }] = await Promise.all([
    supabase.from('session_creneaux').select('*').eq('session_id', id).order('ordre'),
    supabase
      .from('inscriptions')
      .select(`
        id, statut,
        participants:inscription_participants(
          id,
          employee:employees(prenom, nom, email),
          profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
        )
      `)
      .eq('session_id', id)
      .eq('statut', 'confirmee')
      .order('created_at'),
    supabase
      .from('tests')
      .select('id, nom, kind, enquete_kind, actif')
      .eq('formation_id', formation?.id ?? '')
      .eq('actif', true)
      // Exclure les enquêtes à froid (envoyées par email auto) et les évaluations formateur (autre section)
      .neq('kind', 'evaluation_formateur')
      .or('kind.neq.enquete,enquete_kind.eq.a_chaud')
      .order('ordre'),
    supabase
      .from('session_test_triggers')
      .select('id, test_id, triggered_at')
      .eq('session_id', id),
    supabase
      .from('creneau_emargement_triggers')
      .select('id, creneau_id, triggered_at, closed_at')
      .eq('session_id', id),
    supabase
      .from('creneau_absences')
      .select('creneau_id, inscription_participant_id, session_creneaux!inner(session_id)')
      .eq('session_creneaux.session_id', id),
  ]);

  const allParticipantIds = (inscriptions ?? []).flatMap(
    (ins) => ((ins.participants ?? []) as Array<{ id: string }>).map((p) => p.id)
  );
  const totalParticipants = allParticipantIds.length;

  // Comptes par créneau : participants non-absents
  const absencesByCreneau = new Map<string, Set<string>>();
  for (const a of absences ?? []) {
    const set = absencesByCreneau.get(a.creneau_id) ?? new Set<string>();
    set.add(a.inscription_participant_id);
    absencesByCreneau.set(a.creneau_id, set);
  }
  const expectedByCreneau: Record<string, number> = {};
  for (const c of creneaux ?? []) {
    const absentCount = absencesByCreneau.get(c.id)?.size ?? 0;
    expectedByCreneau[c.id] = Math.max(0, totalParticipants - absentCount);
  }

  // Pour les tests : exclure les participants absents à TOUS les créneaux
  const totalCreneaux = (creneaux ?? []).length;
  const absenceCountByParticipant = new Map<string, number>();
  for (const a of absences ?? []) {
    absenceCountByParticipant.set(
      a.inscription_participant_id,
      (absenceCountByParticipant.get(a.inscription_participant_id) ?? 0) + 1
    );
  }
  const activeParticipantsForTests = allParticipantIds.filter((pid) => {
    const absCount = absenceCountByParticipant.get(pid) ?? 0;
    return absCount < totalCreneaux; // au moins un créneau de présence
  });
  const expectedCompletions = activeParticipantsForTests.length;

  // Évaluations formateur (autre section) — compteur des évaluations remplies
  const { data: evalTests } = await supabase
    .from('tests')
    .select('id')
    .eq('formation_id', formation?.id ?? '')
    .eq('kind', 'evaluation_formateur')
    .eq('actif', true);
  const evalTestIds = (evalTests ?? []).map((t) => t.id);
  let evalDone = 0;
  let evalTotal = 0;
  if (evalTestIds.length > 0 && allParticipantIds.length > 0) {
    evalTotal = evalTestIds.length * allParticipantIds.length;
    const { data: evalComps } = await supabase
      .from('test_completions')
      .select('id')
      .in('test_id', evalTestIds)
      .in('inscription_participant_id', allParticipantIds)
      .not('completed_at', 'is', null);
    evalDone = (evalComps ?? []).length;
  }

  const adr = session.adresse as { rue?: string; ville?: string; code_postal?: string; complement?: string } | null;
  const ville = [adr?.ville, adr?.code_postal].filter(Boolean).join(' ');

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Session"
        title={formation?.titre ?? 'Session'}
        description={`Statut : ${session.statut}`}
        actions={<ButtonLink href="/formateur/sessions" variant="secondary">← Mes sessions</ButtonLink>}
      />

      <section className="bg-white rounded-lg border border-dark/10 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-dark/50">Lieu</p>
        <p className="mt-3 text-sm">
          {adr?.rue && <>{adr.rue}<br /></>}
          {ville}
          {adr?.complement && <><br /><span className="text-dark/60">{adr.complement}</span></>}
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-display text-2xl tracking-wide">Émargements</h2>
          <ButtonLink href={`/formateur/sessions/${id}/stagiaires`} variant="secondary">
            Stagiaires ({totalParticipants}) →
          </ButtonLink>
        </div>
        <p className="text-xs text-dark/60 mb-3">
          Ouvre l&apos;émargement d&apos;un créneau : tous les stagiaires connectés voient un popup avec le champ signature.
        </p>
        <CreneauxPanel
          sessionId={id}
          creneaux={(creneaux ?? []).map((c) => ({ id: c.id, date: c.date, heure_debut: c.heure_debut, heure_fin: c.heure_fin, ordre: c.ordre }))}
          initialTriggers={(emargementTriggers ?? []).map((t) => ({ id: t.id, creneau_id: t.creneau_id, triggered_at: t.triggered_at, closed_at: t.closed_at }))}
          expectedByCreneau={expectedByCreneau}
        />
      </section>


      <section>
        <h2 className="font-display text-2xl tracking-wide">Tests & enquêtes</h2>
        <p className="text-xs text-dark/60 mt-1">
          Déclenche un test : il apparaîtra immédiatement dans l&apos;espace de chaque stagiaire inscrit (hors absents).
        </p>
        <div className="mt-4">
          <TestsPanel
            sessionId={id}
            tests={(tests ?? []).map((t) => ({ id: t.id, nom: t.nom, kind: t.kind }))}
            triggers={(triggers ?? []).map((t) => ({ id: t.id, test_id: t.test_id, triggered_at: t.triggered_at }))}
            expectedCompletions={expectedCompletions}
            participantIds={activeParticipantsForTests}
          />
        </div>
      </section>

      {evalTestIds.length > 0 && (
        <section>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <h2 className="font-display text-2xl tracking-wide">Évaluations formateur</h2>
            <ButtonLink href={`/formateur/sessions/${id}/evaluations`} variant="secondary">
              Remplir les évaluations →
            </ButtonLink>
          </div>
          <p className="text-xs text-dark/60">
            Évaluations à remplir par toi pour chaque stagiaire. Non visibles par le stagiaire.{' '}
            <span className="text-dark/80">{evalDone} / {evalTotal} remplie{evalDone > 1 ? 's' : ''}</span>
          </p>
        </section>
      )}

      <TerminateSessionPopup
        sessionId={id}
        statut={session.statut}
        testIds={(tests ?? []).map((t) => t.id)}
        participantIds={activeParticipantsForTests}
        expectedCompletions={expectedCompletions}
      />
    </div>
  );
}
