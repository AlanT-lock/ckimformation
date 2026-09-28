import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const sql = readFileSync(
  path.resolve(__dirname, '../../supabase/migrations/20260929_evaluation_formateur_repair.sql'),
  'utf8',
);
// On ignore les commentaires pour ne tester que le SQL exécuté.
const code = sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');

describe('migration de réparation évaluation formateur', () => {
  it('ne réajoute PAS la valeur d’enum (elle casse la transaction si utilisée dans le même script)', () => {
    expect(code).not.toMatch(/alter type test_kind add value/i);
  });
  it('crée la colonne filled_by_formateur_id', () => {
    expect(code).toMatch(/add column if not exists filled_by_formateur_id uuid/);
  });
  it('recrée les policies formateur sur test_completions (insert + update)', () => {
    expect(code).toMatch(/create policy "completions insert formateur eval" on public\.test_completions/);
    expect(code).toMatch(/create policy "completions update formateur eval" on public\.test_completions/);
  });
  it('recrée les policies formateur sur responses (insert, update, delete)', () => {
    expect(code).toMatch(/create policy "responses insert self" on public\.responses/);
    expect(code).toMatch(/create policy "responses update self" on public\.responses/);
    expect(code).toMatch(/create policy "responses delete self" on public\.responses/);
  });
});
