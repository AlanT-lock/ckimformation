import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  recentLogs: [] as unknown[],
  generateLink: { data: { properties: { hashed_token: 'HASH123' }, user: { id: 'u1' } }, error: null } as {
    data: { properties?: { hashed_token?: string }; user?: { id: string } } | null;
    error: { message: string } | null;
  },
  sent: [] as Array<{ to: string; html: string; kind: string }>,
  sendOk: true,
  verifyOtp: vi.fn(async () => ({ error: null as { message: string } | null })),
  exchange: vi.fn(async () => ({ error: null as { message: string } | null })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => {
      const b = {
        select: () => b, eq: () => b, gte: () => b,
        limit: async () => ({ data: m.recentLogs, error: null }),
      };
      return b;
    },
    auth: { admin: { generateLink: async () => m.generateLink } },
  }),
}));
vi.mock('@/lib/email/log', () => ({
  sendAndLog: async (input: { to: string; html: string; kind: string }) => {
    m.sent.push(input);
    return m.sendOk ? { ok: true } : { ok: false, error: 'resend down' };
  },
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { verifyOtp: m.verifyOtp, exchangeCodeForSession: m.exchange } }),
}));

import { requestPasswordReset } from '@/app/(auth)/login/actions';
import { GET as callback } from '@/app/(auth)/callback/route';

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://ckimformation.fr');
  m.recentLogs = [];
  m.generateLink = { data: { properties: { hashed_token: 'HASH123' }, user: { id: 'u1' } }, error: null };
  m.sent = [];
  m.sendOk = true;
  m.verifyOtp.mockClear();
  m.exchange.mockClear();
});

describe('requestPasswordReset', () => {
  it('envoie un lien token_hash utilisable sur n’importe quel appareil', async () => {
    await expect(requestPasswordReset('  Alice@Example.com ')).resolves.toEqual({ ok: true });
    expect(m.sent).toHaveLength(1);
    expect(m.sent[0].to).toBe('alice@example.com');
    expect(m.sent[0].kind).toBe('password_reset');
    expect(m.sent[0].html).toContain('https://ckimformation.fr/auth/confirm?token_hash=HASH123&type=recovery');
  });

  it('ne révèle pas qu’un compte n’existe pas', async () => {
    m.generateLink = { data: null, error: { message: 'User not found' } };
    await expect(requestPasswordReset('inconnu@example.com')).resolves.toEqual({ ok: true });
    expect(m.sent).toHaveLength(0);
  });

  it('limite à un email par minute', async () => {
    m.recentLogs = [{ sent_at: new Date().toISOString() }];
    await expect(requestPasswordReset('alice@example.com')).resolves.toEqual({ ok: true });
    expect(m.sent).toHaveLength(0);
  });

  it('signale un échec d’envoi', async () => {
    m.sendOk = false;
    await expect(requestPasswordReset('alice@example.com')).resolves.toMatchObject({ ok: false });
  });

  it('refuse un email invalide', async () => {
    await expect(requestPasswordReset('pas-un-email')).resolves.toMatchObject({ ok: false });
  });
});

describe('/callback (recovery)', () => {
  const call = (qs: string) => callback(new Request(`https://ckimformation.fr/callback?${qs}`) as never);

  it('token_hash recovery → session créée côté serveur puis formulaire', async () => {
    const res = await call('token_hash=HASH123&type=recovery');
    expect(m.verifyOtp).toHaveBeenCalledWith({ token_hash: 'HASH123', type: 'recovery' });
    expect(res.headers.get('location')).toBe('https://ckimformation.fr/setup-password');
  });

  it('lien expiré → retour connexion avec message clair', async () => {
    m.verifyOtp.mockResolvedValueOnce({ error: { message: 'Email link is invalid or has expired' } });
    const res = await call('token_hash=OLD&type=recovery');
    expect(decodeURIComponent(res.headers.get('location') ?? '')).toContain('Ce lien a expiré ou a déjà été utilisé');
  });

  it('ancien lien ?code= → échange du code puis formulaire', async () => {
    const res = await call('code=ABC&redirect=%2Fsetup-password');
    expect(m.exchange).toHaveBeenCalledWith('ABC');
    expect(res.headers.get('location')).toBe('https://ckimformation.fr/setup-password');
  });

  it('invitation avec destination explicite conservée', async () => {
    const res = await call('token_hash=H&type=invite&redirect=%2Fformateur');
    expect(res.headers.get('location')).toBe('https://ckimformation.fr/setup-password?next=%2Fformateur');
  });
});
