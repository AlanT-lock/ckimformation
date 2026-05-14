import { Fragment } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient } from '@/lib/supabase/server';
import type { QuestionType, EnqueteKind } from '@/lib/supabase/types';
import {
  averageScalePct,
  distributionBuckets,
  parseScaleValue,
  parseTextValue,
  type ScaleReponse,
} from '@/lib/enquetes/analytics';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ days?: string; kind?: string }>;
}

const RANGES: { value: string; label: string; days: number }[] = [
  { value: '30', label: '30 jours', days: 30 },
  { value: '90', label: '90 jours', days: 90 },
  { value: '365', label: '12 mois', days: 365 },
  { value: 'all', label: 'Tout', days: 3650 },
];

const KIND_TABS: { value: string; label: string; filter: EnqueteKind | 'all' }[] = [
  { value: 'all', label: 'Toutes', filter: 'all' },
  { value: 'a_chaud', label: 'À chaud', filter: 'a_chaud' },
  { value: 'a_froid', label: 'À froid', filter: 'a_froid' },
  { value: 'financeur', label: 'Financeur', filter: 'financeur' },
];

const FR_DATETIME = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export default async function AnalyticsEnquetesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const rangeValue = sp.days ?? '90';
  const range = RANGES.find((r) => r.value === rangeValue) ?? RANGES[1];
  const since = new Date(Date.now() - range.days * 24 * 60 * 60 * 1000).toISOString();
  const kindFilter = (KIND_TABS.find((t) => t.value === sp.kind) ?? KIND_TABS[0]).filter;

  const supabase = await createClient();

  // 1. Toutes les enquêtes (tests kind='enquete')
  const { data: enquetesAll } = await supabase
    .from('tests')
    .select('id, nom, enquete_kind, actif, formation_id, formation:formations(titre)')
    .eq('kind', 'enquete');

  const enquetes = (enquetesAll ?? []).filter((e) =>
    kindFilter === 'all' ? true : e.enquete_kind === kindFilter
  );
  const testIds = enquetes.map((e) => e.id);

  // 2. Complétions + réponses sur la période (pour les enquêtes filtrées)
  const [{ data: completions }, { data: questions }, { data: responses }] = await Promise.all([
    testIds.length === 0 ? Promise.resolve({ data: [] }) : supabase
      .from('test_completions')
      .select('id, test_id, inscription_id, inscription_participant_id, completed_at')
      .in('test_id', testIds)
      .gte('completed_at', since)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false }),
    testIds.length === 0 ? Promise.resolve({ data: [] }) : supabase
      .from('questions')
      .select('id, test_id, ordre, libelle, type_reponse, echelle_max')
      .in('test_id', testIds),
    testIds.length === 0 ? Promise.resolve({ data: [] }) : supabase
      .from('responses')
      .select('completion_id, question_id, valeur, valeur_json'),
  ]);

  const comp = completions ?? [];
  const qs = (questions ?? []) as Array<{
    id: string; test_id: string; ordre: number; libelle: string;
    type_reponse: QuestionType; echelle_max: number | null;
  }>;
  const resps = (responses ?? []) as Array<{
    completion_id: string; question_id: string; valeur: string | null; valeur_json: unknown;
  }>;

  const completionIds = new Set(comp.map((c) => c.id));
  const respsInRange = resps.filter((r) => completionIds.has(r.completion_id));

  // 3. Envois (pour à froid / financeur — taux de réponse)
  const [{ data: froidEnvois }, { data: finEnvois }] = await Promise.all([
    supabase
      .from('enquete_froid_envois')
      .select('id, test_id, first_sent_at, responded_at')
      .gte('first_sent_at', since)
      .not('first_sent_at', 'is', null),
    supabase
      .from('enquete_financeur_envois')
      .select('id, first_sent_at, responded_at')
      .gte('first_sent_at', since)
      .not('first_sent_at', 'is', null),
  ]);

  const froidSent = (froidEnvois ?? []).length;
  const froidResponded = (froidEnvois ?? []).filter((e) => e.responded_at).length;
  const finSent = (finEnvois ?? []).length;
  const finResponded = (finEnvois ?? []).filter((e) => e.responded_at).length;

  // 4. Réponses échelle → satisfaction moyenne + distribution
  const qById = new Map(qs.map((q) => [q.id, q]));
  const scaleResps: ScaleReponse[] = [];
  for (const r of respsInRange) {
    const q = qById.get(r.question_id);
    if (!q || q.type_reponse !== 'echelle' || !q.echelle_max) continue;
    const v = parseScaleValue(r.valeur);
    if (v === null) continue;
    scaleResps.push({ echelleMax: q.echelle_max, valeur: v });
  }

  const avgPct = averageScalePct(scaleResps);
  const buckets = distributionBuckets(scaleResps);
  const totalScales = scaleResps.length;

  // 5. KPIs par type d'enquête (toujours calculés pour les badges, indépendant du filtre)
  const enquetesActives = (enquetesAll ?? []).filter((e) => e.actif).length;
  const enquetesByKind = {
    a_chaud: (enquetesAll ?? []).filter((e) => e.enquete_kind === 'a_chaud').length,
    a_froid: (enquetesAll ?? []).filter((e) => e.enquete_kind === 'a_froid').length,
    financeur: (enquetesAll ?? []).filter((e) => e.enquete_kind === 'financeur').length,
  };

  // 6. Taux de réponse (selon filtre)
  let responseRate: { sent: number; responded: number; pct: number | null } = { sent: 0, responded: 0, pct: null };
  if (kindFilter === 'a_froid') {
    responseRate = { sent: froidSent, responded: froidResponded, pct: froidSent > 0 ? (froidResponded / froidSent) * 100 : null };
  } else if (kindFilter === 'financeur') {
    responseRate = { sent: finSent, responded: finResponded, pct: finSent > 0 ? (finResponded / finSent) * 100 : null };
  } else if (kindFilter === 'all') {
    const sent = froidSent + finSent;
    const responded = froidResponded + finResponded;
    responseRate = { sent, responded, pct: sent > 0 ? (responded / sent) * 100 : null };
  }

  // 7. Top réponses libres récentes — on récupère les noms/emails des répondants
  const textRespsRaw: Array<{ completion_id: string; question_id: string; text: string; question: typeof qs[number] }> = [];
  for (const r of respsInRange) {
    const q = qById.get(r.question_id);
    if (!q) continue;
    const txt = parseTextValue(q.type_reponse, r.valeur);
    if (!txt) continue;
    textRespsRaw.push({ completion_id: r.completion_id, question_id: r.question_id, text: txt, question: q });
  }

  // Mapper completion_id → participant / payer pour récupérer nom & email
  const compById = new Map(comp.map((c) => [c.id, c]));
  const participantIds = new Set<string>();
  const inscriptionIds = new Set<string>();
  for (const tr of textRespsRaw) {
    const c = compById.get(tr.completion_id);
    if (!c) continue;
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
        payer:profiles!inscriptions_payer_profile_id_fkey(full_name, email)
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
  }>) {
    const payer = Array.isArray(ins.payer) ? ins.payer[0] : ins.payer;
    if (payer) insMap.set(ins.id, { name: payer.full_name, email: payer.email });
  }

  const textResps = textRespsRaw.map((tr) => {
    const c = compById.get(tr.completion_id);
    const who = (c?.inscription_participant_id && partMap.get(c.inscription_participant_id))
      || (c?.inscription_id && insMap.get(c.inscription_id))
      || { name: 'Anonyme', email: '' };
    return {
      ...tr,
      respondent: who,
      completedAt: c?.completed_at ?? null,
    };
  }).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  // Liste des enquêtes (avec count de complétions sur la période) pour drill-down
  const completionsByTest = new Map<string, number>();
  for (const c of comp) completionsByTest.set(c.test_id, (completionsByTest.get(c.test_id) ?? 0) + 1);

  const enquetesSorted = enquetes
    .map((e) => ({
      id: e.id,
      nom: e.nom,
      enquete_kind: e.enquete_kind as EnqueteKind | null,
      actif: e.actif,
      formation: Array.isArray(e.formation) ? e.formation[0] : e.formation,
      completions: completionsByTest.get(e.id) ?? 0,
    }))
    .sort((a, b) => b.completions - a.completions);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Analyses des enquêtes de satisfaction"
        description="Vue cross-formation : taux de réponse, satisfaction moyenne, distribution des notes et retours libres."
        actions={<ButtonLink href="/admin/tests" variant="secondary">Tests &amp; enquêtes</ButtonLink>}
      />

      {/* Onglets type d'enquête */}
      <nav className="flex gap-1 border-b border-dark/10 flex-wrap">
        {KIND_TABS.map((tab) => {
          const active = (sp.kind ?? 'all') === tab.value;
          const count = tab.filter === 'all'
            ? enquetesByKind.a_chaud + enquetesByKind.a_froid + enquetesByKind.financeur
            : enquetesByKind[tab.filter];
          const href = `/admin/analytics/enquetes?${tab.value === 'all' ? '' : `kind=${tab.value}&`}days=${rangeValue}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={`px-4 py-2 text-sm uppercase tracking-[0.15em] font-medium border-b-2 -mb-px transition ${
                active ? 'border-teal text-teal' : 'border-transparent text-dark/50 hover:text-dark'
              }`}
            >
              {tab.label} <span className="text-dark/40 ml-1">({count})</span>
            </Link>
          );
        })}
      </nav>

      {/* Plage temporelle */}
      <nav className="flex gap-2 flex-wrap">
        {RANGES.map((r) => {
          const active = r.value === rangeValue;
          const href = `/admin/analytics/enquetes?${sp.kind && sp.kind !== 'all' ? `kind=${sp.kind}&` : ''}days=${r.value}`;
          return (
            <Link
              key={r.value}
              href={href}
              className={`text-sm px-3 py-1.5 rounded-full border transition ${
                active ? 'bg-teal text-white border-teal' : 'bg-white text-dark/70 border-dark/15 hover:border-dark/40'
              }`}
            >
              {r.label}
            </Link>
          );
        })}
      </nav>

      {/* KPI principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Stat label="Enquêtes actives" value={enquetesActives} sublabel={`${enquetes.length} dans la vue`} />
        <Stat
          label="Réponses complètes"
          value={comp.length}
          sublabel={kindFilter === 'a_chaud' ? 'Déclenchées en session' : 'Sur la période'}
        />
        <Stat
          label="Taux de réponse"
          value={responseRate.pct === null ? '—' : `${Math.round(responseRate.pct)}%`}
          sublabel={responseRate.pct === null ? 'Pas d\'envois mail' : `${responseRate.responded} / ${responseRate.sent} envois`}
        />
        <Stat
          label="Satisfaction moyenne"
          value={avgPct === null ? '—' : `${Math.round(avgPct)}%`}
          sublabel={avgPct === null ? 'Pas de réponses échelle' : `Sur ${totalScales} note${totalScales > 1 ? 's' : ''}`}
        />
      </div>

      {/* Histogramme distribution */}
      <section className="bg-white rounded-lg border border-dark/10 p-5">
        <h2 className="font-display text-xl">Distribution de la satisfaction</h2>
        <p className="text-xs text-dark/60 mt-1">
          Toutes les questions de type échelle (1 à N) normalisées sur 0–100%. <span className="text-dark/40">1 = moins bien, N = meilleure note.</span>
        </p>
        {totalScales === 0 ? (
          <p className="mt-4 text-sm text-dark/60">Pas encore de note recueillie sur la période.</p>
        ) : (
          <div className="mt-5 grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-2 items-center">
            {(['0–20%', '20–40%', '40–60%', '60–80%', '80–100%'] as const).map((label, i) => {
              const count = buckets[i];
              const pct = totalScales > 0 ? Math.round((count / totalScales) * 100) : 0;
              const tone = i >= 3 ? 'bg-teal' : i === 2 ? 'bg-teal/60' : 'bg-orange';
              return (
                <Fragment key={i}>
                  <span className="text-xs text-dark/60 tabular-nums">{label}</span>
                  <div className="bg-light h-3 rounded-full overflow-hidden">
                    <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-right tabular-nums text-dark/70">
                    {count} <span className="text-dark/40">· {pct}%</span>
                  </span>
                </Fragment>
              );
            })}
          </div>
        )}
      </section>

      {/* Tableau enquêtes */}
      <section>
        <h2 className="font-display text-2xl tracking-wide">Enquêtes</h2>
        <p className="text-xs text-dark/60 mt-1">Cliquez sur une enquête pour voir les résultats détaillés.</p>
        <div className="mt-3 bg-white rounded-lg border border-dark/10 overflow-x-auto">
          {enquetesSorted.length === 0 ? (
            <p className="p-6 text-sm text-dark/60">Aucune enquête pour ce filtre.</p>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
                <tr>
                  <th className="text-left py-3 px-4">Enquête</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Formation</th>
                  <th className="text-right py-3 px-4">Réponses</th>
                  <th className="text-right py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark/10">
                {enquetesSorted.map((e) => (
                  <tr key={e.id} className={e.actif ? '' : 'opacity-60'}>
                    <td className="py-3 px-4">
                      <p className="font-medium truncate max-w-md">{e.nom}</p>
                      {!e.actif && <p className="text-xs text-orange mt-0.5">Désactivée</p>}
                    </td>
                    <td className="py-3 px-4">
                      <KindBadge kind={e.enquete_kind} />
                    </td>
                    <td className="py-3 px-4 text-dark/70">
                      {e.formation?.titre ?? <span className="text-dark/40">— globale —</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums">{e.completions}</td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/tests/${e.id}/resultats`} className="text-xs text-teal hover:underline whitespace-nowrap">
                        Résultats →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Section dédiée Financeur (toujours visible quand on est sur 'Toutes' ou 'Financeur') */}
      {(kindFilter === 'all' || kindFilter === 'financeur') && (
        <section className="bg-orange/5 rounded-lg border border-orange/20 p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-orange">Section dédiée</p>
              <h2 className="font-display text-xl mt-1">Enquête de satisfaction financeur</h2>
              <p className="text-xs text-dark/60 mt-1 max-w-2xl">
                Vue spécifique aux retours des entreprises ayant financé une formation pour leurs salariés.
              </p>
            </div>
            <ButtonLink href="/admin/tests/financeur" variant="secondary">Configurer</ButtonLink>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Envoyés" value={finSent} compact />
            <Stat label="Répondus" value={finResponded} compact />
            <Stat
              label="Taux"
              value={finSent > 0 ? `${Math.round((finResponded / finSent) * 100)}%` : '—'}
              compact
            />
            <Stat
              label="Satisfaction"
              value={(() => {
                const finTestIds = (enquetesAll ?? []).filter((e) => e.enquete_kind === 'financeur').map((e) => e.id);
                const finCompIds = new Set(comp.filter((c) => finTestIds.includes(c.test_id)).map((c) => c.id));
                const finScales: ScaleReponse[] = [];
                for (const r of respsInRange) {
                  if (!finCompIds.has(r.completion_id)) continue;
                  const q = qById.get(r.question_id);
                  if (!q || q.type_reponse !== 'echelle' || !q.echelle_max) continue;
                  const v = parseScaleValue(r.valeur);
                  if (v !== null) finScales.push({ echelleMax: q.echelle_max, valeur: v });
                }
                const a = averageScalePct(finScales);
                return a === null ? '—' : `${Math.round(a)}%`;
              })()}
              compact
            />
          </div>
        </section>
      )}

      {/* Réponses libres */}
      <section>
        <h2 className="font-display text-2xl tracking-wide">Retours libres</h2>
        <p className="text-xs text-dark/60 mt-1">
          Toutes les réponses textuelles non-vides sur la période, avec l'identité du répondant.
        </p>
        <div className="mt-3 space-y-3">
          {textResps.length === 0 ? (
            <div className="bg-white rounded-lg border border-dark/10 p-6 text-sm text-dark/60">
              Aucun retour libre sur la période.
            </div>
          ) : textResps.slice(0, 100).map((tr, i) => (
            <div key={`${tr.completion_id}-${tr.question_id}-${i}`} className="bg-white rounded-lg border border-dark/10 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-medium text-sm">
                    {tr.respondent.name || <em className="text-dark/50">Sans nom</em>}
                    {tr.respondent.email && <span className="text-dark/50 font-normal ml-2">· {tr.respondent.email}</span>}
                  </p>
                  <p className="text-xs text-dark/50 mt-0.5">{tr.question.libelle}</p>
                </div>
                <span className="text-xs text-dark/40 whitespace-nowrap">
                  {tr.completedAt && FR_DATETIME.format(new Date(tr.completedAt))}
                </span>
              </div>
              <p className="mt-3 text-sm text-dark/80 whitespace-pre-wrap">{tr.text}</p>
            </div>
          ))}
          {textResps.length > 100 && (
            <p className="text-xs text-dark/50 text-center">… {textResps.length - 100} retour(s) supplémentaire(s) non affichés.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function KindBadge({ kind }: { kind: EnqueteKind | null }) {
  if (kind === 'a_chaud') return <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-orange/10 text-orange">À chaud</span>;
  if (kind === 'a_froid') return <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-dark/10 text-dark/70">À froid</span>;
  if (kind === 'financeur') return <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-orange/10 text-orange">Financeur</span>;
  return <span className="text-xs text-dark/40">—</span>;
}

function Stat({ label, value, sublabel, compact = false }: { label: string; value: number | string; sublabel?: string; compact?: boolean }) {
  return (
    <div className={`bg-white rounded-lg border border-dark/10 ${compact ? 'p-3' : 'p-4 md:p-6'}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-dark/50">{label}</p>
      <p className={`font-display mt-2 text-teal ${compact ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>{value}</p>
      {sublabel && <p className="text-xs text-dark/50 mt-1">{sublabel}</p>}
    </div>
  );
}

