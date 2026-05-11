/**
 * Petit helper pour mémoriser dans localStorage les déclencheurs déjà
 * "acquittés" par l'utilisateur (popup déjà fermé une fois).
 *
 * Utilisé pour que le popup "tout le monde a signé / terminé" n'apparaisse
 * qu'une seule fois par déclenchement, même après un refresh.
 */

const KEY = 'ckim:acked-triggers';

function readAll(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeAll(set: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
  } catch {
    // localStorage saturé ou bloqué — ignore
  }
}

export function loadAckedTriggers(): Set<string> {
  return readAll();
}

export function markTriggerAcked(triggerId: string): void {
  const s = readAll();
  s.add(triggerId);
  writeAll(s);
}

export function isTriggerAcked(triggerId: string): boolean {
  return readAll().has(triggerId);
}
