import { describe, it, expect } from 'vitest';
import { loadSessionOccupants } from '@/lib/sessions/search-stagiaires-query';

type Row = Record<string, unknown>;

/** Faux client Supabase : filtre eq/neq/in en mémoire, erreur injectable par table. */
function fakeAdmin(tables: Record<string, Row[]>, failing: string[] = []) {
  return {
    from(table: string) {
      let rows = tables[table] ?? [];
      const builder = {
        select: () => builder,
        eq: (col: string, v: unknown) => { rows = rows.filter((r) => r[col] === v); return builder; },
        neq: (col: string, v: unknown) => { rows = rows.filter((r) => r[col] !== v); return builder; },
        in: (col: string, vs: unknown[]) => { rows = rows.filter((r) => vs.includes(r[col])); return builder; },
        then: (resolve: (v: { data: Row[] | null; error: { message: string } | null }) => void) =>
          resolve(failing.includes(table) ? { data: null, error: { message: 'boom' } } : { data: rows, error: null }),
      };
      return builder;
    },
  } as never;
}

const TABLES = {
  inscriptions: [
    { id: 'i1', session_id: 's1', statut: 'confirmee' },
    { id: 'i2', session_id: 's1', statut: 'refusee' },
  ],
  inscription_participants: [
    { inscription_id: 'i1', participant_profile_id: null, employee_id: 'e1' },
    { inscription_id: 'i2', participant_profile_id: null, employee_id: 'e2' },
  ],
  employees: [
    { id: 'e1', profile_id: null, email: 'a@x' },
    { id: 'e2', profile_id: null, email: 'b@x' },
  ],
};

describe('loadSessionOccupants', () => {
  it('ignore les inscriptions refusées', async () => {
    const occ = await loadSessionOccupants(fakeAdmin(TABLES), 's1');
    expect(occ.map((o) => o.employeeId)).toEqual(['e1']);
  });

  it('mode strict : lève une erreur si la lecture échoue (pas de faux « vide »)', async () => {
    await expect(loadSessionOccupants(fakeAdmin(TABLES, ['inscription_participants']), 's1', { strict: true }))
      .rejects.toThrow();
  });

  it('mode par défaut : reste tolérant (liste vide) pour la recherche', async () => {
    expect(await loadSessionOccupants(fakeAdmin(TABLES, ['inscriptions']), 's1')).toEqual([]);
  });
});
