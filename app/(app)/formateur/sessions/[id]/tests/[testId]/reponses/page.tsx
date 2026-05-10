import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import type { QuestionType } from '@/lib/supabase/types';

interface PageProps { params: Promise<{ id: string; testId: string }> }

export const dynamic = 'force-dynamic';

const FR_DATETIME = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

interface ParticipantRow {
  id: string;
  employee: { prenom: string; nom: string; email: string } | { prenom: string; nom: string; email: string }[] | null;
  profile: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
}

interface CompletionRow {
  id: string;
  completed_at: string | null;
  inscription_participant_id: string | null;
  responses: { question_id: string; valeur: string | null; valeur_json: unknown }[] | null;
}

function renderAnswer(q: { type_reponse: QuestionType; options: string[] }, valeur: string | null, valeurJson: unknown): React.ReactNode {
  switch (q.type_reponse) {
    case 'qcm_unique':
      return <span>{(valeurJson as string) ?? valeur ?? '—'}</span>;
    case 'qcm_multiple': {
      const arr = Array.isArray(valeurJson) ? (valeurJson as string[]) : [];
      if (arr.length === 0) return <span>—</span>;
      return <ul className="list-disc list-inside">{arr.map((v, i) => <li key={i}>{v}</li>)}</ul>;
    }
    case 'echelle':
      return <span>{valeur ?? '—'}</span>;
    case 'texte_libre':
    case 'liste':
    default:
      return <span className="whitespace-pre-wrap">{valeur || '—'}</span>;
  }
}

export default async function ResponsesPage({ params }: PageProps) {
  const { id: sessionId, testId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'formateur' && profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const { data: session } = await supabase
    .from('sessions')
    .select('id, formateur_id, formation:formations(titre)')
    .eq('id', sessionId)
    .single();
  if (!session) notFound();
  if (profile.role === 'formateur' && session.formateur_id !== profile.id) {
    redirect('/formateur/sessions');
  }

  const formation = Array.isArray(session.formation) ? session.formation[0] : session.formation;

  const [{ data: test }, { data: questions }, { data: inscriptions }, { data: completions }] = await Promise.all([
    supabase.from('tests').select('id, nom, kind, description').eq('id', testId).single(),
    supabase.from('questions').select('*').eq('test_id', testId).order('ordre'),
    supabase
      .from('inscriptions')
      .select(`
        id,
        participants:inscription_participants(
          id,
          employee:employees(prenom, nom, email),
          profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
        )
      `)
      .eq('session_id', sessionId)
      .eq('statut', 'confirmee'),
    supabase
      .from('test_completions')
      .select(`
        id, completed_at, inscription_participant_id,
        responses(question_id, valeur, valeur_json)
      `)
      .eq('test_id', testId),
  ]);

  if (!test) notFound();

  const qs = (questions ?? []) as Array<{
    id: string; ordre: number; libelle: string; type_reponse: QuestionType; options: string[]; required: boolean;
  }>;

  // Liste des participants
  const participants: Array<{
    inscriptionParticipantId: string;
    nom: string;
    email: string;
    completion: CompletionRow | null;
  }> = [];

  (inscriptions ?? []).forEach((ins) => {
    const parts = (ins.participants ?? []) as ParticipantRow[];
    parts.forEach((p) => {
      const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
      const prof = Array.isArray(p.profile) ? p.profile[0] : p.profile;
      const nom = emp ? `${emp.prenom} ${emp.nom}` : prof?.full_name ?? '—';
      const email = emp?.email ?? prof?.email ?? '';
      const completion = (completions ?? []).find((c) => (c as CompletionRow).inscription_participant_id === p.id) as CompletionRow | undefined;
      participants.push({ inscriptionParticipantId: p.id, nom, email, completion: completion ?? null });
    });
  });

  const completedCount = participants.filter((p) => p.completion?.completed_at).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${formation?.titre ?? ''} · ${test.kind === 'enquete' ? 'Enquête' : 'Test'}`}
        title={test.nom}
        description={`${completedCount} / ${participants.length} stagiaire${participants.length > 1 ? 's' : ''} ${completedCount > 1 ? 'ont' : 'a'} complété.`}
        actions={<ButtonLink href={`/formateur/sessions/${sessionId}`} variant="secondary">← Session</ButtonLink>}
      />

      {participants.length === 0 ? (
        <p className="p-6 bg-white border border-dark/10 rounded-lg text-sm text-dark/60 text-center">
          Aucun stagiaire confirmé sur cette session.
        </p>
      ) : (
        <div className="space-y-4">
          {participants.map((p) => {
            const c = p.completion;
            const responses = (c?.responses ?? []) as Array<{ question_id: string; valeur: string | null; valeur_json: unknown }>;
            const byQ = new Map(responses.map((r) => [r.question_id, r]));
            return (
              <details key={p.inscriptionParticipantId} className="bg-white border border-dark/10 rounded-lg">
                <summary className="px-4 py-3 cursor-pointer flex items-center justify-between gap-4 hover:bg-light/50">
                  <div>
                    <p className="font-medium">{p.nom}</p>
                    <p className="text-xs text-dark/60 mt-0.5">{p.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium ${c?.completed_at ? 'bg-teal/10 text-teal' : 'bg-dark/10 text-dark/50'}`}>
                    {c?.completed_at ? `Complété — ${FR_DATETIME.format(new Date(c.completed_at))}` : 'En attente'}
                  </span>
                </summary>
                {c?.completed_at && (
                  <div className="border-t border-dark/10 p-4 space-y-4 text-sm">
                    {qs.length === 0 ? (
                      <p className="text-dark/60 italic">Aucune question dans ce test.</p>
                    ) : (
                      qs.map((q) => {
                        const r = byQ.get(q.id);
                        return (
                          <div key={q.id}>
                            <p className="font-medium">{q.ordre + 1}. {q.libelle}</p>
                            <div className="mt-1 text-dark/70 pl-4 border-l-2 border-dark/10">
                              {r ? renderAnswer(q, r.valeur, r.valeur_json) : <span>—</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
