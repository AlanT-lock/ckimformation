// Validation et mise en forme des informations entreprise, partagées entre
// le signup public, la création par l'admin et la conversion d'un particulier.

export interface CompanyInput {
  raison_sociale: string;
  siret: string;
  tva_intra: string;
  secteur_activite: string;
  addr_rue: string;
  addr_cp: string;
  addr_ville: string;
  full_name: string;
  contact_fonction: string;
  email: string;
  phone: string;
}

export const EMPTY_COMPANY_INPUT: CompanyInput = {
  raison_sociale: '',
  siret: '',
  tva_intra: '',
  secteur_activite: '',
  addr_rue: '',
  addr_cp: '',
  addr_ville: '',
  full_name: '',
  contact_fonction: '',
  email: '',
  phone: '',
};

export type CompanySection = 'societe' | 'adresse' | 'contact';
export const COMPANY_SECTIONS: CompanySection[] = ['societe', 'adresse', 'contact'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCompanySection(section: CompanySection, f: CompanyInput): string | null {
  if (section === 'societe') {
    if (!f.raison_sociale.trim()) return 'La raison sociale est obligatoire.';
  }
  if (section === 'adresse') {
    if (!f.addr_rue.trim()) return "L'adresse (rue) est obligatoire.";
    if (!f.addr_cp.trim()) return 'Le code postal est obligatoire.';
    if (!f.addr_ville.trim()) return 'La ville est obligatoire.';
  }
  if (section === 'contact') {
    if (!f.full_name.trim()) return 'Le nom et prénom du contact sont obligatoires.';
    if (!f.contact_fonction.trim()) return 'La fonction du contact est obligatoire.';
    if (!f.email.trim()) return "L'email du contact est obligatoire.";
    if (!EMAIL_RE.test(f.email.trim())) return 'Email invalide.';
    if (!f.phone.trim()) return 'Le téléphone du contact est obligatoire.';
  }
  return null;
}

export function validateCompanyInput(f: CompanyInput): string | null {
  for (const section of COMPANY_SECTIONS) {
    const err = validateCompanySection(section, f);
    if (err) return err;
  }
  return null;
}

export function normalizeCompanyInput(f: CompanyInput): CompanyInput {
  return {
    raison_sociale: f.raison_sociale.trim(),
    siret: f.siret.trim(),
    tva_intra: f.tva_intra.trim(),
    secteur_activite: f.secteur_activite.trim(),
    addr_rue: f.addr_rue.trim(),
    addr_cp: f.addr_cp.trim(),
    addr_ville: f.addr_ville.trim(),
    full_name: f.full_name.trim(),
    contact_fonction: f.contact_fonction.trim(),
    email: f.email.trim().toLowerCase(),
    phone: f.phone.trim(),
  };
}

export function toBillingAddress(f: CompanyInput) {
  return {
    rue: f.addr_rue.trim(),
    code_postal: f.addr_cp.trim(),
    ville: f.addr_ville.trim(),
    pays: 'France',
  };
}

/** Métadonnées lues par le trigger handle_new_user (signUp et generateLink). */
export function toCompanyAuthMetadata(f: CompanyInput): Record<string, string> {
  return {
    role: 'stagiaire',
    account_type: 'entreprise',
    full_name: f.full_name.trim(),
    phone: f.phone.trim(),
    raison_sociale: f.raison_sociale.trim(),
    siret: f.siret.trim(),
    tva_intra: f.tva_intra.trim(),
    contact_fonction: f.contact_fonction.trim(),
    secteur_activite: f.secteur_activite.trim(),
    billing_address: JSON.stringify(toBillingAddress(f)),
  };
}

export function toCompanyDetailsRow(profileId: string, f: CompanyInput) {
  return {
    profile_id: profileId,
    raison_sociale: f.raison_sociale.trim(),
    siret: f.siret.trim() || null,
    tva_intra: f.tva_intra.trim() || null,
    contact_fonction: f.contact_fonction.trim(),
    billing_address: toBillingAddress(f),
  };
}
