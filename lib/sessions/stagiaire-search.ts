import { normalizeEmployeeEmail } from '@/lib/employees/linkability';

export interface SessionSearchOccupant {
  profileId: string | null;
  profileEmail: string | null;
  employeeProfileId: string | null;
  employeeEmail: string | null;
}

export interface StagiaireSearchCandidate {
  id: string;
  full_name: string;
  email: string;
  account_type: 'particulier' | 'entreprise' | null;
}

export interface StagiaireSearchHit {
  id: string;
  full_name: string;
  email: string;
  account_type: 'particulier' | 'entreprise' | null;
  /** Une fiche salarié sans compte, même email, est déjà sur la session. */
  orphanEmployeeOnSession: boolean;
}

function accountPriority(accountType: StagiaireSearchCandidate['account_type']): number {
  if (accountType === 'particulier') return 2;
  if (accountType == null) return 1;
  return 0;
}

/**
 * Ne propose que des comptes stagiaires (pas entreprise) absents de la session.
 * Si plusieurs profils partagent le même email, on garde le compte particulier.
 */
export function filterStagiaireSearchHits(
  candidates: StagiaireSearchCandidate[],
  occupants: SessionSearchOccupant[],
): StagiaireSearchHit[] {
  const enrolledProfileIds = new Set<string>();
  const enrolledAccountEmails = new Set<string>();
  const orphanEmployeeEmails = new Set<string>();

  for (const occupant of occupants) {
    if (occupant.profileId) enrolledProfileIds.add(occupant.profileId);
    if (occupant.employeeProfileId) enrolledProfileIds.add(occupant.employeeProfileId);
    if (occupant.profileEmail) {
      enrolledAccountEmails.add(normalizeEmployeeEmail(occupant.profileEmail));
    }
    if (occupant.employeeEmail) {
      const email = normalizeEmployeeEmail(occupant.employeeEmail);
      if (occupant.employeeProfileId) enrolledAccountEmails.add(email);
      else orphanEmployeeEmails.add(email);
    }
  }

  const eligible = candidates.filter((profile) => {
    if (profile.account_type === 'entreprise') return false;
    if (enrolledProfileIds.has(profile.id)) return false;
    const email = normalizeEmployeeEmail(profile.email);
    if (enrolledAccountEmails.has(email)) return false;
    return true;
  });

  const byEmail = new Map<string, StagiaireSearchCandidate>();
  for (const profile of eligible) {
    const email = normalizeEmployeeEmail(profile.email);
    const existing = byEmail.get(email);
    if (!existing || accountPriority(profile.account_type) > accountPriority(existing.account_type)) {
      byEmail.set(email, profile);
    }
  }

  return [...byEmail.values()].map((profile) => ({
    ...profile,
    orphanEmployeeOnSession: orphanEmployeeEmails.has(normalizeEmployeeEmail(profile.email)),
  }));
}
