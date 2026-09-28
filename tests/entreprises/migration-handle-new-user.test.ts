import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const sql = readFileSync(
  path.resolve(__dirname, '../../supabase/migrations/20260928_entreprises_admin.sql'),
  'utf8',
);

describe('migration 20260928 handle_new_user', () => {
  it('redéfinit le trigger', () => {
    expect(sql).toMatch(/create or replace function public\.handle_new_user\(\)/);
  });
  it('insère secteur_activite dans profiles', () => {
    expect(sql).toMatch(/insert into public\.profiles \([^)]*secteur_activite[^)]*\)/);
  });
  it('ne garde le secteur que s’il existe (évite la violation de FK)', () => {
    expect(sql).toMatch(/select code into v_secteur\s+from public\.secteurs_activite/);
  });
  it('conserve la liaison employees.profile_id via employee_id', () => {
    expect(sql).toMatch(/update public\.employees\s+set profile_id = new\.id/);
  });
  it('conserve la création de company_details', () => {
    expect(sql).toMatch(/insert into public\.company_details/);
  });
});
