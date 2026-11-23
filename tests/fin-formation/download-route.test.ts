// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Droits de téléchargement d'un document de fin de formation : admin,
// payeur de l'inscription (entreprise ou particulier), stagiaire concerné.

const m = vi.hoisted(() => ({
  user: { id: 'u1' } as { id: string } | null,
  role: 'stagiaire',
  doc: null as unknown,
  signed: [] as Array<[string, string]>,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: m.user } }) },
    from: () => {
      const b = { select: () => b, eq: () => b, single: async () => ({ data: { role: m.role }, error: null }) };
      return b;
    },
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => {
      const b = { select: () => b, eq: () => b, single: async () => ({ data: m.doc, error: null }) };
      return b;
    },
  }),
}));
vi.mock('@/lib/storage/documents', () => ({
  BUCKET_ADMIN: 'inscription-docs-admin',
  BUCKET_PAYER: 'inscription-docs-payer',
  BUCKET_FIN_FORMATION: 'fin-formation-docs',
  getSignedUrl: async (bucket: string, path: string) => {
    m.signed.push([bucket, path]);
    return 'https://storage.test/signed';
  },
}));

import { GET } from '@/app/api/documents/download/[kind]/[id]/route';

function call() {
  return GET(new Request('http://localhost/api/documents/download/fin-formation/d1') as never, {
    params: Promise.resolve({ kind: 'fin-formation', id: 'd1' }),
  });
}

const doc = (over: { participantProfile?: string | null; employeeProfile?: string | null; payer?: string }) => ({
  storage_path: 's1/p1/CR-2026-0001.pdf',
  participant: {
    participant_profile_id: over.participantProfile ?? null,
    employee: over.employeeProfile === undefined ? null : { profile_id: over.employeeProfile },
    inscription: { payer_profile_id: over.payer ?? 'payeur' },
  },
});

beforeEach(() => {
  m.user = { id: 'u1' };
  m.role = 'stagiaire';
  m.doc = doc({});
  m.signed = [];
});

describe('téléchargement d’un document de fin de formation', () => {
  it('refuse un visiteur non connecté', async () => {
    m.user = null;
    expect((await call()).status).toBe(401);
    expect(m.signed).toHaveLength(0);
  });

  it('404 si le document n’existe pas', async () => {
    m.doc = null;
    expect((await call()).status).toBe(404);
  });

  it('refuse un utilisateur étranger à l’inscription', async () => {
    m.doc = doc({ participantProfile: 'autre', employeeProfile: 'autre2', payer: 'autre3' });
    expect((await call()).status).toBe(403);
    expect(m.signed).toHaveLength(0);
  });

  it('refuse un formateur qui n’est ni payeur ni stagiaire', async () => {
    m.role = 'formateur';
    expect((await call()).status).toBe(403);
  });

  it('autorise l’admin', async () => {
    m.role = 'admin';
    const res = await call();
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://storage.test/signed');
    expect(m.signed).toEqual([['fin-formation-docs', 's1/p1/CR-2026-0001.pdf']]);
  });

  it('autorise l’entreprise (ou le particulier) qui a inscrit le stagiaire', async () => {
    m.doc = doc({ payer: 'u1' });
    expect((await call()).status).toBe(307);
  });

  it('autorise le stagiaire inscrit avec son propre compte', async () => {
    m.doc = doc({ participantProfile: 'u1' });
    expect((await call()).status).toBe(307);
  });

  it('autorise le salarié dont le compte est lié à sa fiche', async () => {
    m.doc = doc({ employeeProfile: 'u1' });
    expect((await call()).status).toBe(307);
  });
});
