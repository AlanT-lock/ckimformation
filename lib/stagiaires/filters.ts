// Filtres de la page admin Stagiaires (paramètres d'URL).

export type StagiairesTri = 'nom' | 'recent';

export interface StagiairesFilters {
  q: string;
  du: string | null; // YYYY-MM-DD
  au: string | null; // YYYY-MM-DD
  entreprise: string | null; // profile id de l'entreprise
  tri: StagiairesTri;
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validYmd(v: string | undefined): string | null {
  if (!v || !YMD.test(v)) return null;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? v : null;
}

export function parseStagiairesFilters(sp: Record<string, string | undefined>): StagiairesFilters {
  return {
    q: (sp.q ?? '').trim(),
    du: validYmd(sp.du),
    au: validYmd(sp.au),
    entreprise: sp.entreprise && UUID.test(sp.entreprise) ? sp.entreprise : null,
    tri: sp.tri === 'recent' ? 'recent' : 'nom',
  };
}

/** Décalage (minutes) de Europe/Paris par rapport à UTC à l'instant donné. */
function parisOffsetMinutes(utcMs: number): number {
  const tz = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'shortOffset' })
    .formatToParts(new Date(utcMs))
    .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = tz.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

/** Instant UTC (ISO) correspondant à 00:00 heure de Paris le jour `ymd`. */
export function parisDayStartIso(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d);
  return new Date(utcMidnight - parisOffsetMinutes(utcMidnight) * 60_000).toISOString();
}

/** Bornes [gte, lt) en UTC pour une période du/au (jours inclus, heure de Paris). */
export function createdAtBounds(du: string | null, au: string | null): { gte: string | null; lt: string | null } {
  let lt: string | null = null;
  if (au) {
    const [y, m, d] = au.split('-').map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
    lt = parisDayStartIso(next);
  }
  return { gte: du ? parisDayStartIso(du) : null, lt };
}
