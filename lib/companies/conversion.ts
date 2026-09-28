export interface ConvertibleProfile {
  role: string;
  account_type: string | null;
  employer_profile_id: string | null;
}

/** Un compte ne peut devenir entreprise que s'il s'agit d'un particulier indépendant. */
export function canConvertToCompany(
  p: ConvertibleProfile,
  linkedEmployeeCount: number,
): { ok: true } | { ok: false; reason: string } {
  if (p.role !== 'stagiaire') return { ok: false, reason: 'Seul un compte stagiaire peut être transformé.' };
  if (p.account_type === 'entreprise') return { ok: false, reason: 'Ce compte est déjà un compte entreprise.' };
  if (p.employer_profile_id || linkedEmployeeCount > 0) {
    return { ok: false, reason: 'Ce compte est rattaché comme salarié à une entreprise.' };
  }
  return { ok: true };
}
