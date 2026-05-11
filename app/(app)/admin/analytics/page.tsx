import Link from 'next/link';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ days?: string }>;
}

const RANGES: { value: string; label: string; days: number }[] = [
  { value: '7', label: '7 derniers jours', days: 7 },
  { value: '30', label: '30 jours', days: 30 },
  { value: '90', label: '90 jours', days: 90 },
  { value: 'all', label: 'Tout', days: 3650 },
];

function fmtDuration(ms: number): string {
  if (!ms || ms < 1000) return '< 1s';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return rs > 0 ? `${m}m ${rs}s` : `${m}m`;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const rangeValue = sp.days ?? '30';
  const range = RANGES.find((r) => r.value === rangeValue) ?? RANGES[1];
  const since = new Date(Date.now() - range.days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = await createClient();

  // Pageviews + events sur la période
  const [{ data: pageviews }, { data: events }, { data: sessions }] = await Promise.all([
    supabase
      .from('tracking_pageviews')
      .select('id, session_id, url_path, page_title, started_at, ended_at, duration_ms, max_scroll_pct')
      .gte('started_at', since)
      .order('started_at', { ascending: false })
      .limit(5000),
    supabase
      .from('tracking_events')
      .select('name, props, occurred_at, session_id')
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false })
      .limit(2000),
    supabase
      .from('tracking_sessions')
      .select(`
        id, visitor_id, profile_id, started_at, last_seen_at, referrer_host,
        profile:profiles!tracking_sessions_profile_id_fkey(full_name, email)
      `)
      .gte('started_at', since)
      .order('started_at', { ascending: false })
      .limit(2000),
  ]);

  const pvs = pageviews ?? [];
  const evs = events ?? [];
  const sess = sessions ?? [];

  // KPIs
  const totalPageviews = pvs.length;
  const totalSessions = sess.length;
  const uniqueVisitors = new Set(sess.map((s) => s.visitor_id)).size;
  const identifiedSessions = sess.filter((s) => s.profile_id).length;

  // Durées et scroll
  const validDurations = pvs.filter((p) => p.duration_ms && p.duration_ms > 0);
  const avgDuration = validDurations.length > 0
    ? Math.round(validDurations.reduce((a, b) => a + (b.duration_ms ?? 0), 0) / validDurations.length)
    : 0;
  const avgScroll = pvs.length > 0
    ? Math.round(pvs.reduce((a, b) => a + (b.max_scroll_pct ?? 0), 0) / pvs.length)
    : 0;

  // Top pages
  const pagesAgg = new Map<string, { views: number; totalDuration: number; totalScroll: number; title: string | null }>();
  for (const p of pvs) {
    const cur = pagesAgg.get(p.url_path) ?? { views: 0, totalDuration: 0, totalScroll: 0, title: p.page_title };
    cur.views++;
    cur.totalDuration += p.duration_ms ?? 0;
    cur.totalScroll += p.max_scroll_pct ?? 0;
    if (!cur.title && p.page_title) cur.title = p.page_title;
    pagesAgg.set(p.url_path, cur);
  }
  const topPages = Array.from(pagesAgg.entries())
    .map(([path, agg]) => ({
      path,
      title: agg.title,
      views: agg.views,
      avgDuration: agg.views > 0 ? Math.round(agg.totalDuration / agg.views) : 0,
      avgScroll: agg.views > 0 ? Math.round(agg.totalScroll / agg.views) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 15);

  // Top CTAs
  const eventsAgg = new Map<string, number>();
  for (const e of evs) {
    eventsAgg.set(e.name, (eventsAgg.get(e.name) ?? 0) + 1);
  }
  const topEvents = Array.from(eventsAgg.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Sessions par jour (courbe simple)
  const dayMap = new Map<string, number>();
  for (const s of sess) {
    const day = s.started_at.slice(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }
  const days = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDay = Math.max(1, ...days.map(([, c]) => c));

  // Utilisateurs connectés
  type SessRow = (typeof sess)[number];
  const identifiedMap = new Map<string, {
    profile_id: string;
    full_name: string;
    email: string;
    sessions: SessRow[];
  }>();
  for (const s of sess) {
    if (!s.profile_id) continue;
    const prof = Array.isArray(s.profile) ? s.profile[0] : s.profile;
    const existing = identifiedMap.get(s.profile_id);
    if (existing) {
      existing.sessions.push(s);
    } else {
      identifiedMap.set(s.profile_id, {
        profile_id: s.profile_id,
        full_name: prof?.full_name ?? '',
        email: prof?.email ?? '',
        sessions: [s],
      });
    }
  }
  const identifiedUsers = Array.from(identifiedMap.values())
    .sort((a, b) => b.sessions.length - a.sessions.length);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Analytics"
        description="Trafic et engagement sur le site vitrine."
      />

      <nav className="flex gap-2 flex-wrap">
        {RANGES.map((r) => {
          const active = r.value === rangeValue;
          return (
            <Link
              key={r.value}
              href={`/admin/analytics${r.value === '30' ? '' : `?days=${r.value}`}`}
              className={`text-sm px-3 py-1.5 rounded-full border transition ${
                active ? 'bg-teal text-white border-teal' : 'bg-white text-dark/70 border-dark/15 hover:border-dark/40'
              }`}
            >
              {r.label}
            </Link>
          );
        })}
      </nav>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Stat label="Pages vues" value={totalPageviews} />
        <Stat label="Sessions" value={totalSessions} sublabel={`${uniqueVisitors} visiteurs uniques`} />
        <Stat label="Durée moyenne / page" value={fmtDuration(avgDuration)} />
        <Stat label="Scroll moyen" value={`${avgScroll}%`} />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg border border-dark/10 p-5">
          <h2 className="font-display text-xl">Sessions par jour</h2>
          {days.length === 0 ? (
            <p className="text-sm text-dark/60 mt-3">Pas encore de données sur la période.</p>
          ) : (
            <div className="mt-4 grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 items-center">
              {days.map(([day, count]) => (
                <Row key={day} day={day} count={count} max={maxDay} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-dark/10 p-5">
          <h2 className="font-display text-xl">Identification</h2>
          <p className="text-xs text-dark/60 mt-1">Sessions associées à un compte.</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-dark/70">Connectés</span>
              <span className="font-medium text-teal">{identifiedSessions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark/70">Anonymes</span>
              <span className="font-medium text-dark/70">{totalSessions - identifiedSessions}</span>
            </div>
            <div className="pt-3 border-t border-dark/10 text-xs text-dark/50">
              Le tracking est non-anonyme uniquement pour les utilisateurs connectés à leur espace ; sinon visitor_id rotatif côté navigateur.
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl tracking-wide">Top pages</h2>
        <div className="mt-3 bg-white rounded-lg border border-dark/10 overflow-x-auto">
          {topPages.length === 0 ? (
            <p className="p-6 text-sm text-dark/60">Aucune page consultée sur cette période.</p>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
                <tr>
                  <th className="text-left py-3 px-4">Page</th>
                  <th className="text-right py-3 px-4">Vues</th>
                  <th className="text-right py-3 px-4">Durée moy.</th>
                  <th className="text-right py-3 px-4">Scroll moy.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark/10">
                {topPages.map((p) => (
                  <tr key={p.path}>
                    <td className="py-3 px-4">
                      <p className="font-medium truncate max-w-md">{p.title || p.path}</p>
                      <p className="text-xs text-dark/50 mt-0.5 font-mono">{p.path}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{p.views}</td>
                    <td className="py-3 px-4 text-right text-dark/70">{fmtDuration(p.avgDuration)}</td>
                    <td className="py-3 px-4 text-right text-dark/70">{p.avgScroll}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-dark/10 p-5">
          <h2 className="font-display text-xl">CTAs cliqués</h2>
          <p className="text-xs text-dark/60 mt-1">
            Ajoutez <code className="bg-light px-1.5 rounded text-xs">data-track=&quot;event_name&quot;</code> sur un élément pour le suivre.
          </p>
          {topEvents.length === 0 ? (
            <p className="mt-4 text-sm text-dark/60">Aucun clic tracé sur cette période.</p>
          ) : (
            <ul className="mt-4 divide-y divide-dark/10">
              {topEvents.map((e) => (
                <li key={e.name} className="py-2 flex items-center justify-between">
                  <span className="font-mono text-sm">{e.name}</span>
                  <span className="text-sm font-medium text-teal">{e.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg border border-dark/10 p-5">
          <h2 className="font-display text-xl">Utilisateurs connectés</h2>
          <p className="text-xs text-dark/60 mt-1">Personnes identifiées ayant visité le site.</p>
          {identifiedUsers.length === 0 ? (
            <p className="mt-4 text-sm text-dark/60">Aucun utilisateur connecté sur cette période.</p>
          ) : (
            <ul className="mt-4 divide-y divide-dark/10">
              {identifiedUsers.slice(0, 12).map((u) => (
                <li key={u.profile_id} className="py-2">
                  <Link
                    href={`/admin/analytics/user/${u.profile_id}?days=${rangeValue}`}
                    className="flex items-center justify-between gap-3 hover:bg-light/50 -mx-2 px-2 py-1 rounded transition"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{u.full_name || u.email}</p>
                      {u.full_name && <p className="text-xs text-dark/60 truncate">{u.email}</p>}
                    </div>
                    <span className="text-xs text-teal whitespace-nowrap">
                      {u.sessions.length} session{u.sessions.length > 1 ? 's' : ''} →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, sublabel }: { label: string; value: number | string; sublabel?: string }) {
  return (
    <div className="bg-white rounded-lg border border-dark/10 p-4 md:p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-dark/50">{label}</p>
      <p className="font-display text-3xl md:text-4xl mt-2 text-teal">{value}</p>
      {sublabel && <p className="text-xs text-dark/50 mt-1">{sublabel}</p>}
    </div>
  );
}

function Row({ day, count, max }: { day: string; count: number; max: number }) {
  const pct = Math.round((count / max) * 100);
  return (
    <>
      <span className="font-mono text-xs text-dark/50">{day.slice(5)}</span>
      <div className="bg-light h-3 rounded-full overflow-hidden">
        <div className="h-full bg-teal" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-right tabular-nums">{count}</span>
    </>
  );
}
