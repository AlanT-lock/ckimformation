import { Fragment } from 'react';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import type { QuestionType, EnqueteKind } from '@/lib/supabase/types';
import {
  averageScalePct,
  parseScaleValue,
  parseTextValue,
  parseQcmValue,
  parseFollowupValue,
  type ScaleReponse,
} from '@/lib/enquetes/analytics';

export const dynamic = 'force-dynamic';

interface PageProps { params: Promise<{ id: string }> }

const FR_DATETIME = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const ENQUETE_LABEL: Record<EnqueteKind, string> = {
  a_chaud: 'Enquête à chaud',
  a_froid: 'Enquête à froid',
  financeur: 'Enquête financeur',
};

export default async function TestResultatsPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const { data: test } = await supabase
    .from('tests')
    .select('id, nom, kind, enquete_kind, formation_id, formation:formations(titre)')
    .eq('id', id)
    .single();
  if (!test) notFound();

  const formation = Array.isArray(test.formation) ? test.formation[0] : test.formation;
  const enqueteKind = (test.enquete_kind ?? null) as EnqueteKind | null;
  const kindLabel = test.kind === 'enquete'
    ? (enqueteKind ? ENQUETE_LABEL[enqueteKind] : 'Enquête')
    : test.kind === 'quiz' ? 'Test' : 'Informatif';

  const [{ data: questions }, { data: completions }] = await Promise.all([
    supabase
      .from('questions')
      .select('id, ordre, libelle, type_reponse, options, echelle_max')
      .eq('test_id', id)
      .order('ordre'),
    supabase
      .from('test_completions')
      .select('id, inscription_id, inscription_participant_id, completed_at')
      .eq('test_id', id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false }),
  ]);

  const qs = (questions ?? []) as Array<{
    id: string; ordre: number; libelle: string;
    type_reponse: QuestionType; options: unknown; echelle_max: number | null;
  }>;
  const comp = completions ?? [];

  // Récupère responses
  const completionIds = comp.map((c) => c.id);
  const { data: responses } = completionIds.length === 0 ? { data: [] } : await supabase
    .from('responses')
    .select('completion_id, question_id, valeur, valeur_json')
    .in('completion_id', completionIds);

  const resps = (responses ?? []) as Array<{
    completion_id: string; question_id: string; valeur: string | null; valeur_json: unknown;
  }>;

  // Index : completion_id → who (participant ou payer)
  const participantIds = new Set<string>();
  const inscriptionIds = new Set<string>();
  for (const c of comp) {
    if (c.inscription_participant_id) participantIds.add(c.inscription_participant_id);
    else if (c.inscription_id) inscriptionIds.add(c.inscription_id);
  }

  const [{ data: participants }, { data: inscriptions }] = await Promise.all([
    participantIds.size === 0 ? Promise.resolve({ data: [] }) : supabase
      .from('inscription_participants')
      .select(`
        id,
        employee:employees(prenom, nom, email),
        profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
      `)
      .in('id', Array.from(participantIds)),
    inscriptionIds.size === 0 ? Promise.resolve({ data: [] }) : supabase
      .from('inscriptions')
      .select(`
        id,
        payer:profiles!inscriptions_payer_profile_id_fkey(full_name, email),
        company:company_details!company_details_profile_id_fkey(raison_sociale)
      `)
      .in('id', Array.from(inscriptionIds)),
  ]);

  const partMap = new Map<string, { name: string; email: string }>();
  for (const p of (participants ?? []) as Array<{
    id: string;
    employee: { prenom: string; nom: string; email: string } | { prenom: string; nom: string; email: string }[] | null;
    profile: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  }>) {
    const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
    const prof = Array.isArray(p.profile) ? p.profile[0] : p.profile;
    if (emp) partMap.set(p.id, { name: `${emp.prenom} ${emp.nom}`.trim(), email: emp.email });
    else if (prof) partMap.set(p.id, { name: prof.full_name, email: prof.email });
  }
  const insMap = new Map<string, { name: string; email: string }>();
  for (const ins of (inscriptions ?? []) as Array<{
    id: string;
    payer: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
    company: { raison_sociale: string } | { raison_sociale: string }[] | null;
  }>) {
    const payer = Array.isArray(ins.payer) ? ins.payer[0] : ins.payer;
    const comp = Array.isArray(ins.company) ? ins.company[0] : ins.company;
    if (payer) {
      const name = comp?.raison_sociale ? `${comp.raison_sociale} (${payer.full_name})` : payer.full_name;
      insMap.set(ins.id, { name, email: payer.email });
    }
  }
  function whoFor(completionId: string): { name: string; email: string } {
    const c = comp.find((cc) => cc.id === completionId);
    if (!c) return { name: 'Anonyme', email: '' };
    if (c.inscription_participant_id && partMap.has(c.inscription_participant_id))
      return partMap.get(c.inscription_participant_id)!;
    if (c.inscription_id && insMap.has(c.inscription_id))
      return insMap.get(c.inscription_id)!;
    return { name: 'Anonyme', email: '' };
  }
  function completedAt(completionId: string): string | null {
    return comp.find((cc) => cc.id === completionId)?.completed_at ?? null;
  }

  // Agréger les réponses par question
  const byQuestion = new Map<string, typeof resps>();
  for (const r of resps) {
    const arr = byQuestion.get(r.question_id) ?? [];
    arr.push(r);
    byQuestion.set(r.question_id, arr);
  }

  // KPI global : satisfaction moyenne sur ce test (basée sur les échelles)
  const allScales: ScaleReponse[] = [];
  for (const q of qs) {
    if (q.type_reponse !== 'echelle' || !q.echelle_max) continue;
    for (const r of byQuestion.get(q.id) ?? []) {
      const v = parseScaleValue(r.valeur);
      if (v !== null) allScales.push({ echelleMax: q.echelle_max, valeur: v });
    }
  }
  const avgPct = averageScalePct(allScales);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${kindLabel}${formation?.titre ? ` · ${formation.titre}` : ''}`}
        title={test.nom}
        description="Résultats détaillés question par question."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <ButtonLink href={`/admin/tests/${test.id}`} variant="secondary">← Éditer</ButtonLink>
            <ButtonLink href="/admin/analytics/enquetes" variant="secondary">Vue globale</ButtonLink>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Stat label="Réponses" value={comp.length} />
        <Stat label="Questions" value={qs.length} />
        <Stat
          label="Satisfaction"
          value={avgPct === null ? '—' : `${Math.round(avgPct)}%`}
          sublabel={avgPct === null ? 'Aucune note échelle' : `${allScales.length} note${allScales.length > 1 ? 's' : ''}`}
        />
        <Stat
          label="Dernière réponse"
          value={comp[0]?.completed_at ? FR_DATETIME.format(new Date(comp[0].completed_at)) : '—'}
          compact
        />
      </div>

      {qs.length === 0 ? (
        <div className="bg-white border border-dark/10 rounded-lg p-8 text-sm text-dark/60 text-center">
          Cette enquête ne contient aucune question.
        </div>
      ) : (
        <section className="space-y-6">
          {qs.map((q) => {
            const qResps = byQuestion.get(q.id) ?? [];
            const options = Array.isArray(q.options) ? (q.options as string[]) : [];
            return (
              <QuestionResult
                key={q.id}
                ordre={q.ordre}
                libelle={q.libelle}
                type={q.type_reponse}
                options={options}
                echelleMax={q.echelle_max}
                responses={qResps}
                whoFor={whoFor}
                completedAt={completedAt}
              />
            );
          })}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, sublabel, compact = false }: { label: string; value: number | string; sublabel?: string; compact?: boolean }) {
  return (
    <div className={`bg-white rounded-lg border border-dark/10 ${compact ? 'p-3' : 'p-4 md:p-6'}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-dark/50">{label}</p>
      <p className={`font-display mt-2 text-teal ${compact ? 'text-sm md:text-base' : 'text-3xl md:text-4xl'}`}>{value}</p>
      {sublabel && <p className="text-xs text-dark/50 mt-1">{sublabel}</p>}
    </div>
  );
}

interface QuestionResultProps {
  ordre: number;
  libelle: string;
  type: QuestionType;
  options: string[];
  echelleMax: number | null;
  responses: Array<{ completion_id: string; valeur: string | null; valeur_json: unknown }>;
  whoFor: (cid: string) => { name: string; email: string };
  completedAt: (cid: string) => string | null;
}

function QuestionResult({ ordre, libelle, type, options, echelleMax, responses, whoFor, completedAt }: QuestionResultProps) {
  const total = responses.length;

  return (
    <div className="bg-white rounded-lg border border-dark/10 p-5">
      <div className="flex items-start gap-3">
        <span className="text-xs font-mono text-dark/40 mt-1">{ordre}.</span>
        <div className="flex-1">
          <p className="font-medium">{libelle}</p>
          <p className="text-xs text-dark/50 mt-1">
            {total} réponse{total > 1 ? 's' : ''} · <TypeBadge type={type} echelleMax={echelleMax} />
          </p>
          <div className="mt-4">
            {total === 0 ? (
              <p className="text-sm text-dark/50">Aucune réponse pour cette question.</p>
            ) : type === 'echelle' && echelleMax ? (
              <ScaleResult responses={responses} echelleMax={echelleMax} />
            ) : type === 'qcm_unique' || type === 'qcm_multiple' ? (
              <QcmResult responses={responses} options={options} type={type} whoFor={whoFor} completedAt={completedAt} />
            ) : (
              // texte_libre / liste
              <TextList responses={responses} type={type} whoFor={whoFor} completedAt={completedAt} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ type, echelleMax }: { type: QuestionType; echelleMax: number | null }) {
  const map: Record<QuestionType, string> = {
    qcm_unique: 'QCM (1 réponse)',
    qcm_multiple: 'QCM (multi)',
    texte_libre: 'Texte libre',
    echelle: `Échelle 1 à ${echelleMax ?? '?'}`,
    liste: 'Réponse courte',
  };
  return <span className="text-xs text-dark/60">{map[type]}</span>;
}

function ScaleResult({ responses, echelleMax }: { responses: Array<{ valeur: string | null }>; echelleMax: number }) {
  // Distribution par valeur 1..N
  const counts = new Array(echelleMax).fill(0) as number[];
  const values: number[] = [];
  for (const r of responses) {
    const v = parseScaleValue(r.valeur);
    if (v === null || v < 1 || v > echelleMax) continue;
    counts[v - 1]++;
    values.push(v);
  }
  const total = values.length;
  const avg = total > 0 ? values.reduce((a, b) => a + b, 0) / total : null;
  const max = Math.max(1, ...counts);
  const avgPct = avg !== null ? ((avg - 1) / (echelleMax - 1)) * 100 : null;

  return (
    <div>
      <div className="flex items-baseline gap-6 mb-4">
        <div>
          <p className="text-xs text-dark/50 uppercase tracking-[0.15em]">Moyenne</p>
          <p className="font-display text-2xl text-teal">
            {avg === null ? '—' : `${avg.toFixed(1)} / ${echelleMax}`}
          </p>
        </div>
        <div>
          <p className="text-xs text-dark/50 uppercase tracking-[0.15em]">Normalisée</p>
          <p className="font-display text-2xl text-teal">
            {avgPct === null ? '—' : `${Math.round(avgPct)}%`}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1.5 items-center">
        {counts.map((count, i) => {
          const n = i + 1;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const widthPct = max > 0 ? Math.round((count / max) * 100) : 0;
          const tone = n === echelleMax ? 'bg-teal' : n === 1 ? 'bg-orange' : 'bg-teal/40';
          return (
            <Fragment key={n}>
              <span className="text-xs font-mono text-dark/60 tabular-nums w-8 text-right">
                {n}{n === 1 ? ' (–)' : n === echelleMax ? ' (+)' : ''}
              </span>
              <div className="bg-light h-3 rounded-full overflow-hidden">
                <div className={`h-full ${tone}`} style={{ width: `${widthPct}%` }} />
              </div>
              <span className="text-xs text-right tabular-nums text-dark/70 whitespace-nowrap">
                {count} <span className="text-dark/40">· {pct}%</span>
              </span>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function QcmResult({
  responses, options, type, whoFor, completedAt,
}: {
  responses: Array<{ completion_id: string; valeur: string | null; valeur_json: unknown }>;
  options: string[];
  type: 'qcm_unique' | 'qcm_multiple';
  whoFor: (cid: string) => { name: string; email: string };
  completedAt: (cid: string) => string | null;
}) {
  // Compte les réponses par option + collecte les follow-ups
  const counts = new Map<string, number>();
  let totalResp = 0;
  const followups: Array<{ completion_id: string; option: string; text: string }> = [];
  for (const r of responses) {
    const picks = parseQcmValue(type, r.valeur_json);
    if (picks.length === 0) continue;
    totalResp++;
    for (const p of picks) counts.set(p, (counts.get(p) ?? 0) + 1);
    if (type === 'qcm_unique') {
      const f = parseFollowupValue(r.valeur_json);
      if (f) followups.push({ completion_id: r.completion_id, option: picks[0], text: f });
    }
  }
  const max = Math.max(1, ...Array.from(counts.values()));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 items-center">
      {options.map((opt) => {
        const c = counts.get(opt) ?? 0;
        const pct = totalResp > 0 ? Math.round((c / totalResp) * 100) : 0;
        const widthPct = max > 0 ? Math.round((c / max) * 100) : 0;
        return (
          <Fragment key={opt}>
            <div>
              <p className="text-sm text-dark/80">{opt}</p>
              <div className="bg-light h-2 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-teal" style={{ width: `${widthPct}%` }} />
              </div>
            </div>
            <span className="text-xs text-right tabular-nums text-dark/70 whitespace-nowrap">
              {c} <span className="text-dark/40">· {pct}%</span>
            </span>
          </Fragment>
        );
      })}
      </div>

      {followups.length > 0 && (
        <div className="pt-3 border-t border-dark/10">
          <p className="text-xs uppercase tracking-[0.15em] text-teal mb-2">Précisions libres ({followups.length})</p>
          <ul className="space-y-2">
            {followups.map((f, i) => {
              const who = whoFor(f.completion_id);
              const at = completedAt(f.completion_id);
              return (
                <li key={`${f.completion_id}-${i}`} className="border border-dark/10 rounded p-3 bg-light/40">
                  <div className="flex items-start justify-between gap-3 flex-wrap text-xs">
                    <span className="font-medium text-dark/80">
                      {who.name || <em className="text-dark/40">Sans nom</em>}
                      {who.email && <span className="text-dark/50 font-normal ml-2">· {who.email}</span>}
                    </span>
                    <span className="text-dark/40 whitespace-nowrap">
                      Choix : <strong className="text-dark/70">{f.option}</strong>{at && ` · ${FR_DATETIME.format(new Date(at))}`}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-dark/80 whitespace-pre-wrap">{f.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function TextList({
  responses, type, whoFor, completedAt,
}: {
  responses: Array<{ completion_id: string; valeur: string | null }>;
  type: QuestionType;
  whoFor: (cid: string) => { name: string; email: string };
  completedAt: (cid: string) => string | null;
}) {
  const items = responses
    .map((r) => ({
      completion_id: r.completion_id,
      text: parseTextValue(type, r.valeur),
    }))
    .filter((x): x is { completion_id: string; text: string } => x.text !== null)
    .map((x) => ({
      ...x,
      who: whoFor(x.completion_id),
      at: completedAt(x.completion_id),
    }))
    .sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));

  if (items.length === 0) {
    return <p className="text-sm text-dark/50">Aucune réponse libre renseignée.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={`${it.completion_id}-${i}`} className="border border-dark/10 rounded p-3 bg-light/40">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <p className="text-sm font-medium">
              {it.who.name || <em className="text-dark/50">Sans nom</em>}
              {it.who.email && <span className="text-dark/50 font-normal ml-2">· {it.who.email}</span>}
            </p>
            <span className="text-xs text-dark/40 whitespace-nowrap">
              {it.at && FR_DATETIME.format(new Date(it.at))}
            </span>
          </div>
          <p className="mt-2 text-sm text-dark/80 whitespace-pre-wrap">{it.text}</p>
        </li>
      ))}
    </ul>
  );
}
