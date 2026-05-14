import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { completionScorePct, isBadScore, BAD_SCORE_THRESHOLD, type ScaleQ } from '@/lib/enquetes/alerts';
import type { QuestionType, EnqueteKind } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

interface PageProps { searchParams: Promise<{ filter?: 'open' | 'resolved' | 'all' }> }

const FR_DATETIME = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const FILTERS: { value: 'open' | 'resolved' | 'all'; label: string }[] = [
  { value: 'open',     label: 'Non résolues' },
  { value: 'resolved', label: 'Résolues' },
  { value: 'all',      label: 'Toutes' },
];

const KIND_LABEL: Record<EnqueteKind, string> = {
  a_chaud: 'À chaud',
  a_froid: 'À froid',
  financeur: 'Financeur',
};

export default async function AdminQualitePage({ searchParams }: PageProps) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const sp = await searchParams;
  const filter = sp.filter ?? 'open';

  const supabase = await createClient();

  // 1. Toutes les completions d'enquêtes (kind='enquete')
  const { data: completionsRaw } = await supabase
    .from('test_completions')
    .select(`
      id, test_id, inscription_id, inscription_participant_id, completed_at,
      test:tests!inner(id, nom, kind, enquete_kind, formation:formations(titre))
    `)
    .eq('test.kind', 'enquete')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  const completions = (completionsRaw ?? []) as Array<{
    id: string;
    test_id: string;
    inscription_id: string | null;
    inscription_participant_id: string | null;
    completed_at: string;
    test: {
      id: string; nom: string; kind: string; enquete_kind: EnqueteKind | null;
      formation: { titre: string } | { titre: string }[] | null;
    } | Array<{
      id: string; nom: string; kind: string; enquete_kind: EnqueteKind | null;
      formation: { titre: string } | { titre: string }[] | null;
    }>;
  }>;

  if (completions.length === 0) {
    return renderEmpty(filter);
  }

  // 2. Questions de tous les tests concernés
  const testIds = Array.from(new Set(completions.map((c) => c.test_id)));
  const completionIds = completions.map((c) => c.id);

  const [{ data: questions }, { data: responses }, { data: actions }] = await Promise.all([
    supabase
      .from('questions')
      .select('id, test_id, type_reponse, echelle_max')
      .in('test_id', testIds),
    supabase
      .from('responses')
      .select('completion_id, question_id, valeur')
      .in('completion_id', completionIds),
    supabase
      .from('enquete_actions_correctives')
      .select('completion_id, resolved, resolved_at, action_corrective, updated_at')
      .in('completion_id', completionIds),
  ]);

  const qById = new Map<string, ScaleQ>();
  for (const q of (questions ?? []) as Array<{ id: string; type_reponse: QuestionType; echelle_max: number | null }>) {
    qById.set(q.id, { type_reponse: q.type_reponse, echelle_max: q.echelle_max });
  }

  const respsByCompletion = new Map<string, Array<{ question_id: string; valeur: string | null }>>();
  for (const r of (responses ?? []) as Array<{ completion_id: string; question_id: string; valeur: string | null }>) {
    const arr = respsByCompletion.get(r.completion_id) ?? [];
    arr.push({ question_id: r.question_id, valeur: r.valeur });
    respsByCompletion.set(r.completion_id, arr);
  }

  const actionsByCompletion = new Map<string, { resolved: boolean; resolved_at: string | null; action_corrective: string | null; updated_at: string }>();
  for (const a of (actions ?? []) as Array<{ completion_id: string; resolved: boolean; resolved_at: string | null; action_corrective: string | null; updated_at: string }>) {
    actionsByCompletion.set(a.completion_id, a);
  }

  // 3. Détection mauvais résultats + filtre
  const alertes = completions
    .map((c) => {
      const rs = respsByCompletion.get(c.id) ?? [];
      const score = completionScorePct(rs, qById);
      return { c, score };
    })
    .filter((x) => isBadScore(x.score));

  // 4. Récupère identité (participant ou payer)
  const partIds = new Set<string>();
  const insIds = new Set<string>();
  for (const a of alertes) {
    if (a.c.inscription_participant_id) partIds.add(a.c.inscription_participant_id);
    else if (a.c.inscription_id) insIds.add(a.c.inscription_id);
  }
  const [{ data: parts }, { data: ins }] = await Promise.all([
    partIds.size === 0 ? Promise.resolve({ data: [] }) : supabase
      .from('inscription_participants')
      .select(`
        id,
        employee:employees(prenom, nom, email),
        profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
      `)
      .in('id', Array.from(partIds)),
    insIds.size === 0 ? Promise.resolve({ data: [] }) : supabase
      .from('inscriptions')
      .select(`
        id,
        payer:profiles!inscriptions_payer_profile_id_fkey(full_name, email),
        company:company_details!company_details_profile_id_fkey(raison_sociale)
      `)
      .in('id', Array.from(insIds)),
  ]);

  const whoByPart = new Map<string, { name: string; email: string; sub: string | null }>();
  for (const p of (parts ?? []) as Array<{
    id: string;
    employee: { prenom: string; nom: string; email: string } | { prenom: string; nom: string; email: string }[] | null;
    profile: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  }>) {
    const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
    const prof = Array.isArray(p.profile) ? p.profile[0] : p.profile;
    if (emp) whoByPart.set(p.id, { name: `${emp.prenom} ${emp.nom}`.trim(), email: emp.email, sub: 'Salarié' });
    else if (prof) whoByPart.set(p.id, { name: prof.full_name, email: prof.email, sub: 'Particulier' });
  }
  const whoByIns = new Map<string, { name: string; email: string; sub: string | null }>();
  for (const r of (ins ?? []) as Array<{
    id: string;
    payer: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
    company: { raison_sociale: string } | { raison_sociale: string }[] | null;
  }>) {
    const payer = Array.isArray(r.payer) ? r.payer[0] : r.payer;
    const comp = Array.isArray(r.company) ? r.company[0] : r.company;
    if (payer) {
      const name = comp?.raison_sociale ?? payer.full_name;
      whoByIns.set(r.id, { name, email: payer.email, sub: comp?.raison_sociale ? `via ${payer.full_name}` : 'Particulier' });
    }
  }

  // 5. Filtre par statut
  const rows = alertes.map((a) => {
    const action = actionsByCompletion.get(a.c.id);
    const test = Array.isArray(a.c.test) ? a.c.test[0] : a.c.test;
    const formation = test && (Array.isArray(test.formation) ? test.formation[0] : test.formation);
    const who = (a.c.inscription_participant_id && whoByPart.get(a.c.inscription_participant_id))
      || (a.c.inscription_id && whoByIns.get(a.c.inscription_id))
      || { name: 'Anonyme', email: '', sub: null };
    return {
      completionId: a.c.id,
      completedAt: a.c.completed_at,
      score: a.score ?? 0,
      resolved: action?.resolved ?? false,
      resolvedAt: action?.resolved_at ?? null,
      hasAction: !!(action?.action_corrective && action.action_corrective.trim().length > 0),
      testNom: test?.nom ?? '—',
      enqueteKind: test?.enquete_kind ?? null,
      formationTitre: formation?.titre ?? null,
      who,
    };
  }).filter((r) => {
    if (filter === 'open') return !r.resolved;
    if (filter === 'resolved') return r.resolved;
    return true;
  });

  const counts = {
    open: alertes.filter((a) => !actionsByCompletion.get(a.c.id)?.resolved).length,
    resolved: alertes.filter((a) => actionsByCompletion.get(a.c.id)?.resolved).length,
    all: alertes.length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Qualiopi"
        title="Gestion des mauvais résultats d'enquête"
        description={`Les complétions d'enquête dont la note moyenne est sous ${BAD_SCORE_THRESHOLD}%. Chaque mauvais résultat nécessite une action corrective.`}
        actions={<ButtonLink href="/admin" variant="secondary">← Tableau de bord</ButtonLink>}
      />

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <KpiCard label="À traiter" value={counts.open} tone="orange" />
        <KpiCard label="Résolues" value={counts.resolved} tone="teal" />
        <KpiCard label="Total" value={counts.all} tone="dark" />
      </div>

      <nav className="flex gap-1 border-b border-dark/10 flex-wrap">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          const count = counts[f.value];
          return (
            <Link
              key={f.value}
              href={`/admin/qualite${f.value === 'open' ? '' : `?filter=${f.value}`}`}
              className={`px-4 py-2 text-sm uppercase tracking-[0.15em] font-medium border-b-2 -mb-px transition ${
                active ? 'border-teal text-teal' : 'border-transparent text-dark/50 hover:text-dark'
              }`}
            >
              {f.label} <span className="text-dark/40 ml-1">({count})</span>
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <div className="bg-white rounded-lg border border-dark/10 p-8 text-sm text-dark/60 text-center">
          {filter === 'open' && '🎉 Aucune alerte ouverte. Toutes les enquêtes sont au-dessus du seuil ou ont été traitées.'}
          {filter === 'resolved' && 'Aucune alerte résolue pour le moment.'}
          {filter === 'all' && 'Aucun mauvais résultat enregistré à ce jour.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-dark/10 overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-3 px-4">Stagiaire</th>
                <th className="text-left py-3 px-4">Enquête</th>
                <th className="text-left py-3 px-4">Formation</th>
                <th className="text-right py-3 px-4">Score</th>
                <th className="text-left py-3 px-4">Statut</th>
                <th className="text-right py-3 px-4">Date</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {rows.map((r) => (
                <tr key={r.completionId} className="hover:bg-light/50">
                  <td className="py-3 px-4">
                    <p className="font-medium truncate max-w-xs">{r.who.name || <em className="text-dark/40">Sans nom</em>}</p>
                    {r.who.email && <p className="text-xs text-dark/60 truncate max-w-xs">{r.who.email}</p>}
                    {r.who.sub && <p className="text-xs text-dark/40">{r.who.sub}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-dark/80 truncate max-w-xs">{r.testNom}</p>
                    {r.enqueteKind && (
                      <p className="text-xs text-dark/50 mt-0.5">{KIND_LABEL[r.enqueteKind]}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-dark/70">
                    {r.formationTitre ?? <span className="text-dark/40">—</span>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <ScoreBadge pct={r.score} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge resolved={r.resolved} hasAction={r.hasAction} />
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-dark/60 whitespace-nowrap">
                    {FR_DATETIME.format(new Date(r.completedAt))}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/admin/qualite/${r.completionId}`}
                      className="text-xs uppercase tracking-[0.15em] text-teal hover:underline whitespace-nowrap"
                    >
                      {r.resolved ? 'Voir →' : 'Traiter →'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function renderEmpty(_filter: string) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Qualiopi"
        title="Gestion des mauvais résultats d'enquête"
        description="Pas encore de complétion d'enquête recueillie sur la plateforme."
        actions={<ButtonLink href="/admin" variant="secondary">← Tableau de bord</ButtonLink>}
      />
      <div className="bg-white rounded-lg border border-dark/10 p-8 text-sm text-dark/60 text-center">
        Aucune complétion d&apos;enquête. Les alertes apparaîtront ici dès qu&apos;une enquête sera remplie avec un score sous le seuil ({BAD_SCORE_THRESHOLD}%).
      </div>
    </div>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: number; tone: 'orange' | 'teal' | 'dark' }) {
  const valCls = tone === 'orange' ? 'text-orange' : tone === 'teal' ? 'text-teal' : 'text-dark';
  return (
    <div className="bg-white rounded-lg border border-dark/10 p-4 md:p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-dark/50">{label}</p>
      <p className={`font-display text-3xl md:text-4xl mt-2 ${valCls}`}>{value}</p>
    </div>
  );
}

function ScoreBadge({ pct }: { pct: number }) {
  const rounded = Math.round(pct);
  const tone = pct < 30 ? 'bg-orange/20 text-orange' : 'bg-orange/10 text-orange';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${tone}`}>
      {rounded}%
    </span>
  );
}

function StatusBadge({ resolved, hasAction }: { resolved: boolean; hasAction: boolean }) {
  if (resolved) {
    return <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-teal/10 text-teal">Résolue</span>;
  }
  if (hasAction) {
    return <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-orange/15 text-orange">En cours</span>;
  }
  return <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-orange/10 text-orange">À traiter</span>;
}
