// URL publique du site, utilisée pour tous les liens envoyés par email (enquêtes,
// invitations, documents…) et les ressources des PDF. Source unique : ne pas
// redéfinir de helper local.

export const CANONICAL_SITE_URL = 'https://ckimformation.fr';

/**
 * `NEXT_PUBLIC_SITE_URL` si définie, sauf si elle pointe vers un domaine
 * `*.vercel.app` (les adresses Vercel ne doivent jamais partir dans un email :
 * elles peuvent renvoyer une 404 DEPLOYMENT_NOT_FOUND). À défaut, le domaine
 * officiel en production, localhost en développement.
 */
export function siteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().replace(/\/+$/, '');
  if (raw) {
    try {
      const host = new URL(raw).hostname;
      if (!host.endsWith('.vercel.app')) return raw;
    } catch {
      // URL invalide : on ignore
    }
  }
  return process.env.NODE_ENV === 'production' ? CANONICAL_SITE_URL : 'http://localhost:3000';
}
