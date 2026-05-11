'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const VISITOR_KEY = 'ckim-visitor-id';
const SESSION_KEY = 'ckim-session-id';
const SCROLL_THROTTLE_MS = 1500;

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // fallback simple
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getVisitorId(): string {
  try {
    let v = localStorage.getItem(VISITOR_KEY);
    if (!v) {
      v = uuid();
      localStorage.setItem(VISITOR_KEY, v);
    }
    return v;
  } catch {
    return 'no-storage';
  }
}

function getSessionToken(): string {
  try {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = uuid();
      sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return uuid();
  }
}

interface PageviewState {
  pageviewId: string | null;
  startedAt: number;
  maxScrollPct: number;
  milestones: Set<25 | 50 | 75 | 100>;
}

function computeScrollPct(): number {
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop;
  const winH = window.innerHeight || doc.clientHeight;
  const docH = Math.max(doc.scrollHeight, doc.offsetHeight) - winH;
  if (docH <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((scrollTop / docH) * 100)));
}

async function postTrack(body: Record<string, unknown>): Promise<{ ok: boolean; pageviewId?: string }> {
  try {
    const res = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
    return res.ok ? await res.json() : { ok: false };
  } catch {
    return { ok: false };
  }
}

function sendBeacon(body: Record<string, unknown>): boolean {
  if (typeof navigator === 'undefined' || !('sendBeacon' in navigator)) return false;
  try {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    return navigator.sendBeacon('/api/track', blob);
  } catch {
    return false;
  }
}

export function Tracker() {
  const pathname = usePathname();
  const visitorIdRef = useRef<string>('');
  const sessionTokenRef = useRef<string>('');
  const stateRef = useRef<PageviewState>({ pageviewId: null, startedAt: 0, maxScrollPct: 0, milestones: new Set() });

  // Init visitor/session une seule fois après mount
  useEffect(() => {
    visitorIdRef.current = getVisitorId();
    sessionTokenRef.current = getSessionToken();
  }, []);

  // Démarrage / clôture des pageviews au changement de route
  useEffect(() => {
    if (!pathname) return;
    let cancelled = false;

    async function startPv() {
      // Clôture le précédent si présent
      if (stateRef.current.pageviewId) {
        flushEnd();
      }
      const visitorId = visitorIdRef.current || getVisitorId();
      const sessionToken = sessionTokenRef.current || getSessionToken();
      const res = await postTrack({
        type: 'pageview_start',
        visitorId,
        sessionToken,
        path: pathname,
        title: document.title,
        referrer: document.referrer || undefined,
      });
      if (cancelled) return;
      stateRef.current = {
        pageviewId: res.ok && res.pageviewId ? res.pageviewId : null,
        startedAt: Date.now(),
        maxScrollPct: 0,
        milestones: new Set(),
      };
    }

    function flushEnd() {
      const st = stateRef.current;
      if (!st.pageviewId) return;
      const body = {
        type: 'pageview_end' as const,
        visitorId: visitorIdRef.current,
        sessionToken: sessionTokenRef.current,
        pageviewId: st.pageviewId,
        durationMs: Date.now() - st.startedAt,
        maxScrollPct: st.maxScrollPct,
      };
      // On préfère sendBeacon (survit au unload), sinon fetch keepalive
      if (!sendBeacon(body)) postTrack(body);
      stateRef.current = { pageviewId: null, startedAt: 0, maxScrollPct: 0, milestones: new Set() };
    }

    startPv();

    return () => {
      cancelled = true;
      flushEnd();
    };
  }, [pathname]);

  // Scroll tracking — throttle pour mettre à jour max_scroll_pct + milestones
  useEffect(() => {
    let lastUpdate = 0;
    let scheduled: number | null = null;

    function flushScroll() {
      scheduled = null;
      const st = stateRef.current;
      if (!st.pageviewId) return;
      const pct = computeScrollPct();
      let changed = false;
      const newMilestones: Record<string, true> = {};
      ([25, 50, 75, 100] as const).forEach((m) => {
        if (pct >= m && !st.milestones.has(m)) {
          st.milestones.add(m);
          newMilestones[m] = true;
          changed = true;
        }
      });
      if (pct > st.maxScrollPct) {
        st.maxScrollPct = pct;
        changed = true;
      }
      if (changed) {
        postTrack({
          type: 'pageview_update',
          visitorId: visitorIdRef.current,
          sessionToken: sessionTokenRef.current,
          pageviewId: st.pageviewId,
          maxScrollPct: st.maxScrollPct,
          scrollMilestones: newMilestones,
        });
      }
    }

    function onScroll() {
      const now = Date.now();
      if (now - lastUpdate < SCROLL_THROTTLE_MS) {
        if (scheduled !== null) return;
        scheduled = window.setTimeout(() => {
          lastUpdate = Date.now();
          flushScroll();
        }, SCROLL_THROTTLE_MS);
        return;
      }
      lastUpdate = now;
      flushScroll();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scheduled !== null) window.clearTimeout(scheduled);
    };
  }, []);

  // beforeunload — envoie l'event final via beacon
  useEffect(() => {
    function onUnload() {
      const st = stateRef.current;
      if (!st.pageviewId) return;
      sendBeacon({
        type: 'pageview_end',
        visitorId: visitorIdRef.current,
        sessionToken: sessionTokenRef.current,
        pageviewId: st.pageviewId,
        durationMs: Date.now() - st.startedAt,
        maxScrollPct: st.maxScrollPct,
      });
    }
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  // Click tracking via data-track="event_name" sur le DOM
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest<HTMLElement>('[data-track]');
      if (!el) return;
      const name = el.getAttribute('data-track');
      if (!name) return;
      // Récupère les data-track-* en props
      const props: Record<string, string> = {};
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith('data-track-')) {
          props[attr.name.slice('data-track-'.length)] = attr.value;
        }
      }
      // Si lien, ajoute href
      const href = (el as HTMLAnchorElement).href;
      if (href) props.href = href;

      postTrack({
        type: 'event',
        visitorId: visitorIdRef.current,
        sessionToken: sessionTokenRef.current,
        pageviewId: stateRef.current.pageviewId,
        name,
        props,
      });
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
