import { describe, it, expect, vi, beforeEach } from 'vitest';

type Row = Record<string, unknown>;

// Faux client Supabase en mémoire : enregistre les écritures et reproduit
// la contrainte NOT NULL de test_completions.inscription_id (erreur 23502 en prod).
const db = vi.hoisted(() => ({
  tables: {} as Record<string, Record<string, unknown>[]>,
  failResponses: false,
  seq: 0,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from(table: string) {
      let filters: [string, unknown][] = [];
      let op: 'select' | 'insert' | 'update' | 'delete' = 'select';
      let payload: Row | Row[] | null = null;
      const match = (r: Row) => filters.every(([c, v]) => r[c] === v);
      const run = (): { data: unknown; error: { code?: string; message: string } | null } => {
        const rows = (db.tables[table] ??= []);
        if (op === 'insert') {
          const list = Array.isArray(payload) ? payload : [payload!];
          if (table === 'test_completions' && list.some((r) => !r.inscription_id)) {
            return { data: null, error: { code: '23502', message: 'null value in column "inscription_id"' } };
          }
          if (table === 'responses' && db.failResponses) {
            return { data: null, error: { message: 'responses insert failed' } };
          }
          const inserted = list.map((r) => ({ id: `id-${++db.seq}`, ...r }));
          rows.push(...inserted);
          return { data: inserted, error: null };
        }
        if (op === 'update') {
          rows.filter(match).forEach((r) => Object.assign(r, payload));
          return { data: null, error: null };
        }
        if (op === 'delete') {
          db.tables[table] = rows.filter((r) => !match(r));
          return { data: null, error: null };
        }
        return { data: rows.filter(match), error: null };
      };
      const b = {
        select: () => b,
        insert: (p: Row | Row[]) => { op = 'insert'; payload = p; return b; },
        update: (p: Row) => { op = 'update'; payload = p; return b; },
        delete: () => { op = 'delete'; return b; },
        eq: (c: string, v: unknown) => { filters = [...filters, [c, v]]; return b; },
        single: async () => {
          const r = run();
          const list = r.data as Row[] | null;
          return r.error ? r : { data: list?.[0] ?? null, error: list?.[0] ? null : { message: 'not found' } };
        },
        maybeSingle: async () => {
          const r = run();
          return r.error ? r : { data: (r.data as Row[] | null)?.[0] ?? null, error: null };
        },
        then: (resolve: (v: unknown) => void) => resolve(run()),
      };
      return b;
    },
  }),
}));

import { submitEnqueteFroid } from '@/app/enquete/[token]/actions';

beforeEach(() => {
  db.seq = 0;
  db.failResponses = false;
  db.tables = {
    enquete_froid_envois: [{ id: 'env1', token: 'tok', test_id: 't1', inscription_participant_id: 'ip1', responded_at: null }],
    inscription_participants: [{ id: 'ip1', inscription_id: 'ins1' }],
    test_completions: [],
    responses: [],
  };
});

describe('submitEnqueteFroid', () => {
  it('enregistre la complétion (avec inscription_id), les réponses, et marque l’envoi répondu', async () => {
    const res = await submitEnqueteFroid('tok', [{ question_id: 'q1', valeur: '5' }]);
    expect(res).toEqual({ ok: true });
    expect(db.tables.test_completions).toHaveLength(1);
    expect(db.tables.test_completions[0]).toMatchObject({ inscription_id: 'ins1', inscription_participant_id: 'ip1', test_id: 't1' });
    expect(db.tables.responses).toHaveLength(1);
    expect(db.tables.enquete_froid_envois[0].responded_at).not.toBeNull();
  });

  it('si les réponses échouent : supprime la complétion pour permettre de renvoyer', async () => {
    db.failResponses = true;
    const res = await submitEnqueteFroid('tok', [{ question_id: 'q1', valeur: '5' }]);
    expect(res.ok).toBe(false);
    expect(db.tables.test_completions).toHaveLength(0);
    expect(db.tables.enquete_froid_envois[0].responded_at).toBeNull();

    db.failResponses = false;
    expect(await submitEnqueteFroid('tok', [{ question_id: 'q1', valeur: '5' }])).toEqual({ ok: true });
  });

  it('refuse un second envoi', async () => {
    await submitEnqueteFroid('tok', [{ question_id: 'q1', valeur: '5' }]);
    const res = await submitEnqueteFroid('tok', [{ question_id: 'q1', valeur: '4' }]);
    expect(res).toEqual({ ok: false, error: 'Vous avez déjà répondu à cette enquête.' });
  });
});
