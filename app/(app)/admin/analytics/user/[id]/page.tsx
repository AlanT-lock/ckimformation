import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ days?: string }>;
}

const FR_DATETIME = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

function fmtDuration(ms: number): string {
  if (!ms || ms < 1000) return '< 1s';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return rs > 0 ? `${m}m ${rs}s` : `${m}m`;
}

export const dynamic = 'force-dynamic';

export default async function AnalyticsUserPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const days = sp.days ? parseInt(sp.days, 10) : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: user } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, account_type')
    .eq('id', id)
    .single();
  if (!user) notFound();

  // Sessions de cet utilisateur
  const { data: sessions } = await supabase
    .from('tracking_sessions')
    .select('id, visitor_id, started_at, last_seen_at, referrer_host, user_agent')
    .eq('profile_id', id)
    .gte('started_at', since)
    .order('started_at', { ascending: false });

  interface PvRow { id: string; session_id: string; url_path: string; page_title: string | null; started_at: string; duration_ms: number | null; max_scroll_pct: number | null }
  interface EvtRow { id: string; session_id: string; name: string; props: unknown; occurred_at: string }

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const pageviewsRes = sessionIds.length > 0
    ? await supabase
        .from('tracking_pageviews')
        .select('id, session_id, url_path, page_title, started_at, duration_ms, max_scroll_pct')
        .in('session_id', sessionIds)
        .order('started_at', { ascending: false })
        .limit(2000)
    : { data: [] as PvRow[] };
  const pageviews = (pageviewsRes.data ?? []) as PvRow[];

  const eventsRes = sessionIds.length > 0
    ? await supabase
        .from('tracking_events')
        .select('id, session_id, name, props, occurred_at')
        .in('session_id', sessionIds)
        .order('occurred_at', { ascending: false })
        .limit(500)
    : { data: [] as EvtRow[] };
  const events = (eventsRes.data ?? []) as EvtRow[];

  const pvBySession = new Map<string, PvRow[]>();
  for (const p of pageviews) {
    const arr = pvBySession.get(p.session_id) ?? [];
    arr.push(p);
    pvBySession.set(p.session_id, arr);
  }
  const evtBySession = new Map<string, EvtRow[]>();
  for (const e of events) {
    const arr = evtBySession.get(e.session_id) ?? [];
    arr.push(e);
    evtBySession.set(e.session_id, arr);
  }

  // Stats globales
  const totalPv = pageviews.length;
  const totalDuration = pageviews.reduce((a, b) => a + (b.duration_ms ?? 0), 0);
  const avgScroll = totalPv > 0
    ? Math.round(pageviews.reduce((a, b) => a + (b.max_scroll_pct ?? 0), 0) / totalPv)
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Analytics · Utilisateur"
        title={user.full_name || user.email}
        description={user.email}
        actions={<ButtonLink href={`/admin/analytics?days=${days === 30 ? '30' : days}`} variant="secondary">← Analytics</ButtonLink>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Stat label="Sessions" value={sessions?.length ?? 0} />
        <Stat label="Pages vues" value={totalPv} />
        <Stat label="Temps total" value={fmtDuration(totalDuration)} />
        <Stat label="Scroll moyen" value={`${avgScroll}%`} />
      </div>

      <section>
        <h2 className="font-display text-2xl tracking-wide">Parcours détaillé</h2>
        <p className="text-xs text-dark/60 mt-1">Liste chronologique des sessions et pages visitées.</p>

        {(sessions ?? []).length === 0 ? (
          <div className="mt-4 bg-white rounded-lg border border-dark/10 p-6 text-sm text-dark/60">
            Aucune visite sur la période.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {(sessions ?? []).map((s) => {
              const pvs = pvBySession.get(s.id) ?? [];
              const evts = evtBySession.get(s.id) ?? [];
              return (
                <details key={s.id} className="bg-white rounded-lg border border-dark/10">
                  <summary className="px-4 py-3 cursor-pointer flex items-start justify-between gap-3 flex-wrap hover:bg-light/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        Session du {FR_DATETIME.format(new Date(s.started_at))}
                      </p>
                      <p className="text-xs text-dark/60 mt-0.5">
                        {pvs.length} page{pvs.length > 1 ? 's' : ''} · {evts.length} clic{evts.length > 1 ? 's' : ''}
                        {s.referrer_host && <> · venu de <span className="font-mono">{s.referrer_host}</span></>}
                      </p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-teal whitespace-nowrap self-center">
                      Détail
                    </span>
                  </summary>
                  <div className="border-t border-dark/10 p-4 space-y-3 text-sm">
                    {pvs.length === 0 ? (
                      <p className="text-dark/60 italic">Aucune page consultée.</p>
                    ) : (
                      <ol className="space-y-1.5">
                        {pvs.slice().reverse().map((p, i) => (
                          <li key={p.id} className="flex items-start gap-3">
                            <span className="text-xs font-mono text-dark/40 mt-0.5">{i + 1}.</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{p.page_title || p.url_path}</p>
                              <p className="text-xs text-dark/60 font-mono truncate">{p.url_path}</p>
                              <p className="text-xs text-dark/50 mt-0.5">
                                {FR_DATETIME.format(new Date(p.started_at))} · {fmtDuration(p.duration_ms ?? 0)} · scroll {p.max_scroll_pct ?? 0}%
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                    {evts.length > 0 && (
                      <div className="pt-3 border-t border-dark/10">
                        <p className="text-xs uppercase tracking-[0.15em] text-dark/50 mb-2">Clics</p>
                        <ul className="space-y-0.5 text-xs">
                          {evts.slice().reverse().map((e) => (
                            <li key={e.id} className="font-mono text-dark/70">
                              {FR_DATETIME.format(new Date(e.occurred_at)).slice(-5)} · {e.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-lg border border-dark/10 p-4 md:p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-dark/50">{label}</p>
      <p className="font-display text-3xl md:text-4xl mt-2 text-teal">{value}</p>
    </div>
  );
}
