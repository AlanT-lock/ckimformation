import { describe, it, expect, vi, beforeEach } from 'vitest';

type Res = { data: unknown; error: { message: string } | null };

// Réponses programmées par table + opération, dans l'ordre des appels.
const m = vi.hoisted(() => ({
  results: {} as Record<string, Res[]>,
  calls: [] as string[],
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => {
  const client = {
    from(table: string) {
      let op = 'select';
      const next = (): Res => {
        const key = `${table}.${op}`;
        m.calls.push(key);
        return m.results[key]?.shift() ?? { data: null, error: null };
      };
      const b = {
        select: () => b,
        insert: () => { op = 'insert'; return b; },
        update: () => { op = 'update'; return b; },
        upsert: () => { op = 'upsert'; return b; },
        eq: () => b,
        single: async () => next(),
        maybeSingle: async () => next(),
        then: (resolve: (v: Res) => void) => resolve(next()),
      };
      return b;
    },
  };
  return {
    createClient: async () => client,
    getCurrentProfile: async () => ({ id: 'f1', role: 'formateur' }),
  };
});

import { submitFormateurEvaluation } from '@/app/(app)/formateur/sessions/[id]/evaluations/actions';

function program(extra: Record<string, Res[]> = {}) {
  m.calls = [];
  m.results = {
    'sessions.select': [{ data: { id: 's1', formateur_id: 'f1' }, error: null }],
    'tests.select': [{ data: { id: 't1', kind: 'evaluation_formateur' }, error: null }],
    'inscription_participants.select': [{ data: { id: 'ip1', inscription_id: 'i1', inscription: { session_id: 's1' } }, error: null }],
    'test_completions.select': [{ data: null, error: null }],
    'test_completions.insert': [{ data: { id: 'c1' }, error: null }],
    'responses.upsert': [{ data: null, error: null }],
    'test_completions.update': [{ data: null, error: null }],
    ...extra,
  };
}

beforeEach(() => program());

describe('submitFormateurEvaluation', () => {
  it('renvoie { ok: true } quand tout est enregistré', async () => {
    await expect(submitFormateurEvaluation('s1', 't1', 'ip1', [{ question_id: 'q1', valeur: 'ok' }]))
      .resolves.toEqual({ ok: true });
  });

  it('renvoie l’erreur (sans lever) si la création de la complétion échoue — ex. colonne manquante en prod', async () => {
    program({ 'test_completions.insert': [{ data: null, error: { message: 'column "filled_by_formateur_id" does not exist' } }] });
    const res = await submitFormateurEvaluation('s1', 't1', 'ip1', [{ question_id: 'q1', valeur: 'ok' }]);
    expect(res).toMatchObject({ ok: false });
  });

  it('signale l’échec du marquage « complété » au lieu de l’ignorer', async () => {
    program({ 'test_completions.update': [{ data: null, error: { message: 'rls' } }] });
    const res = await submitFormateurEvaluation('s1', 't1', 'ip1', [{ question_id: 'q1', valeur: 'ok' }]);
    expect(res).toMatchObject({ ok: false });
  });

  it('refuse un formateur qui n’est pas celui de la session', async () => {
    program({ 'sessions.select': [{ data: { id: 's1', formateur_id: 'autre' }, error: null }] });
    const res = await submitFormateurEvaluation('s1', 't1', 'ip1', []);
    expect(res).toMatchObject({ ok: false });
  });
});
