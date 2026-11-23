import { describe, it, expect, vi, beforeEach } from 'vitest';

type Res = { data: unknown; error: { message: string } | null };

// Réponses programmées par table + opération, dans l'ordre des appels.
const m = vi.hoisted(() => ({
  results: {} as Record<string, Res[]>,
  calls: [] as string[],
  adminUpserts: [] as Array<{ table: string; rows: unknown; options: unknown }>,
  adminError: null as { message: string } | null,
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
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      upsert: async (rows: unknown, options: unknown) => {
        m.adminUpserts.push({ table, rows, options });
        return { data: null, error: m.adminError };
      },
    }),
  }),
}));

import { submitBilanStagiaire } from '@/app/(app)/formateur/sessions/[id]/evaluations/actions';

const session = { data: { id: 's1', formateur_id: 'f1', formation_id: 'fo1' }, error: null };
const participant = { data: { id: 'ip1', inscription_id: 'i1', inscription: { session_id: 's1' } }, error: null };

function program(extra: Record<string, Res[]> = {}) {
  m.calls = [];
  m.adminUpserts = [];
  m.adminError = null;
  m.results = {
    // 1er appel : contrôle du bilan ; 2e : enregistrement du questionnaire t1
    'sessions.select': [session, session],
    'inscription_participants.select': [participant, participant],
    'formation_competences.select': [{ data: [{ id: 'c1' }, { id: 'c2' }], error: null }],
    // 1er appel : questionnaires de la formation ; 2e : vérification du type de t1
    'tests.select': [
      { data: [{ id: 't1' }], error: null },
      { data: { id: 't1', kind: 'evaluation_formateur' }, error: null },
    ],
    'test_completions.select': [{ data: null, error: null }],
    'test_completions.insert': [{ data: { id: 'comp1' }, error: null }],
    'responses.upsert': [{ data: null, error: null }],
    'test_completions.update': [{ data: null, error: null }],
    ...extra,
  };
}

const input = {
  evaluations: [{ testId: 't1', responses: [{ question_id: 'q1', valeur: 'ok' }] }],
  competences: [
    { competenceId: 'c1', niveau: 'acquise' },
    { competenceId: 'c2', niveau: 'en_cours' },
  ],
};

beforeEach(() => program());

describe('submitBilanStagiaire', () => {
  it('enregistre le questionnaire puis le niveau de chaque compétence', async () => {
    await expect(submitBilanStagiaire('s1', 'ip1', input)).resolves.toEqual({ ok: true });
    expect(m.calls).toContain('responses.upsert');
    expect(m.adminUpserts).toHaveLength(1);
    expect(m.adminUpserts[0].table).toBe('inscription_participant_competences');
    expect(m.adminUpserts[0].options).toEqual({ onConflict: 'inscription_participant_id,competence_id' });
    expect(m.adminUpserts[0].rows).toMatchObject([
      { inscription_participant_id: 'ip1', competence_id: 'c1', niveau: 'acquise', evalue_by: 'f1' },
      { inscription_participant_id: 'ip1', competence_id: 'c2', niveau: 'en_cours', evalue_by: 'f1' },
    ]);
  });

  it('refuse le bilan si une compétence n’a pas de niveau, sans rien enregistrer', async () => {
    const res = await submitBilanStagiaire('s1', 'ip1', { ...input, competences: [input.competences[0]] });
    expect(res).toMatchObject({ ok: false });
    expect(m.calls).not.toContain('responses.upsert');
    expect(m.adminUpserts).toHaveLength(0);
  });

  it('refuse un niveau inconnu', async () => {
    const res = await submitBilanStagiaire('s1', 'ip1', {
      ...input,
      competences: [input.competences[0], { competenceId: 'c2', niveau: 'presque' }],
    });
    expect(res).toMatchObject({ ok: false });
    expect(m.adminUpserts).toHaveLength(0);
  });

  it('refuse si un questionnaire de la formation manque dans l’envoi', async () => {
    const res = await submitBilanStagiaire('s1', 'ip1', { ...input, evaluations: [] });
    expect(res).toMatchObject({ ok: false });
    expect(m.adminUpserts).toHaveLength(0);
  });

  it('refuse un stagiaire d’une autre session', async () => {
    program({
      'inscription_participants.select': [{ data: { id: 'ip1', inscription: { session_id: 'autre' } }, error: null }],
    });
    const res = await submitBilanStagiaire('s1', 'ip1', input);
    expect(res).toMatchObject({ ok: false });
    expect(m.adminUpserts).toHaveLength(0);
  });

  it('refuse un formateur qui n’est pas celui de la session', async () => {
    program({ 'sessions.select': [{ data: { id: 's1', formateur_id: 'autre', formation_id: 'fo1' }, error: null }] });
    const res = await submitBilanStagiaire('s1', 'ip1', input);
    expect(res).toMatchObject({ ok: false });
    expect(m.adminUpserts).toHaveLength(0);
  });

  it('signale l’échec de l’enregistrement des compétences', async () => {
    m.adminError = { message: 'relation "inscription_participant_competences" does not exist' };
    const res = await submitBilanStagiaire('s1', 'ip1', input);
    expect(res).toMatchObject({ ok: false });
  });

  it('fonctionne pour une formation sans questionnaire (compétences seules)', async () => {
    program({ 'tests.select': [{ data: [], error: null }] });
    await expect(submitBilanStagiaire('s1', 'ip1', { ...input, evaluations: [] })).resolves.toEqual({ ok: true });
    expect(m.calls).not.toContain('responses.upsert');
    expect(m.adminUpserts).toHaveLength(1);
  });
});
