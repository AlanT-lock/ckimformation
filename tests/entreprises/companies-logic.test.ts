import { describe, it, expect } from 'vitest';
import { canConvertToCompany } from '@/lib/companies/conversion';
import { isSessionEligibleForCompany, partitionEmployeesByOccupancy } from '@/lib/companies/enrollment';
import { employeeAccountStatus, stagiaireKind } from '@/lib/companies/status';
import { buildCompanySessionRows, firstAndLastDate } from '@/lib/companies/sessions';
import { companyMatchesQuery } from '@/lib/companies/search';

describe('canConvertToCompany', () => {
  const base = { role: 'stagiaire', account_type: 'particulier', employer_profile_id: null };
  it('autorise un particulier indépendant', () => {
    expect(canConvertToCompany(base, 0)).toEqual({ ok: true });
  });
  it('autorise un stagiaire sans type', () => {
    expect(canConvertToCompany({ ...base, account_type: null }, 0).ok).toBe(true);
  });
  it('refuse un compte déjà entreprise', () => {
    expect(canConvertToCompany({ ...base, account_type: 'entreprise' }, 0).ok).toBe(false);
  });
  it('refuse un salarié rattaché (employer_profile_id)', () => {
    expect(canConvertToCompany({ ...base, employer_profile_id: 'c1' }, 0).ok).toBe(false);
  });
  it('refuse un profil lié à une fiche salarié', () => {
    expect(canConvertToCompany(base, 1).ok).toBe(false);
  });
  it('refuse formateur et admin', () => {
    expect(canConvertToCompany({ ...base, role: 'formateur' }, 0).ok).toBe(false);
    expect(canConvertToCompany({ ...base, role: 'admin' }, 0).ok).toBe(false);
  });
});

describe('isSessionEligibleForCompany', () => {
  const today = '2026-09-28';
  const s = { id: 's', statut: 'published', visibility: 'public' as const, reserved_company_id: null, firstDate: '2026-10-05' };
  it('session publique à venir', () => expect(isSessionEligibleForCompany(s, 'c1', today)).toBe(true));
  it('session du jour', () => expect(isSessionEligibleForCompany({ ...s, firstDate: today }, 'c1', today)).toBe(true));
  it('réservée à cette entreprise', () =>
    expect(isSessionEligibleForCompany({ ...s, visibility: 'reserved', reserved_company_id: 'c1' }, 'c1', today)).toBe(true));
  it('réservée à une autre entreprise', () =>
    expect(isSessionEligibleForCompany({ ...s, visibility: 'reserved', reserved_company_id: 'c2' }, 'c1', today)).toBe(false));
  it('passée', () => expect(isSessionEligibleForCompany({ ...s, firstDate: '2026-09-01' }, 'c1', today)).toBe(false));
  it('non publiée', () => expect(isSessionEligibleForCompany({ ...s, statut: 'draft' }, 'c1', today)).toBe(false));
  it('sans créneau', () => expect(isSessionEligibleForCompany({ ...s, firstDate: null }, 'c1', today)).toBe(false));
});

describe('partitionEmployeesByOccupancy', () => {
  const employees = [
    { id: 'e1', profile_id: null },
    { id: 'e2', profile_id: 'p2' },
    { id: 'e3', profile_id: null },
  ];
  it('exclut les salariés déjà inscrits par fiche ou par profil lié', () => {
    const occupants = [
      { profileId: null, profileEmail: null, employeeProfileId: null, employeeEmail: 'a@x', employeeId: 'e1' },
      { profileId: 'p2', profileEmail: null, employeeProfileId: null, employeeEmail: null, employeeId: null },
    ];
    expect(partitionEmployeesByOccupancy(employees, occupants)).toEqual({ enrollable: ['e3'], alreadyEnrolled: ['e1', 'e2'] });
  });
  it('tout le monde est inscriptible sur une session vide', () => {
    expect(partitionEmployeesByOccupancy(employees, []).enrollable).toEqual(['e1', 'e2', 'e3']);
  });
});

describe('employeeAccountStatus', () => {
  it('actif', () => expect(employeeAccountStatus({ profileId: 'p', signedIn: true, pendingLink: false })).toBe('actif'));
  it('invité', () => expect(employeeAccountStatus({ profileId: 'p', signedIn: false, pendingLink: false })).toBe('invite'));
  it('rattachement en attente', () => expect(employeeAccountStatus({ profileId: null, signedIn: false, pendingLink: true })).toBe('rattachement'));
  it('sans accès', () => expect(employeeAccountStatus({ profileId: null, signedIn: false, pendingLink: false })).toBe('sans_acces'));
});

describe('sessions entreprise', () => {
  it('firstAndLastDate trie par ordre', () => {
    expect(firstAndLastDate([{ date: '2026-10-02', ordre: 2 }, { date: '2026-10-01', ordre: 1 }]))
      .toEqual({ firstDate: '2026-10-01', lastDate: '2026-10-02' });
    expect(firstAndLastDate(null)).toEqual({ firstDate: null, lastDate: null });
  });
  it('buildCompanySessionRows trie par date décroissante, sans date en dernier', () => {
    const rows = buildCompanySessionRows(
      [
        { id: 'a', statut: 'published', visibility: 'public', reserved_company_id: null, formation: { titre: 'A' }, creneaux: [{ date: '2026-01-01', ordre: 1 }] },
        { id: 'b', statut: 'draft', visibility: 'reserved', reserved_company_id: 'c1', formation: [{ titre: 'B' }], creneaux: [] },
        { id: 'c', statut: 'published', visibility: 'public', reserved_company_id: null, formation: null, creneaux: [{ date: '2026-06-01', ordre: 1 }] },
      ],
      new Map([['a', ['Léa Roy']]]),
    );
    expect(rows.map((r) => r.id)).toEqual(['c', 'a', 'b']);
    expect(rows[1].participants).toEqual(['Léa Roy']);
    expect(rows[2]).toMatchObject({ formationTitre: 'B', reserved: true, participants: [] });
    expect(rows[0].formationTitre).toBe('—');
  });
});

describe('companyMatchesQuery', () => {
  const row = { raison_sociale: 'Société Générale BTP', siret: '123 456', contact: 'Jeanne Martin', email: 'rh@sg.fr' };
  it('insensible aux accents et à l’ordre', () => {
    expect(companyMatchesQuery(row, 'societe btp')).toBe(true);
    expect(companyMatchesQuery(row, 'martin jeanne')).toBe(true);
  });
  it('par email et siret', () => {
    expect(companyMatchesQuery(row, 'rh@sg')).toBe(true);
    expect(companyMatchesQuery(row, '123')).toBe(true);
  });
  it('requête vide = tout', () => expect(companyMatchesQuery(row, '  ')).toBe(true));
  it('pas de correspondance', () => expect(companyMatchesQuery(row, 'carrefour')).toBe(false));
});

describe('stagiaireKind (badge de la liste Stagiaires)', () => {
  it('fiche salarié sans compte → salarié', () =>
    expect(stagiaireKind({ rowKind: 'employee', accountType: 'entreprise', hasEmployer: false })).toBe('salarie'));
  it('profil rattaché à un employeur → salarié', () =>
    expect(stagiaireKind({ rowKind: 'profile', accountType: 'particulier', hasEmployer: true })).toBe('salarie'));
  it('compte entreprise → entreprise', () =>
    expect(stagiaireKind({ rowKind: 'profile', accountType: 'entreprise', hasEmployer: false })).toBe('entreprise'));
  it('particulier indépendant → particulier', () =>
    expect(stagiaireKind({ rowKind: 'profile', accountType: 'particulier', hasEmployer: false })).toBe('particulier'));
  it('sans type → null', () =>
    expect(stagiaireKind({ rowKind: 'profile', accountType: null, hasEmployer: false })).toBeNull());
});
