import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * Endpoint d'ingestion du tracking analytics.
 *
 * Tous les écrits sur tracking_* passent par la service_role key, ce qui
 * permet l'écriture côté visiteur anonyme.
 *
 * Si l'utilisateur est connecté (cookies Supabase présents), on attache son
 * profile_id à la session pour un suivi non-anonyme.
 */

const MAX_PATH_LEN = 512;
const MAX_TITLE_LEN = 256;
const MAX_UA_LEN = 512;

interface BasePayload {
  type: 'pageview_start' | 'pageview_update' | 'pageview_end' | 'event';
  visitorId: string;
  sessionToken: string;
}

interface PageviewStartPayload extends BasePayload {
  type: 'pageview_start';
  path: string;
  title?: string;
  referrer?: string;
}

interface PageviewUpdatePayload extends BasePayload {
  type: 'pageview_update';
  pageviewId: string;
  maxScrollPct: number;
  scrollMilestones?: { 25?: number; 50?: number; 75?: number; 100?: number };
}

interface PageviewEndPayload extends BasePayload {
  type: 'pageview_end';
  pageviewId: string;
  durationMs: number;
  maxScrollPct: number;
}

interface EventPayload extends BasePayload {
  type: 'event';
  pageviewId?: string | null;
  name: string;
  props?: Record<string, unknown>;
}

type Payload = PageviewStartPayload | PageviewUpdatePayload | PageviewEndPayload | EventPayload;

function trim(s: string | undefined | null, max: number): string | null {
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function safeNumber(n: unknown, max = 100): number {
  const v = typeof n === 'number' ? n : 0;
  if (Number.isNaN(v) || v < 0) return 0;
  return Math.min(v, max);
}

function extractRefererHost(referrer: string | undefined): string | null {
  if (!referrer) return null;
  try {
    const u = new URL(referrer);
    return u.host || null;
  } catch {
    return null;
  }
}

async function findOrCreateSession(
  visitorId: string,
  sessionToken: string,
  userAgent: string | null,
  refererHost: string | null,
  profileId: string | null
): Promise<{ id: string } | null> {
  const admin = createAdminClient();

  // On utilise sessionToken (sessionStorage côté client) comme clé naturelle
  // pour identifier la "browser session" courante. On garde 1 row par paire
  // (visitor_id, sessionToken).
  const { data: existing } = await admin
    .from('tracking_sessions')
    .select('id, profile_id')
    .eq('visitor_id', visitorId)
    .eq('id', sessionToken)
    .maybeSingle();

  if (existing) {
    const patch: Record<string, unknown> = { last_seen_at: new Date().toISOString() };
    if (profileId && profileId !== existing.profile_id) patch.profile_id = profileId;
    await admin.from('tracking_sessions').update(patch).eq('id', existing.id);
    return { id: existing.id };
  }

  // Insertion : sessionToken doit être un UUID valide (le client génère un UUID v4).
  // Sinon Supabase rejette. On bascule sur un UUID généré par la BDD.
  const isUuid = /^[0-9a-fA-F-]{36}$/.test(sessionToken);
  const insertPayload: Record<string, unknown> = {
    visitor_id: visitorId,
    user_agent: userAgent,
    referrer_host: refererHost,
    profile_id: profileId,
  };
  if (isUuid) insertPayload.id = sessionToken;

  const { data, error } = await admin
    .from('tracking_sessions')
    .insert(insertPayload)
    .select('id')
    .single();
  if (error || !data) {
    console.error('[track] session insert failed', error);
    return null;
  }
  return { id: data.id };
}

export async function POST(request: NextRequest) {
  let payload: Payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-json' }, { status: 400 });
  }

  if (!payload || !payload.type || !payload.visitorId || !payload.sessionToken) {
    return NextResponse.json({ ok: false, error: 'missing-fields' }, { status: 400 });
  }

  // Identité utilisateur via cookies Supabase (si connecté)
  let profileId: string | null = null;
  try {
    const supa = await createServerClient();
    const { data: { user } } = await supa.auth.getUser();
    if (user?.id) profileId = user.id;
  } catch {
    // ignore — visiteur anonyme
  }

  const userAgent = trim(request.headers.get('user-agent'), MAX_UA_LEN);

  if (payload.type === 'pageview_start') {
    const refererHost = extractRefererHost(payload.referrer);
    const session = await findOrCreateSession(payload.visitorId, payload.sessionToken, userAgent, refererHost, profileId);
    if (!session) return NextResponse.json({ ok: false }, { status: 500 });

    const admin = createAdminClient();
    const path = trim(payload.path, MAX_PATH_LEN);
    if (!path) return NextResponse.json({ ok: false, error: 'missing-path' }, { status: 400 });

    const { data, error } = await admin
      .from('tracking_pageviews')
      .insert({
        session_id: session.id,
        url_path: path,
        page_title: trim(payload.title, MAX_TITLE_LEN),
      })
      .select('id')
      .single();
    if (error || !data) {
      console.error('[track] pv start failed', error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    return NextResponse.json({ ok: true, pageviewId: data.id, sessionId: session.id });
  }

  if (payload.type === 'pageview_update') {
    const admin = createAdminClient();
    const maxScrollPct = safeNumber(payload.maxScrollPct, 100);
    const patch: Record<string, unknown> = { max_scroll_pct: maxScrollPct };
    const now = new Date().toISOString();
    if (payload.scrollMilestones?.[25]) patch.scroll_25_at = now;
    if (payload.scrollMilestones?.[50]) patch.scroll_50_at = now;
    if (payload.scrollMilestones?.[75]) patch.scroll_75_at = now;
    if (payload.scrollMilestones?.[100]) patch.scroll_100_at = now;
    const { error } = await admin
      .from('tracking_pageviews')
      .update(patch)
      .eq('id', payload.pageviewId);
    if (error) console.error('[track] pv update failed', error);
    return NextResponse.json({ ok: true });
  }

  if (payload.type === 'pageview_end') {
    const admin = createAdminClient();
    const durationMs = Math.max(0, Math.min(payload.durationMs || 0, 6 * 60 * 60 * 1000)); // cap à 6h
    const maxScrollPct = safeNumber(payload.maxScrollPct, 100);
    const { error } = await admin
      .from('tracking_pageviews')
      .update({
        ended_at: new Date().toISOString(),
        duration_ms: durationMs,
        max_scroll_pct: maxScrollPct,
      })
      .eq('id', payload.pageviewId);
    if (error) console.error('[track] pv end failed', error);
    return NextResponse.json({ ok: true });
  }

  if (payload.type === 'event') {
    const admin = createAdminClient();
    const name = trim(payload.name, 64);
    if (!name) return NextResponse.json({ ok: false, error: 'missing-name' }, { status: 400 });
    const refererHost = extractRefererHost(request.headers.get('referer') ?? undefined);
    const session = await findOrCreateSession(payload.visitorId, payload.sessionToken, userAgent, refererHost, profileId);
    if (!session) return NextResponse.json({ ok: false }, { status: 500 });
    const { error } = await admin.from('tracking_events').insert({
      session_id: session.id,
      pageview_id: payload.pageviewId ?? null,
      name,
      props: payload.props ?? {},
    });
    if (error) console.error('[track] event failed', error);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: 'unknown-type' }, { status: 400 });
}
