import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  profile: null as null | Record<string, unknown>,
  employees: [] as Record<string, unknown>[],
  maybeInvite: vi.fn(async () => 'not_needed' as const),
}));

vi.mock('@/lib/employees/invitations', async () => {
  const real = await vi.importActual<typeof import('@/lib/employees/invitations')>('@/lib/employees/invitations');
  return {
    assertEmailCanBeLinked: real.assertEmailCanBeLinked,
    findProfileByEmail: async () => m.profile,
    maybeInviteExistingAccount: m.maybeInvite,
  };
});
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({}) }));

import { upsertEmployeeForEmployer } from '@/lib/employees/upsert';

/** Faux client : table employees en mémoire. */
function sb() {
  return {
    from() {
      let filters: [string, unknown][] = [];
      let op: 'select' | 'insert' | 'update' = 'select';
      let payload: Record<string, unknown> = {};
      const match = (r: Record<string, unknown>) => filters.every(([c, v]) => r[c] === v);
      const b = {
        select: () => b,
        insert: (p: Record<string, unknown>) => { op = 'insert'; payload = p; return b; },
        update: (p: Record<string, unknown>) => { op = 'update'; payload = p; return b; },
        eq: (c: string, v: unknown) => { filters = [...filters, [c, v]]; return b; },
        maybeSingle: async () => ({ data: m.employees.find(match) ?? null, error: null }),
        single: async () => {
          const row = { id: `e${m.employees.length + 1}`, profile_id: null, ...payload };
          m.employees.push(row);
          return { data: row, error: null };
        },
        then: (resolve: (v: unknown) => void) => {
          if (op === 'update') m.employees.filter(match).forEach((r) => Object.assign(r, payload));
          resolve({ data: null, error: null });
        },
      };
      return b;
    },
  } as never;
}

const COMPANY = { id: 'c1', role: 'stagiaire', account_type: 'entreprise', email: 'gerante@acme.fr', employer_profile_id: null, full_name: 'Jeanne' };

beforeEach(() => {
  vi.clearAllMocks();
  m.employees = [];
  m.profile = null;
});

describe('upsertEmployeeForEmployer — l’entreprise s’ajoute elle-même', () => {
  it('crée la fiche salarié liée directement au compte de l’entreprise, sans invitation', async () => {
    m.profile = COMPANY;
    const res = await upsertEmployeeForEmployer(sb(), 'c1', { prenom: 'Jeanne', nom: 'Martin', email: 'Gerante@acme.fr' }, 'c1');
    expect(res).toMatchObject({ ok: true, created: true, invitation: 'not_needed', self: true });
    expect(m.employees[0]).toMatchObject({ employer_profile_id: 'c1', profile_id: 'c1', email: 'gerante@acme.fr' });
    expect(m.maybeInvite).not.toHaveBeenCalled();
  });

  it('lie une fiche existante (même email, sans compte) au compte de l’entreprise', async () => {
    m.profile = COMPANY;
    m.employees = [{ id: 'e9', employer_profile_id: 'c1', email: 'gerante@acme.fr', profile_id: null }];
    const res = await upsertEmployeeForEmployer(sb(), 'c1', { prenom: 'Jeanne', nom: 'Martin', email: 'gerante@acme.fr' }, 'admin');
    expect(res).toMatchObject({ ok: true, id: 'e9', created: false, self: true });
    expect(m.employees[0].profile_id).toBe('c1');
  });

  it('refuse toujours l’email d’une AUTRE entreprise', async () => {
    m.profile = { ...COMPANY, id: 'c2' };
    const res = await upsertEmployeeForEmployer(sb(), 'c1', { prenom: 'X', nom: 'Y', email: 'gerante@acme.fr' }, 'c1');
    expect(res.ok).toBe(false);
  });
});
