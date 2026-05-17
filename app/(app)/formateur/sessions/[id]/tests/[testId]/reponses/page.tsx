import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { computeScore, type ScoringQuestion, type ScoringResponse } from '@/lib/scoring';
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
    case 'qcm_unique': {
      const json = (valeurJson ?? {}) as { value?: string | null; followup?: string };
      const value = json.value ?? valeur ?? null;
      if (!value) return <span>—</span>;
      return (
        <div>
          <span>{value}</span>
          {json.followup && (
            <p className="mt-1 text-xs text-dark/60 italic whitespace-pre-wrap">
              Précision : {json.followup}
            </p>
          )}
        </div>
      );
    }
    case 'qcm_multiple': {
      const json = (valeurJson ?? {}) as { values?: string[] };
      const arr = Array.isArray(json.values)
        ? json.values
        : Array.isArray(valeurJson)
          ? (valeurJson as string[])
          : [];
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
    supabase.from('tests').select('id, nom, kind, enquete_kind, description').eq('id', testId).single(),
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
    id: string; ordre: number; libelle: string; type_reponse: QuestionType; options: string[]; required: boolean; bonne_reponse: unknown;
  }>;

  const scoringQs: ScoringQuestion[] = qs.map((q) => ({
    id: q.id,
    type_reponse: q.type_reponse,
    bonne_reponse: q.bonne_reponse,
    options: q.options,
  }));
  const isScorable = test.kind === 'quiz';

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
            const score = isScorable && c?.completed_at
              ? computeScore(scoringQs, responses as ScoringResponse[])
              : null;
            return (
              <details key={p.inscriptionParticipantId} className="bg-white border border-dark/10 rounded-lg">
                <summary className="px-4 py-3 cursor-pointer flex items-center justify-between gap-4 hover:bg-light/50 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{p.nom}</p>
                    <p className="text-xs text-dark/60 mt-0.5 break-all">{p.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {score && score.scorePct !== null && (
                      <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium ${
                        score.scorePct >= 80 ? 'bg-teal/10 text-teal'
                          : score.scorePct >= 50 ? 'bg-orange/10 text-orange'
                            : 'bg-orange/20 text-orange'
                      }`}>
                        Score : {score.scorePct}% ({score.correct}/{score.totalEvaluable})
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium ${c?.completed_at ? 'bg-teal/10 text-teal' : 'bg-dark/10 text-dark/50'}`}>
                      {c?.completed_at ? `Complété — ${FR_DATETIME.format(new Date(c.completed_at))}` : 'En attente'}
                    </span>
                  </div>
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
                            {isScorable && (q.type_reponse === 'qcm_unique' || q.type_reponse === 'qcm_multiple') && q.bonne_reponse != null && (
                              <p className="mt-1 pl-4 text-xs text-teal">
                                Bonne réponse : {
                                  q.type_reponse === 'qcm_unique'
                                    ? String(q.bonne_reponse)
                                    : Array.isArray(q.bonne_reponse) ? (q.bonne_reponse as string[]).join(', ') : ''
                                }
                              </p>
                            )}
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
