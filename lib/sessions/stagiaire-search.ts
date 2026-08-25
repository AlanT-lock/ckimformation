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

/** Minuscules, sans accents. Conserve @ . _ + - pour les emails. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9@._+-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeEmail(value: string): boolean {
  return value.includes('@');
}

/** Prénom, nom (dans n'importe quel ordre) ou email, accents facultatifs. */
export function profileMatchesQuery(name: string, email: string, query: string): boolean {
  const raw = query.trim();
  if (raw.length < 2) return false;

  const emailNorm = asEmail(email);
  const queryEmail = looksLikeEmail(raw) ? normalizeEmployeeEmail(raw) : '';
  if (queryEmail) {
    if (emailNorm === queryEmail) return true;
    if (emailNorm.includes(queryEmail) || queryEmail.includes(emailNorm)) return true;
  }

  const q = normalizeSearchText(raw);
  if (q.length < 2) return false;
  const hay = normalizeSearchText(`${name} ${email}`);
  if (!hay) return false;
  if (hay.includes(q)) return true;
  const tokens = q.split(' ').filter((token) => token.length >= 2);
  if (tokens.length === 0) return false;
  return tokens.every((token) => hay.includes(token));
}

/**
 * Retire seulement les profils déjà inscrits (id).
 * Si plusieurs profils partagent le même email, on garde le compte particulier.
 */
export function filterStagiaireSearchHits(
  candidates: StagiaireSearchCandidate[],
  occupants: SessionSearchOccupant[],
): StagiaireSearchHit[] {
  const enrolledProfileIds = new Set<string>();
  const orphanEmployeeEmails = new Set<string>();

  for (const occupant of occupants) {
    if (occupant.profileId) enrolledProfileIds.add(occupant.profileId);
    if (occupant.employeeProfileId) enrolledProfileIds.add(occupant.employeeProfileId);
    const employeeEmail = asEmail(occupant.employeeEmail);
    if (employeeEmail && !occupant.employeeProfileId) {
      orphanEmployeeEmails.add(employeeEmail);
    }
  }

  const eligible = candidates.filter((profile) => !enrolledProfileIds.has(profile.id));

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
