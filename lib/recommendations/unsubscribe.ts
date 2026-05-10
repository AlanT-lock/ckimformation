import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

function getSecret(): string {
  const s = process.env.RELANCES_UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error('RELANCES_UNSUBSCRIBE_SECRET non défini');
  return s;
}

export function signUnsubscribeToken(profileId: string): string {
  return createHmac('sha256', getSecret()).update(profileId).digest('hex');
}

export function verifyUnsubscribeToken(profileId: string, token: string): boolean {
  if (!profileId || !token || token.length !== 64) return false;
  const expected = signUnsubscribeToken(profileId);
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'));
  } catch {
    return false;
  }
}

export function buildUnsubscribeUrl(siteUrl: string, profileId: string): string {
  const token = signUnsubscribeToken(profileId);
  return `${siteUrl}/api/relances/unsubscribe?p=${profileId}&t=${token}`;
}
