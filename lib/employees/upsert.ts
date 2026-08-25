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
