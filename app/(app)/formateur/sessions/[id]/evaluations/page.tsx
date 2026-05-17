import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

interface PageProps { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic';

interface StagiaireRow {
  inscriptionParticipantId: string;
  fullName: string;
  email: string;
}

export default async function FormateurEvaluationsPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'formateur' && profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const { data: session } = await supabase
    .from('sessions')
    .select('id, formateur_id, formation:formations(id, titre)')
    .eq('id', id)
    .single();
  if (!session) notFound();
  if (profile.role === 'formateur' && session.formateur_id !== profile.id) {
    redirect('/formateur/sessions');
  }
  const formation = Array.isArray(session.formation) ? session.formation[0] : session.formation;

  // Tests d'évaluation formateur pour cette formation
  const { data: tests } = await supabase
    .from('tests')
    .select('id, nom, description')
    .eq('formation_id', formation?.id ?? '')
    .eq('kind', 'evaluation_formateur')
    .eq('actif', true)
    .order('ordre');

  // Stagiaires confirmés de la session
  const { data: inscriptions } = await supabase
    .from('inscriptions')
    .select(`
      id,
      participants:inscription_participants(
        id,
        employee:employees(prenom, nom, email),
        profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
      )
    `)
    .eq('session_id', id)
    .eq('statut', 'confirmee');

  const stagiaires: StagiaireRow[] = [];
  for (const ins of inscriptions ?? []) {
    const parts = (ins.participants ?? []) as Array<{
      id: string;
      employee: { prenom: string; nom: string; email: string } | { prenom: string; nom: string; email: string }[] | null;
      profile: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
    }>;
    for (const p of parts) {
      const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
      const prof = Array.isArray(p.profile) ? p.profile[0] : p.profile;
      if (emp) {
        stagiaires.push({
          inscriptionParticipantId: p.id,
          fullName: `${emp.prenom} ${emp.nom}`.trim(),
          email: emp.email,
        });
      } else if (prof) {
        stagiaires.push({
          inscriptionParticipantId: p.id,
          fullName: prof.full_name,
          email: prof.email,
        });
      }
    }
  }

  // Statut des complétions : qui a été évalué pour quel test
  const testIds = (tests ?? []).map((t) => t.id);
  const participantIds = stagiaires.map((s) => s.inscriptionParticipantId);
  const { data: completions } = testIds.length && participantIds.length
    ? await supabase
        .from('test_completions')
        .select('test_id, inscription_participant_id, completed_at')
        .in('test_id', testIds)
        .in('inscription_participant_id', participantIds)
    : { data: [] };

  const completedSet = new Set(
    (completions ?? [])
      .filter((c) => c.completed_at)
      .map((c) => `${c.test_id}::${c.inscription_participant_id}`)
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Session"
        title={`Évaluations formateur — ${formation?.titre ?? ''}`}
        description="Évaluations à remplir par le formateur pour chaque stagiaire. Non visibles par le stagiaire."
        actions={<ButtonLink href={`/formateur/sessions/${id}`} variant="secondary">← Session</ButtonLink>}
      />

      {(tests ?? []).length === 0 ? (
        <div className="bg-white border border-dark/10 rounded-lg p-8 text-sm text-dark/60 text-center">
          Aucune évaluation formateur n&apos;est configurée pour cette formation.
        </div>
      ) : stagiaires.length === 0 ? (
        <div className="bg-white border border-dark/10 rounded-lg p-8 text-sm text-dark/60 text-center">
          Aucun stagiaire inscrit (confirmé) pour cette session.
        </div>
      ) : (
        <div className="space-y-8">
          {(tests ?? []).map((t) => {
            const doneCount = stagiaires.filter((s) =>
              completedSet.has(`${t.id}::${s.inscriptionParticipantId}`)
            ).length;
            return (
              <section key={t.id} className="bg-white border border-dark/10 rounded-lg overflow-hidden">
                <header className="p-4 border-b border-dark/10">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <h2 className="font-display text-xl tracking-wide">{t.nom}</h2>
                      {t.description && (
                        <p className="text-xs text-dark/60 mt-1">{t.description}</p>
                      )}
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-dark/60 whitespace-nowrap">
                      {doneCount} / {stagiaires.length} rempli{doneCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </header>
                <ul className="divide-y divide-dark/10">
                  {stagiaires.map((s) => {
                    const done = completedSet.has(`${t.id}::${s.inscriptionParticipantId}`);
                    return (
                      <li key={s.inscriptionParticipantId}>
                        <Link
                          href={`/formateur/sessions/${id}/evaluations/${t.id}/${s.inscriptionParticipantId}`}
                          className="flex items-center justify-between gap-3 p-4 hover:bg-dark/5 transition"
                        >
                          <div className="min-w-0">
                            <p className="font-medium">{s.fullName || '(sans nom)'}</p>
                            <p className="text-xs text-dark/60 mt-0.5 truncate">{s.email}</p>
                          </div>
                          <div className="flex items-center gap-3 whitespace-nowrap">
                            {done ? (
                              <span className="text-xs uppercase tracking-[0.2em] text-teal">✅ rempli — modifier →</span>
                            ) : (
                              <span className="text-xs uppercase tracking-[0.2em] text-orange">⏳ à remplir →</span>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
