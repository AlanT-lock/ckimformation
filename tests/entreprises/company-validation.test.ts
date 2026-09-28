import { describe, it, expect } from 'vitest';
import {
  EMPTY_COMPANY_INPUT,
  normalizeCompanyInput,
  toBillingAddress,
  toCompanyAuthMetadata,
  toCompanyDetailsRow,
  validateCompanyInput,
  validateCompanySection,
  type CompanyInput,
} from '@/lib/validation/company';

const VALID: CompanyInput = {
  raison_sociale: 'ACME SARL',
  siret: '12345678900011',
  tva_intra: '',
  secteur_activite: 'btp',
  addr_rue: '1 rue de la Paix',
  addr_cp: '75002',
  addr_ville: 'Paris',
  full_name: 'Jeanne Martin',
  contact_fonction: 'DRH',
  email: 'rh@acme.fr',
  phone: '0102030405',
};

describe('validateCompanySection', () => {
  it('société : raison sociale obligatoire', () => {
    expect(validateCompanySection('societe', { ...VALID, raison_sociale: '  ' }))
      .toBe('La raison sociale est obligatoire.');
  });
  it('adresse : rue, CP, ville obligatoires', () => {
    expect(validateCompanySection('adresse', { ...VALID, addr_rue: '' })).toBe("L'adresse (rue) est obligatoire.");
    expect(validateCompanySection('adresse', { ...VALID, addr_cp: '' })).toBe('Le code postal est obligatoire.');
    expect(validateCompanySection('adresse', { ...VALID, addr_ville: '' })).toBe('La ville est obligatoire.');
  });
  it('contact : email valide et téléphone obligatoires', () => {
    expect(validateCompanySection('contact', { ...VALID, email: 'pas-un-email' })).toBe('Email invalide.');
    expect(validateCompanySection('contact', { ...VALID, phone: '' })).toBe('Le téléphone du contact est obligatoire.');
    expect(validateCompanySection('contact', { ...VALID, contact_fonction: '' })).toBe('La fonction du contact est obligatoire.');
  });
});

describe('validateCompanyInput', () => {
  it('accepte une saisie complète', () => {
    expect(validateCompanyInput(VALID)).toBeNull();
  });
  it('renvoie la première erreur rencontrée', () => {
    expect(validateCompanyInput(EMPTY_COMPANY_INPUT)).toBe('La raison sociale est obligatoire.');
  });
});

describe('normalizeCompanyInput', () => {
  it('trim tout et met l’email en minuscules', () => {
    const n = normalizeCompanyInput({ ...VALID, raison_sociale: '  ACME ', email: ' RH@Acme.FR ' });
    expect(n.raison_sociale).toBe('ACME');
    expect(n.email).toBe('rh@acme.fr');
  });
});

describe('conversions', () => {
  it('toBillingAddress', () => {
    expect(toBillingAddress(VALID)).toEqual({ rue: '1 rue de la Paix', code_postal: '75002', ville: 'Paris', pays: 'France' });
  });
  it('toCompanyAuthMetadata sérialise billing_address et fixe le type de compte', () => {
    const m = toCompanyAuthMetadata(VALID);
    expect(m.role).toBe('stagiaire');
    expect(m.account_type).toBe('entreprise');
    expect(m.secteur_activite).toBe('btp');
    expect(JSON.parse(m.billing_address)).toEqual(toBillingAddress(VALID));
  });
  it('toCompanyDetailsRow met les champs optionnels vides à null', () => {
    const row = toCompanyDetailsRow('p1', VALID);
    expect(row).toMatchObject({ profile_id: 'p1', raison_sociale: 'ACME SARL', siret: '12345678900011', tva_intra: null, contact_fonction: 'DRH' });
  });
});
