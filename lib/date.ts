// Formatage de dates centralisé de l'application.
// Locale fr-FR + timeZone Europe/Paris FIGÉ : seule source de formatage de dates
// (web, PDF, emails). NE PAS marquer 'server-only' — utilisé aussi côté client.

const LOCALE = 'fr-FR';
const TZ = 'Europe/Paris';

const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});
const dateFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  day: '2-digit', month: '2-digit', year: 'numeric',
});
const timeFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  hour: '2-digit', minute: '2-digit',
});
const dateLongFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});
const dateLetterFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  day: 'numeric', month: 'long', year: 'numeric',
});

type DateInput = Date | string | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(value: DateInput): string {
  const d = toDate(value);
  return d ? dateTimeFmt.format(d) : '';
}

export function formatDate(value: DateInput): string {
  const d = toDate(value);
  return d ? dateFmt.format(d) : '';
}

export function formatTime(value: DateInput): string {
  const d = toDate(value);
  return d ? timeFmt.format(d) : '';
}

export function formatDateLong(value: DateInput): string {
  const d = toDate(value);
  return d ? dateLongFmt.format(d) : '';
}

/** Date longue sans jour de semaine — ex. « 19 août 2026 » (en-tête de lettre). */
export function formatDateLetter(value: DateInput): string {
  const d = toDate(value);
  return d ? dateLetterFmt.format(d) : '';
}

// 'en-CA' produit le format ISO YYYY-MM-DD ; utilisé uniquement pour comparer des dates, jamais affiché.
const isoDayFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric', month: '2-digit', day: '2-digit',
});

/** Date du jour à Paris au format YYYY-MM-DD (comparable aux colonnes `date`). */
export function todayIsoParis(now: Date = new Date()): string {
  return isoDayFmt.format(now);
}
