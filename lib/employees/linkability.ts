export function normalizeEmployeeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Échappe `%`, `_` et `\` pour un ILIKE « exact » (case-insensitive). */
export function escapeIlikeExact(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export interface LinkableProfile {
  id: string;
  role: string;
  account_type: string | null;
}

export type EmployeeLinkRefusal = 'not_stagiaire' | 'is_entreprise' | 'is_self';

export function evaluateEmployeeLink(
  profile: LinkableProfile,
  employerProfileId: string,
): { ok: true } | { ok: false; code: EmployeeLinkRefusal; message: string } {
  if (profile.id === employerProfileId) {
    return {
      ok: false,
      code: 'is_self',
      message: 'Vous ne pouvez pas vous ajouter vous-même comme salarié.',
    };
  }
  if (profile.role !== 'stagiaire') {
    return {
      ok: false,
      code: 'not_stagiaire',
      message:
        'Cette adresse correspond à un compte formateur ou administrateur et ne peut pas être ajoutée comme salarié.',
    };
  }
  if (profile.account_type === 'entreprise') {
    return {
      ok: false,
      code: 'is_entreprise',
      message:
        'Cette adresse correspond déjà à un compte entreprise. Utilisez l’adresse personnelle du salarié.',
    };
  }
  return { ok: true };
}

export interface EmployeeInvitationState {
  claimed_by: string | null;
  expires_at: string;
}

export function isEmployeeInvitationUsable(inv: EmployeeInvitationState): boolean {
  if (inv.claimed_by) return false;
  if (new Date(inv.expires_at).getTime() < Date.now()) return false;
  return true;
}

export function generateEmployeeInvitationToken(): string {
  const a = crypto.randomUUID().replace(/-/g, '');
  const b = crypto.randomUUID().replace(/-/g, '');
  return `${a}${b}`.slice(0, 48);
}
