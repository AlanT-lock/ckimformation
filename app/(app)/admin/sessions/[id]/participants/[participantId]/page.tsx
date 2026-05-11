import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { computeScore, type ScoringQuestion, type ScoringResponse } from '@/lib/scoring';
import type { QuestionType } from '@/lib/supabase/types';

interface PageProps { params: Promise<{ id: string; participantId: string }> }

const FR_DATETIME = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

function renderAnswer(
  q: { type_reponse: QuestionType; options: string[] },
  valeur: string | null,
  valeurJson: unknown
): React.ReactNode {
  if (q.type_reponse === 'qcm_unique') {
    let v: string | null = null;
    if (typeof valeurJson === 'string') v = valeurJson;
    else if (valeurJson && typeof valeurJson === 'object' && 'value' in valeurJson) {
      const inner = (valeurJson as { value: unknown }).value;
      v = typeof inner === 'string' ? inner : null;
    }
    return <span>{v ?? valeur ?? '—'}</span>;
  }
  if (q.type_reponse === 'qcm_multiple') {
    let arr: string[] = [];
    if (Array.isArray(valeurJson)) arr = valeurJson.map(String);
    else if (valeurJson && typeof valeurJson === 'object' && 'values' in valeurJson) {
      const vs = (valeurJson as { values: unknown }).values;
      if (Array.isArray(vs)) arr = vs.map(String);
    }
    if (arr.length === 0) return <span>—</span>;
    return <ul className="list-disc list-inside">{arr.map((v, i) => <li key={i}>{v}</li>)}</ul>;
  }
  if (q.type_reponse === 'echelle') return <span>{valeur ?? '—'}</span>;
  return <span className="whitespace-pre-wrap">{valeur || '—'}</span>;
}

export default async function AdminSessionParticipantPage({ params }: PageProps) {
  const { id: sessionId, participantId } = await params;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();

  const { data: participant } = await supabase
    .from('inscription_participants')
    .select(`
      id, inscription_id,
      employee:employees(prenom, nom, email),
      profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email),
      inscription:inscriptions!inner(
        id, session_id, statut,
        payer:profiles!inscriptions_payer_profile_id_fkey(full_name, email, account_type)
      )
    `)
    .eq('id', participantId)
    .single();

  if (!participant) notFound();
  const ins = Array.isArray(participant.inscription) ? participant.inscription[0] : participant.inscription;
  if (ins?.session_id !== sessionId) notFound();

  const emp = Array.isArray(participant.employee) ? participant.employee[0] : participant.employee;
  const prof = Array.isArray(participant.profile) ? participant.profile[0] : participant.profile;
  const payer = ins?.payer && (Array.isArray(ins.payer) ? ins.payer[0] : ins.payer);
  const fullName = emp ? `${emp.prenom} ${emp.nom}` : prof?.full_name ?? '—';
  const email = emp?.email ?? prof?.email ?? '';

  // Session
  const { data: session } = await supabase
    .from('sessions')
    .select('id, formation:formations(titre)')
    .eq('id', sessionId)
    .single();
  const formation = session && (Array.isArray(session.formation) ? session.formation[0] : session.formation);

  // Toutes les complétions de ce participant
  const { data: completions } = await supabase
    .from('test_completions')
    .select(`
      id, completed_at, started_at, test_id,
      test:tests(id, nom, kind, enquete_kind, description),
      responses(question_id, valeur, valeur_json)
    `)
    .eq('inscription_participant_id', participantId)
    .order('completed_at', { ascending: false });

  // Charge les questions pour chaque test (pour afficher libellé + scoring)
  const testIds = Array.from(new Set((completions ?? []).map((c) => c.test_id)));
  const { data: allQuestions } = testIds.length > 0
    ? await supabase
        .from('questions')
        .select('id, test_id, ordre, libelle, type_reponse, options, bonne_reponse')
        .in('test_id', testIds)
        .order('ordre')
    : { data: [] as Array<{ id: string; test_id: string; ordre: number; libelle: string; type_reponse: string; options: string[]; bonne_reponse: unknown }> };

  const qByTest = new Map<string, Array<{ id: string; ordre: number; libelle: string; type_reponse: QuestionType; options: string[]; bonne_reponse: unknown }>>();
  for (const q of allQuestions ?? []) {
    const arr = qByTest.get(q.test_id) ?? [];
    arr.push({
      id: q.id,
      ordre: q.ordre,
      libelle: q.libelle,
      type_reponse: q.type_reponse as QuestionType,
      options: Array.isArray(q.options) ? (q.options as string[]) : [],
      bonne_reponse: q.bonne_reponse,
    });
    qByTest.set(q.test_id, arr);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={formation?.titre ? `Session · ${formation.titre}` : 'Session'}
        title={fullName}
        description={email}
        actions={<ButtonLink href={`/admin/sessions/${sessionId}`} variant="secondary">← Session</ButtonLink>}
      />

      <section className="bg-white rounded-lg border border-dark/10 p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <Info label="Stagiaire">{fullName}</Info>
        <Info label="Email">{email || '—'}</Info>
        {emp ? (
          <>
            <Info label="Compte">Salarié (entreprise)</Info>
            {payer && (
              <Info label="Employeur">
                {payer.full_name || payer.email}
                {payer.account_type === 'entreprise' && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-teal/10 text-teal align-middle">Entreprise</span>
                )}
              </Info>
            )}
          </>
        ) : (
          <Info label="Compte">Particulier</Info>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl tracking-wide">Tests &amp; enquêtes complétés</h2>
        <p className="text-xs text-dark/60 mt-1">
          {completions?.length ?? 0} complétion{(completions?.length ?? 0) > 1 ? 's' : ''} pour cette session.
        </p>

        <div className="mt-4 space-y-3">
          {(completions ?? []).length === 0 ? (
            <div className="bg-white rounded-lg border border-dark/10 p-6 text-sm text-dark/60">
              Ce stagiaire n&apos;a complété aucun test ou enquête pour cette session.
            </div>
          ) : (
            (completions ?? []).map((c) => {
              const test = Array.isArray(c.test) ? c.test[0] : c.test;
              const qs = qByTest.get(c.test_id) ?? [];
              const responses = (c.responses ?? []) as Array<{ question_id: string; valeur: string | null; valeur_json: unknown }>;
              const byQ = new Map(responses.map((r) => [r.question_id, r]));
              const isScorable = test?.kind === 'quiz';
              const score = isScorable && c.completed_at
                ? computeScore(qs as ScoringQuestion[], responses as ScoringResponse[])
                : null;

              const kindLabel = test?.kind === 'enquete'
                ? (test?.enquete_kind === 'a_froid' ? 'Enquête à froid' : test?.enquete_kind === 'a_chaud' ? 'Enquête à chaud' : 'Enquête')
                : test?.kind === 'quiz' ? 'Test' : 'Informatif';

              return (
                <details key={c.id} className="bg-white rounded-lg border border-dark/10">
                  <summary className="px-4 py-3 cursor-pointer flex items-start justify-between gap-3 flex-wrap hover:bg-light/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{test?.nom ?? 'Test'}</p>
                      <p className="text-xs text-dark/60 mt-0.5">
                        {kindLabel}
                        {c.completed_at && <> · complété le {FR_DATETIME.format(new Date(c.completed_at))}</>}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {score && score.scorePct !== null && (
                        <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium ${
                          score.scorePct >= 80 ? 'bg-teal/10 text-teal'
                            : score.scorePct >= 50 ? 'bg-orange/10 text-orange'
                              : 'bg-orange/20 text-orange'
                        }`}>
                          {score.scorePct}% ({score.correct}/{score.totalEvaluable})
                        </span>
                      )}
                    </div>
                  </summary>
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
                </details>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.15em] text-dark/50">{label}</p>
      <p className="mt-1 text-dark/80">{children}</p>
    </div>
  );
}
