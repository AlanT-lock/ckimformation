import { describe, expect, it } from 'vitest';
import {
  filterStagiaireSearchHits,
  profileMatchesQuery,
} from '@/lib/sessions/stagiaire-search';

const jeanCompte = {
  id: 'profile-jean',
  full_name: 'Jean Dupont',
  email: 'jean@example.com',
  account_type: 'particulier' as const,
};

const jeanEntreprise = {
  id: 'profile-acme',
  full_name: 'Jean Dupont',
  email: 'contact@acme.fr',
  account_type: 'entreprise' as const,
};

describe('profileMatchesQuery', () => {
  it('trouve un nom avec ou sans accent', () => {
    expect(profileMatchesQuery('Léa Martin', 'lea@x.fr', 'lea')).toBe(true);
    expect(profileMatchesQuery('Lea Martin', 'lea@x.fr', 'léa')).toBe(true);
  });

  it('accepte prénom et nom dans n’importe quel ordre', () => {
    expect(profileMatchesQuery('Marie Dupont', 'm@x.fr', 'dupont marie')).toBe(true);
  });

  it('matche sur l’email', () => {
    expect(profileMatchesQuery('Marie', 'marie.dupont@acme.fr', 'dupont')).toBe(true);
    expect(profileMatchesQuery('Marie', 'marie.dupont@acme.fr', 'marie.dupont@acme.fr')).toBe(true);
  });

  it('refuse un nom qui ne correspond pas', () => {
    expect(profileMatchesQuery('Jean Dupont', 'jean@x.fr', 'martin')).toBe(false);
  });
});

describe('filterStagiaireSearchHits', () => {
  it('exclut un profil déjà inscrit via participant_profile_id', () => {
    expect(
      filterStagiaireSearchHits([jeanCompte], [
        { profileId: 'profile-jean', profileEmail: 'jean@example.com', employeeProfileId: null, employeeEmail: null },
      ]),
    ).toEqual([]);
  });

  it('laisse le compte entreprise s’il n’est pas inscrit', () => {
    expect(filterStagiaireSearchHits([jeanCompte, jeanEntreprise], [])).toEqual([
      { ...jeanCompte, orphanEmployeeOnSession: false },
      { ...jeanEntreprise, orphanEmployeeOnSession: false },
    ]);
  });

  it('propose le compte particulier si seule la fiche salarié sans compte est inscrite', () => {
    expect(
      filterStagiaireSearchHits([jeanCompte], [
        {
          profileId: null,
          profileEmail: null,
          employeeProfileId: null,
          employeeEmail: 'jean@example.com',
        },
      ]),
    ).toEqual([{ ...jeanCompte, orphanEmployeeOnSession: true }]);
  });

  it('n’affiche qu’un profil par email, en préférant le particulier', () => {
    const doublon = {
      id: 'profile-jean-2',
      full_name: 'Jean Dupont',
      email: 'JEAN@example.com',
      account_type: null,
    };
    expect(filterStagiaireSearchHits([doublon, jeanCompte], [])).toEqual([
      { ...jeanCompte, orphanEmployeeOnSession: false },
    ]);
  });

  it('exclut le compte déjà rattaché via employees.profile_id', () => {
    expect(
      filterStagiaireSearchHits([jeanCompte], [
        {
          profileId: null,
          profileEmail: null,
          employeeProfileId: 'profile-jean',
          employeeEmail: 'jean@example.com',
        },
      ]),
    ).toEqual([]);
  });

  it('ne casse pas si un candidat a un email manquant', () => {
    expect(
      filterStagiaireSearchHits(
        [
          { id: 'broken', full_name: 'Sans Email', email: null as unknown as string, account_type: 'particulier' },
          jeanCompte,
        ],
        [],
      ),
    ).toEqual([
      { ...jeanCompte, orphanEmployeeOnSession: false },
      {
        id: 'broken',
        full_name: 'Sans Email',
        email: null as unknown as string,
        account_type: 'particulier',
        orphanEmployeeOnSession: false,
      },
    ]);
  });
});
