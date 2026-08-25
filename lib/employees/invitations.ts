import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendAndLog } from '@/lib/email/log';
import {
  employeeLinkInvitationEmailHtml,
  employeeLinkInvitationEmailSubject,
} from '@/lib/email/templates/employee-link-invitation';
import type { EmployeeInvitation } from '@/lib/supabase/types';
import {
  escapeIlikeExact,
  evaluateEmployeeLink,
  generateEmployeeInvitationToken,
  isEmployeeInvitationUsable,
  normalizeEmployeeEmail,
  type LinkableProfile,
} from './linkability';

const INVITATION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export interface ExistingProfile extends LinkableProfile {
  email: string;
  employer_profile_id: string | null;
  full_name: string;
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

function pickBestProfile(rows: ExistingProfile[]): ExistingProfile | null {
  if (rows.length === 0) return null;
  if (rows.length === 1) return rows[0] ?? null;
  return (
    rows.find((r) => r.role === 'stagiaire' && r.account_type === 'particulier')
    ?? rows.find((r) => r.role === 'stagiaire')
    ?? rows[0]
    ?? null
  );
}

export async function findProfileByEmail(email: string): Promise<ExistingProfile | null> {
  const admin = createAdminClient();
  const normalized = normalizeEmployeeEmail(email);
  const pattern = escapeIlikeExact(normalized);
  const { data, error } = await admin
    .from('profiles')
    .select('id, role, account_type, email, employer_profile_id, full_name')
    .ilike('email', pattern)
    .limit(10);
  if (error) {
    console.error('[employees] findProfileByEmail failed', error);
    return null;
  }
  return pickBestProfile((data ?? []) as ExistingProfile[]);
}

export function assertEmailCanBeLinked(
  profile: ExistingProfile | null,
  employerProfileId: string,
): { ok: true } | { ok: false; error: string } {
  if (!profile) return { ok: true };
  const check = evaluateEmployeeLink(profile, employerProfileId);
  if (!check.ok) return { ok: false, error: check.message };
  return { ok: true };
}

async function entrepriseLabel(employerProfileId: string): Promise<string> {
  const admin = createAdminClient();
  const [{ data: company }, { data: employer }] = await Promise.all([
    admin.from('company_details').select('raison_sociale').eq('profile_id', employerProfileId).maybeSingle(),
    admin.from('profiles').select('full_name').eq('id', employerProfileId).maybeSingle(),
  ]);
  return company?.raison_sociale || employer?.full_name || 'Votre employeur';
}

export async function findInvitationByToken(token: string): Promise<EmployeeInvitation | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('employee_invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  return (data as EmployeeInvitation | null) ?? null;
}

async function upsertPendingInvitation(
  employeeId: string,
  email: string,
  invitedBy: string,
): Promise<{ token: string } | { error: string }> {
  const admin = createAdminClient();
  const token = generateEmployeeInvitationToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS).toISOString();

  const { data: pending } = await admin
    .from('employee_invitations')
    .select('id')
    .eq('employee_id', employeeId)
    .is('claimed_at', null)
    .maybeSingle();

  if (pending) {
    const { error } = await admin
      .from('employee_invitations')
      .update({
        token,
        email,
        invited_by: invitedBy,
        invited_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .eq('id', pending.id);
    if (error) return { error: error.message };
    return { token };
  }

  const { error } = await admin.from('employee_invitations').insert({
    employee_id: employeeId,
    email,
    token,
    invited_by: invitedBy,
    expires_at: expiresAt,
  });
  if (error) return { error: error.message };
  return { token };
}

export type SendLinkInvitationResult =
  | { ok: true; resent: boolean }
  | { ok: false; error: string; code?: 'no_account' | 'already_linked' | 'ineligible' };

/**
 * Envoie (ou renvoie) une invitation de rattachement vers un compte déjà existant.
 * Ne crée jamais d'utilisateur auth.
 */
export async function sendEmployeeLinkInvitation(
  employeeId: string,
  invitedBy: string,
): Promise<SendLinkInvitationResult> {
  const admin = createAdminClient();
  const { data: emp } = await admin
    .from('employees')
    .select('id, prenom, nom, email, profile_id, employer_profile_id')
    .eq('id', employeeId)
    .single();
  if (!emp) return { ok: false, error: 'Salarié introuvable.' };
  if (emp.profile_id) {
    return { ok: false, error: 'Ce salarié est déjà rattaché à un compte.', code: 'already_linked' };
  }

  const existing = await findProfileByEmail(emp.email);
  if (!existing) {
    return {
      ok: false,
      error: "Aucun compte existant pour cet email. L'accès sera créé via l'invitation du formateur.",
      code: 'no_account',
    };
  }
  const eligible = evaluateEmployeeLink(existing, emp.employer_profile_id);
  if (!eligible.ok) {
    return { ok: false, error: eligible.message, code: 'ineligible' };
  }

  const { data: pendingBefore } = await admin
    .from('employee_invitations')
    .select('id')
    .eq('employee_id', employeeId)
    .is('claimed_at', null)
    .maybeSingle();
  const resent = !!pendingBefore;

  const upserted = await upsertPendingInvitation(employeeId, normalizeEmployeeEmail(emp.email), invitedBy);
  if ('error' in upserted) return { ok: false, error: upserted.error };

  const label = await entrepriseLabel(emp.employer_profile_id);
  const invitationUrl = `${siteUrl()}/rattachement-employe?token=${encodeURIComponent(upserted.token)}`;
  const subject = employeeLinkInvitationEmailSubject(label);
  const html = employeeLinkInvitationEmailHtml({
    prenom: emp.prenom,
    nom: emp.nom,
    entrepriseLabel: label,
    invitationUrl,
  });

  const sent = await sendAndLog({
    kind: 'employee_link_invitation',
    to: emp.email,
    toProfileId: existing.id,
    subject,
    html,
    refTable: 'employees',
    refId: employeeId,
    isReminder: resent,
    metadata: { entreprise: label, employee_id: employeeId },
  });
  if (!sent.ok) {
    return { ok: false, error: "L'invitation a été créée mais l'email n'a pas pu être envoyé." };
  }
  return { ok: true, resent };
}

/**
 * Si un compte rattachable existe déjà pour l'email du salarié, envoie l'invitation.
 * No-op si pas de compte, déjà lié, ou inéligible (l'inéligibilité doit être filtrée avant insert).
 */
export async function maybeInviteExistingAccount(
  employeeId: string,
  invitedBy: string,
): Promise<'sent' | 'not_needed' | 'failed'> {
  const result = await sendEmployeeLinkInvitation(employeeId, invitedBy);
  if (result.ok) return 'sent';
  if (result.code === 'no_account' || result.code === 'already_linked') return 'not_needed';
  console.error('[employees] maybeInviteExistingAccount', result.error);
  return 'failed';
}

export async function claimEmployeeInvitation(
  token: string,
  profileId: string,
): Promise<{ ok: true; already?: boolean } | { ok: false; reason: string; invitedEmail?: string }> {
  const admin = createAdminClient();
  const inv = await findInvitationByToken(token);
  if (!inv) return { ok: false, reason: 'Invitation introuvable.' };

  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, account_type, email, employer_profile_id')
    .eq('id', profileId)
    .maybeSingle();
  if (!profile) return { ok: false, reason: 'Profil introuvable.' };

  const { data: emp } = await admin
    .from('employees')
    .select('id, profile_id, employer_profile_id, email')
    .eq('id', inv.employee_id)
    .maybeSingle();
  if (!emp) return { ok: false, reason: 'Fiche salarié introuvable.' };

  if (emp.profile_id === profileId || inv.claimed_by === profileId) {
    return { ok: true, already: true };
  }

  if (!isEmployeeInvitationUsable(inv)) {
    return { ok: false, reason: 'Invitation expirée ou déjà utilisée.', invitedEmail: inv.email };
  }

  if (normalizeEmployeeEmail(profile.email) !== normalizeEmployeeEmail(inv.email)) {
    return {
      ok: false,
      reason: `Connectez-vous avec l’adresse invitée (${inv.email}) pour rattacher ce compte.`,
      invitedEmail: inv.email,
    };
  }

  const eligible = evaluateEmployeeLink(profile, emp.employer_profile_id);
  if (!eligible.ok) return { ok: false, reason: eligible.message, invitedEmail: inv.email };

  if (emp.profile_id && emp.profile_id !== profileId) {
    return { ok: false, reason: 'Cette fiche salarié est déjà rattachée à un autre compte.' };
  }

  const { data: claimed, error: invErr } = await admin
    .from('employee_invitations')
    .update({ claimed_by: profileId, claimed_at: new Date().toISOString() })
    .eq('id', inv.id)
    .is('claimed_at', null)
    .select('id')
    .maybeSingle();
  if (invErr) return { ok: false, reason: invErr.message };
  if (!claimed) return { ok: false, reason: 'Invitation déjà utilisée par un autre compte.' };

  const { data: linked, error: empErr } = await admin
    .from('employees')
    .update({ profile_id: profileId, updated_at: new Date().toISOString() })
    .eq('id', emp.id)
    .is('profile_id', null)
    .select('id')
    .maybeSingle();
  if (empErr) {
    return { ok: false, reason: empErr.message };
  }
  if (!linked) {
    const { data: again } = await admin
      .from('employees')
      .select('profile_id')
      .eq('id', emp.id)
      .maybeSingle();
    if (again?.profile_id === profileId) return { ok: true, already: true };
    return { ok: false, reason: 'Cette fiche salarié est déjà rattachée à un autre compte.' };
  }

  if (!profile.employer_profile_id) {
    const { error: profErr } = await admin
      .from('profiles')
      .update({ employer_profile_id: emp.employer_profile_id, updated_at: new Date().toISOString() })
      .eq('id', profileId)
      .is('employer_profile_id', null);
    if (profErr) {
      console.error('[employees] claim: employer_profile_id update failed', profErr);
    }
  }

  return { ok: true };
}
