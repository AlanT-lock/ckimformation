import { describe, it, expect, vi, beforeEach } from 'vitest';

type Res = { data: unknown; error: { message: string } | null };

const m = vi.hoisted(() => ({
  profile: { id: 'f1', role: 'formateur' } as { id: string; role: string } | null,
  sessionRow: { formateur_id: 'f1' } as { formateur_id: string } | null,
  updateResult: { data: [{ id: 's1' }], error: null } as Res,
  updates: [] as Array<{ patch: unknown; filters: Array<[string, unknown]> }>,
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  getCurrentProfile: async () => m.profile,
  createClient: async () => ({
    from: () => {
      const b = { select: () => b, eq: () => b, single: async () => ({ data: m.sessionRow, error: null }) };
      return b;
    },
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => {
      const entry = { patch: null as unknown, filters: [] as Array<[string, unknown]> };
      const b = {
        update: (patch: unknown) => { entry.patch = patch; m.updates.push(entry); return b; },
        eq: (col: string, val: unknown) => { entry.filters.push([col, val]); return b; },
        select: async () => m.updateResult,
      };
      return b;
    },
  }),
}));

import { terminateSession } from '@/app/(app)/formateur/sessions/[id]/actions';

beforeEach(() => {
  m.profile = { id: 'f1', role: 'formateur' };
  m.sessionRow = { formateur_id: 'f1' };
  m.updateResult = { data: [{ id: 's1' }], error: null };
  m.updates = [];
});

describe('terminateSession', () => {
  it('le formateur de la session la passe en « completed » (uniquement depuis published)', async () => {
    await expect(terminateSession('s1')).resolves.toBeUndefined();
    expect(m.updates).toHaveLength(1);
    expect(m.updates[0].patch).toMatchObject({ statut: 'completed' });
    expect(m.updates[0].filters).toEqual([['id', 's1'], ['statut', 'published']]);
  });

  it('un admin peut aussi terminer la session', async () => {
    m.profile = { id: 'a1', role: 'admin' };
    m.sessionRow = { formateur_id: 'f1' };
    await expect(terminateSession('s1')).resolves.toBeUndefined();
  });

  it('refuse un autre formateur, sans rien écrire', async () => {
    m.sessionRow = { formateur_id: 'autre' };
    await expect(terminateSession('s1')).rejects.toThrow('Accès refusé');
    expect(m.updates).toHaveLength(0);
  });

  it('refuse un stagiaire, sans rien écrire', async () => {
    m.profile = { id: 'st1', role: 'stagiaire' };
    await expect(terminateSession('s1')).rejects.toThrow('Accès refusé');
    expect(m.updates).toHaveLength(0);
  });

  it('signale une erreur si aucune ligne n’est modifiée (session déjà terminée ou annulée)', async () => {
    m.updateResult = { data: [], error: null };
    await expect(terminateSession('s1')).rejects.toThrow(/n'a pas pu être terminée/);
  });
});
