import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  assertEmailCanBeLinked,
  findProfileByEmail,
  maybeInviteExistingAccount,
} from './invitations';
import { normalizeEmployeeEmail } from './linkability';

export interface EmployeeDraft {
  prenom: string;
  nom: string;
  email: string;
}

export type UpsertEmployeeResult =
  | {
      ok: true;
      id: string;
      created: boolean;
      invitation: 'sent' | 'not_needed' | 'failed';
      /** L'entreprise s'est ajoutée elle-même (même compte, même email). */
      self?: boolean;
    }
  | { ok: false; error: string };

/**
 * Crée ou réutilise une fiche salarié pour un employeur.
 * Si l'email correspond déjà à un compte stagiaire rattachable, envoie
 * une invitation de rattachement (jamais de second compte auth).
 */
export async function upsertEmployeeForEmployer(
  sb: SupabaseClient,
  employerProfileId: string,
  draft: EmployeeDraft,
  invitedBy: string,
): Promise<UpsertEmployeeResult> {
  const prenom = draft.prenom.trim();
  const nom = draft.nom.trim();
  const email = normalizeEmployeeEmail(draft.email);
  if (!prenom || !nom || !email) {
    return { ok: false, error: 'Prénom, nom et email sont requis.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Email invalide.' };
  }

  const existingProfile = await findProfileByEmail(email);
  if (existingProfile?.id === employerProfileId) {
    return upsertSelfEmployee(sb, employerProfileId, { prenom, nom, email });
  }
  const canLink = assertEmailCanBeLinked(existingProfile, employerProfileId);
  if (!canLink.ok) return canLink;

  const { data: existing } = await sb
    .from('employees')
    .select('id, profile_id')
    .eq('employer_profile_id', employerProfileId)
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    const invitation = existing.profile_id
      ? 'not_needed'
      : await maybeInviteExistingAccount(existing.id, invitedBy);
    return { ok: true, id: existing.id, created: false, invitation };
  }

  const { data: inserted, error } = await sb
    .from('employees')
    .insert({
      employer_profile_id: employerProfileId,
      prenom,
      nom,
      email,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    if (error?.code === '23505') {
      return { ok: false, error: 'Un salarié avec cet email existe déjà.' };
    }
    return { ok: false, error: error?.message ?? 'Création du salarié impossible.' };
  }

  const invitation = await maybeInviteExistingAccount(inserted.id, invitedBy);
  return { ok: true, id: inserted.id, created: true, invitation };
}

/**
 * Le compte entreprise s'ajoute comme salarié (ex. la gérante qui suit elle-même
 * une formation). Un email = un seul compte auth : la fiche salarié est liée
 * directement au compte de l'entreprise, sans invitation. On ne touche PAS à
 * profiles.employer_profile_id, sinon l'espace entreprise serait réduit à
 * « En formation ».
 */
async function upsertSelfEmployee(
  sb: SupabaseClient,
  employerProfileId: string,
  draft: EmployeeDraft,
): Promise<UpsertEmployeeResult> {
  const { data: existing } = await sb
    .from('employees')
    .select('id, profile_id')
    .eq('employer_profile_id', employerProfileId)
    .eq('email', draft.email)
    .maybeSingle();

  if (existing) {
    if (existing.profile_id !== employerProfileId) {
      const { error } = await sb
        .from('employees')
        .update({ profile_id: employerProfileId, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) return { ok: false, error: error.message };
    }
    return { ok: true, id: existing.id, created: false, invitation: 'not_needed', self: true };
  }

  const { data: inserted, error } = await sb
    .from('employees')
    .insert({
      employer_profile_id: employerProfileId,
      profile_id: employerProfileId,
      prenom: draft.prenom,
      nom: draft.nom,
      email: draft.email,
    })
    .select('id')
    .single();
  if (error || !inserted) {
    if (error?.code === '23505') return { ok: false, error: 'Vous êtes déjà dans la liste des salariés.' };
    return { ok: false, error: error?.message ?? 'Création du salarié impossible.' };
  }
  return { ok: true, id: inserted.id, created: true, invitation: 'not_needed', self: true };
}
