import { describe, it, expect } from 'vitest';
import {
  escapeIlikeExact,
  evaluateEmployeeLink,
  generateEmployeeInvitationToken,
  isEmployeeInvitationUsable,
  normalizeEmployeeEmail,
} from '@/lib/employees/linkability';

describe('normalizeEmployeeEmail', () => {
  it('trim et met en minuscules', () => {
    expect(normalizeEmployeeEmail('  Jean.Dupont@ACME.fr ')).toBe('jean.dupont@acme.fr');
  });
});

describe('escapeIlikeExact', () => {
  it('échappe les jokers ILIKE', () => {
    expect(escapeIlikeExact('a_b%c\\d')).toBe('a\\_b\\%c\\\\d');
  });
});

describe('evaluateEmployeeLink', () => {
  const employerId = 'employer-1';

  it('autorise un stagiaire particulier', () => {
    expect(
      evaluateEmployeeLink(
        { id: 'p1', role: 'stagiaire', account_type: 'particulier' },
        employerId,
      ),
    ).toEqual({ ok: true });
  });

  it('autorise un stagiaire sans account_type', () => {
    expect(
      evaluateEmployeeLink({ id: 'p1', role: 'stagiaire', account_type: null }, employerId),
    ).toEqual({ ok: true });
  });

  it('refuse un compte entreprise', () => {
    const r = evaluateEmployeeLink(
      { id: 'p1', role: 'stagiaire', account_type: 'entreprise' },
      employerId,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('is_entreprise');
  });

  it('refuse admin et formateur', () => {
    expect(evaluateEmployeeLink({ id: 'a', role: 'admin', account_type: null }, employerId).ok).toBe(false);
    expect(evaluateEmployeeLink({ id: 'f', role: 'formateur', account_type: null }, employerId).ok).toBe(false);
  });

  it('refuse que l’employeur s’ajoute lui-même', () => {
    const r = evaluateEmployeeLink(
      { id: employerId, role: 'stagiaire', account_type: 'particulier' },
      employerId,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('is_self');
  });
});

describe('isEmployeeInvitationUsable', () => {
  it('refuse si déjà claim', () => {
    expect(
      isEmployeeInvitationUsable({
        claimed_by: 'p1',
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      }),
    ).toBe(false);
  });

  it('refuse si expirée', () => {
    expect(
      isEmployeeInvitationUsable({
        claimed_by: null,
        expires_at: new Date(Date.now() - 1000).toISOString(),
      }),
    ).toBe(false);
  });

  it('accepte une invitation valide', () => {
    expect(
      isEmployeeInvitationUsable({
        claimed_by: null,
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      }),
    ).toBe(true);
  });
});

describe('generateEmployeeInvitationToken', () => {
  it('produit une chaîne ≥ 32 caractères, unique', () => {
    const a = generateEmployeeInvitationToken();
    const b = generateEmployeeInvitationToken();
    expect(a.length).toBeGreaterThanOrEqual(32);
    expect(b.length).toBeGreaterThanOrEqual(32);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]*$/);
  });
});
