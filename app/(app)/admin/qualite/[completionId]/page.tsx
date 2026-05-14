import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { completionScorePct, BAD_SCORE_THRESHOLD, type ScaleQ } from '@/lib/enquetes/alerts';
import { normalizeScale, parseScaleValue, parseQcmValue, parseTextValue } from '@/lib/enquetes/analytics';
import { ActionCorrectiveForm } from './ActionCorrectiveForm';
import type { QuestionType, EnqueteKind } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

interface PageProps { params: Promise<{ completionId: string }> }

const FR_DATETIME = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const KIND_LABEL: Record<EnqueteKind, string> = {
  a_chaud: 'Enquête à chaud',
  a_froid: 'Enquête à froid',
  financeur: 'Enquête financeur',
};

export default async function QualiteRapportPage({ params }: PageProps) {
  const { completionId } = await params;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();

  const { data: completion } = await supabase
    .from('test_completions')
    .select(`
      id, test_id, inscription_id, inscription_participant_id, completed_at, started_at,
      test:tests(id, nom, kind, enquete_kind, formation:formations(titre))
    `)
    .eq('id', completionId)
    .single();

  if (!completion) notFound();

  const test = Array.isArray(completion.test) ? completion.test[0] : completion.test;
  const formation = test && (Array.isArray(test.formation) ? test.formation[0] : test.formation);
  const enqueteKind = (test?.enquete_kind ?? null) as EnqueteKind | null;

  // Questions + réponses
  const [{ data: questions }, { data: responses }, { data: action }] = await Promise.all([
    supabase
      .from('questions')
      .select('id, ordre, libelle, type_reponse, options, echelle_max')
      .eq('test_id', completion.test_id)
      .order('ordre'),
    supabase
      .from('responses')
      .select('question_id, valeur, valeur_json')
      .eq('completion_id', completionId),
    supabase
      .from('enquete_actions_correctives')
      .select('action_corrective, resolved, resolved_at, resolved_by, updated_at')
      .eq('completion_id', completionId)
      .maybeSingle(),
  ]);

  const qs = (questions ?? []) as Array<{
    id: string; ordre: number; libelle: string;
    type_reponse: QuestionType; options: unknown; echelle_max: number | null;
  }>;
  const resps = (responses ?? []) as Array<{ question_id: string; valeur: string | null; valeur_json: unknown }>;
  const respMap = new Map(resps.map((r) => [r.question_id, r]));

  const qById = new Map<string, ScaleQ>();
  for (const q of qs) qById.set(q.id, { type_reponse: q.type_reponse, echelle_max: q.echelle_max });
  const scorePct = completionScorePct(
    resps.map((r) => ({ question_id: r.question_id, valeur: r.valeur })),
    qById
  );

  // Identité du répondant
  let respondent: { name: string; email: string; sub: string | null } = { name: 'Anonyme', email: '', sub: null };
  if (completion.inscription_participant_id) {
    const { data: p } = await supabase
      .from('inscription_participants')
      .select(`
        id,
        employee:employees(prenom, nom, email),
        profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
      `)
      .eq('id', completion.inscription_participant_id)
      .single();
    const part = p as {
      employee: { prenom: string; nom: string; email: string } | { prenom: string; nom: string; email: string }[] | null;
      profile: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
    } | null;
    if (part) {
      const emp = Array.isArray(part.employee) ? part.employee[0] : part.employee;
      const prof = Array.isArray(part.profile) ? part.profile[0] : part.profile;
      if (emp) respondent = { name: `${emp.prenom} ${emp.nom}`.trim(), email: emp.email, sub: 'Salarié (entreprise)' };
      else if (prof) respondent = { name: prof.full_name, email: prof.email, sub: 'Particulier' };
    }
  } else if (completion.inscription_id) {
    const { data: ins } = await supabase
      .from('inscriptions')
      .select(`
        id, payer_profile_id,
        payer:profiles!inscriptions_payer_profile_id_fkey(full_name, email)
      `)
      .eq('id', completion.inscription_id)
      .single();
    const insRow = ins as {
      payer_profile_id: string;
      payer: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
    } | null;
    if (insRow) {
      const payer = Array.isArray(insRow.payer) ? insRow.payer[0] : insRow.payer;
      const { data: company } = await supabase
        .from('company_details')
        .select('raison_sociale')
        .eq('profile_id', insRow.payer_profile_id)
        .maybeSingle();
      if (payer) {
        const name = company?.raison_sociale ?? payer.full_name;
        respondent = { name, email: payer.email, sub: company?.raison_sociale ? `Financeur — contact : ${payer.full_name}` : 'Particulier (financeur)' };
      }
    }
  }

  // Resolved by name
  let resolvedByName: string | null = null;
  if (action?.resolved_by) {
    const { data: rp } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', action.resolved_by)
      .single();
    resolvedByName = rp?.full_name ?? rp?.email ?? null;
  }

  const isBad = scorePct !== null && scorePct < BAD_SCORE_THRESHOLD;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Qualiopi · Rapport d'alerte"
        title={`Mauvais résultat — ${respondent.name}`}
        description={`${test?.nom ?? 'Enquête'}${formation?.titre ? ` · ${formation.titre}` : ''}`}
        actions={<ButtonLink href="/admin/qualite" variant="secondary">← Liste</ButtonLink>}
      />

      {!isBad && (
        <div className="bg-teal/10 border border-teal/30 rounded p-4 text-sm text-teal">
          Note : cette complétion n&apos;est pas (ou plus) sous le seuil de {BAD_SCORE_THRESHOLD}%.
          Vous pouvez tout de même consulter et tracer une action.
        </div>
      )}

      {/* Identité + score */}
      <section className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-dark/10 p-5">
          <h2 className="font-display text-xl">Stagiaire / Répondant</h2>
          <dl className="mt-3 text-sm space-y-1">
            <div><dt className="inline text-dark/60">Nom : </dt><dd className="inline font-medium">{respondent.name}</dd></div>
            {respondent.email && <div><dt className="inline text-dark/60">Email : </dt><dd className="inline">{respondent.email}</dd></div>}
            {respondent.sub && <div><dt className="inline text-dark/60">Type : </dt><dd className="inline">{respondent.sub}</dd></div>}
          </dl>
        </div>

        <div className="bg-white rounded-lg border border-dark/10 p-5">
          <h2 className="font-display text-xl">Enquête</h2>
          <dl className="mt-3 text-sm space-y-1">
            <div><dt className="inline text-dark/60">Titre : </dt><dd className="inline font-medium">{test?.nom}</dd></div>
            {enqueteKind && <div><dt className="inline text-dark/60">Type : </dt><dd className="inline">{KIND_LABEL[enqueteKind]}</dd></div>}
            {formation?.titre && <div><dt className="inline text-dark/60">Formation : </dt><dd className="inline">{formation.titre}</dd></div>}
            <div><dt className="inline text-dark/60">Répondue le : </dt><dd className="inline">{FR_DATETIME.format(new Date(completion.completed_at))}</dd></div>
          </dl>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-dark/50">Score moyen</span>
            <span className={`font-display text-4xl ${isBad ? 'text-orange' : 'text-teal'}`}>
              {scorePct === null ? '—' : `${Math.round(scorePct)}%`}
            </span>
            {scorePct !== null && (
              <span className="text-xs text-dark/50">/ seuil {BAD_SCORE_THRESHOLD}%</span>
            )}
          </div>
        </div>
      </section>

      {/* Réponses détaillées */}
      <section>
        <h2 className="font-display text-2xl tracking-wide">Réponses du stagiaire</h2>
        <p className="text-xs text-dark/60 mt-1">Les notes basses (sous le seuil) sont mises en évidence en orange.</p>
        <ul className="mt-3 space-y-3">
          {qs.map((q) => {
            const r = respMap.get(q.id);
            const options = Array.isArray(q.options) ? (q.options as string[]) : [];
            return (
              <li key={q.id} className="bg-white border border-dark/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-dark/40 mt-1">{q.ordre}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{q.libelle}</p>
                    <div className="mt-2">
                      <AnswerCell type={q.type_reponse} echelleMax={q.echelle_max} valeur={r?.valeur ?? null} valeurJson={r?.valeur_json ?? null} options={options} />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Action corrective */}
      <section>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <h2 className="font-display text-2xl tracking-wide">Action corrective</h2>
          {action?.resolved && (
            <p className="text-xs text-teal">
              Résolue {action.resolved_at && `le ${FR_DATETIME.format(new Date(action.resolved_at))}`}
              {resolvedByName && ` par ${resolvedByName}`}
            </p>
          )}
        </div>
        <ActionCorrectiveForm
          completionId={completionId}
          initial={{
            action_corrective: action?.action_corrective ?? null,
            resolved: action?.resolved ?? false,
          }}
        />
      </section>
    </div>
  );
}

function AnswerCell({
  type, echelleMax, valeur, valeurJson, options,
}: {
  type: QuestionType; echelleMax: number | null;
  valeur: string | null; valeurJson: unknown; options: string[];
}) {
  if (type === 'echelle' && echelleMax) {
    const v = parseScaleValue(valeur);
    if (v === null) return <span className="text-dark/40 italic text-sm">Pas de réponse</span>;
    const pct = normalizeScale(v, echelleMax);
    const isBad = pct !== null && pct < BAD_SCORE_THRESHOLD;
    return (
      <div className="flex items-center gap-3">
        <span className={`text-2xl font-display ${isBad ? 'text-orange' : 'text-teal'}`}>
          {v}<span className="text-dark/40 text-base"> / {echelleMax}</span>
        </span>
        <div className="flex-1 max-w-xs bg-light h-2 rounded-full overflow-hidden">
          <div className={`h-full ${isBad ? 'bg-orange' : 'bg-teal'}`} style={{ width: `${pct ?? 0}%` }} />
        </div>
        <span className={`text-xs font-mono ${isBad ? 'text-orange' : 'text-dark/60'}`}>
          {pct === null ? '—' : `${Math.round(pct)}%`}
        </span>
      </div>
    );
  }
  if (type === 'qcm_unique' || type === 'qcm_multiple') {
    const picks = parseQcmValue(type, valeurJson);
    if (picks.length === 0) return <span className="text-dark/40 italic text-sm">Pas de réponse</span>;
    return (
      <ul className="text-sm space-y-0.5">
        {picks.map((p, i) => (
          <li key={i}>
            <span className="text-teal mr-1">✓</span>
            <span>{p}</span>
            {!options.includes(p) && <span className="text-xs text-dark/40 ml-1">(option absente)</span>}
          </li>
        ))}
      </ul>
    );
  }
  const txt = parseTextValue(type, valeur);
  if (!txt) return <span className="text-dark/40 italic text-sm">Pas de réponse</span>;
  return <p className="text-sm text-dark/80 whitespace-pre-wrap">{txt}</p>;
}
