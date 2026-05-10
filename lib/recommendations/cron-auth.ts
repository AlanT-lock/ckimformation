import 'server-only';

/**
 * Vérifie que la requête vient bien de Vercel Cron (ou d'un appel manuel authentifié).
 * Vercel Cron envoie l'en-tête `Authorization: Bearer $CRON_SECRET`.
 */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization');
  return header === `Bearer ${secret}`;
}
