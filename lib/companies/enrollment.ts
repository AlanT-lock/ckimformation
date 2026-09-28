import type { SessionSearchOccupant } from '@/lib/sessions/stagiaire-search';

export interface EnrollableSession {
  id: string;
  statut: string;
  visibility: 'public' | 'reserved';
  reserved_company_id: string | null;
  firstDate: string | null;
}

/** Publiée, à venir (1er créneau ≥ aujourd'hui), publique ou réservée à cette entreprise. */
export function isSessionEligibleForCompany(s: EnrollableSession, companyId: string, todayIso: string): boolean {
  if (s.statut !== 'published') return false;
  if (!s.firstDate || s.firstDate < todayIso) return false;
  if (s.visibility === 'public') return true;
  return s.reserved_company_id === companyId;
}

/** Sépare les salariés déjà présents sur la session (par fiche ou par profil lié) des autres. */
export function partitionEmployeesByOccupancy(
  employees: { id: string; profile_id: string | null }[],
  occupants: SessionSearchOccupant[],
): { enrollable: string[]; alreadyEnrolled: string[] } {
  const employeeIds = new Set<string>();
  const profileIds = new Set<string>();
  for (const o of occupants) {
    if (o.employeeId) employeeIds.add(o.employeeId);
    if (o.profileId) profileIds.add(o.profileId);
    if (o.employeeProfileId) profileIds.add(o.employeeProfileId);
  }
  const enrollable: string[] = [];
  const alreadyEnrolled: string[] = [];
  for (const e of employees) {
    const taken = employeeIds.has(e.id) || (!!e.profile_id && profileIds.has(e.profile_id));
    (taken ? alreadyEnrolled : enrollable).push(e.id);
  }
  return { enrollable, alreadyEnrolled };
}
