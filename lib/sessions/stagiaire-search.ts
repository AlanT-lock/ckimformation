import { normalizeEmployeeEmail } from '@/lib/employees/linkability';

function asEmail(value: string | null | undefined): string {
  return typeof value === 'string' ? normalizeEmployeeEmail(value) : '';
}

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
    const profileEmail = asEmail(occupant.profileEmail);
    if (profileEmail) enrolledAccountEmails.add(profileEmail);
    const employeeEmail = asEmail(occupant.employeeEmail);
    if (employeeEmail) {
      if (occupant.employeeProfileId) enrolledAccountEmails.add(employeeEmail);
      else orphanEmployeeEmails.add(employeeEmail);
    }
  }

  const eligible = candidates.filter((profile) => {
    if (profile.account_type === 'entreprise') return false;
    if (enrolledProfileIds.has(profile.id)) return false;
    const email = asEmail(profile.email);
    if (email && enrolledAccountEmails.has(email)) return false;
    return true;
  });

  const byEmail = new Map<string, StagiaireSearchCandidate>();
  const withoutEmail: StagiaireSearchCandidate[] = [];
  for (const profile of eligible) {
    const email = asEmail(profile.email);
    if (!email) {
      withoutEmail.push(profile);
      continue;
    }
    const existing = byEmail.get(email);
    if (!existing || accountPriority(profile.account_type) > accountPriority(existing.account_type)) {
      byEmail.set(email, profile);
    }
  }

  return [...byEmail.values(), ...withoutEmail].map((profile) => ({
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    account_type: profile.account_type,
    orphanEmployeeOnSession: orphanEmployeeEmails.has(asEmail(profile.email)),
  }));
}
