export type EmployeeAccountStatus = 'actif' | 'invite' | 'rattachement' | 'sans_acces';

export const EMPLOYEE_STATUS_LABEL: Record<EmployeeAccountStatus, string> = {
  actif: 'Compte actif',
  invite: 'Invité',
  rattachement: 'Rattachement en attente',
  sans_acces: 'Sans accès',
};

export function employeeAccountStatus(e: {
  profileId: string | null;
  signedIn: boolean;
  pendingLink: boolean;
}): EmployeeAccountStatus {
  if (e.profileId) return e.signedIn ? 'actif' : 'invite';
  return e.pendingLink ? 'rattachement' : 'sans_acces';
}

export type StagiaireKind = 'entreprise' | 'salarie' | 'particulier';

/** Nature d'une ligne de l'annuaire Stagiaires (fiche salarié sans compte ou profil). */
export function stagiaireKind(r: {
  rowKind: 'profile' | 'employee';
  accountType: 'particulier' | 'entreprise' | null;
  hasEmployer: boolean;
}): StagiaireKind | null {
  if (r.rowKind === 'employee' || r.hasEmployer) return 'salarie';
  if (r.accountType === 'entreprise') return 'entreprise';
  if (r.accountType === 'particulier') return 'particulier';
  return null;
}
