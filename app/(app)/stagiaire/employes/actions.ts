'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { sendEmployeeLinkInvitation } from '@/lib/employees/invitations';
import { upsertEmployeeForEmployer } from '@/lib/employees/upsert';
import { normalizeEmployeeEmail } from '@/lib/employees/linkability';

export interface EmployeeInput {
  prenom: string;
  nom: string;
  email: string;
}

function normalize(input: EmployeeInput): EmployeeInput {
  return {
    prenom: input.prenom.trim(),
    nom: input.nom.trim(),
    email: normalizeEmployeeEmail(input.email),
  };
}

function validate(input: EmployeeInput): string | null {
  if (!input.prenom) return 'Le prénom est requis.';
  if (!input.nom) return 'Le nom est requis.';
  if (!input.email) return "L'email est requis.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return 'Email invalide.';
  return null;
}

async function requireEntreprise() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'stagiaire' || profile.account_type !== 'entreprise') {
    throw new Error('Réservé aux comptes entreprise.');
  }
  return profile;
}

export type CreateEmployeeResult =
  | { ok: true; id: string; created: boolean; invitation: 'sent' | 'not_needed' | 'failed' }
  | { ok: false; error: string };

export async function createEmployee(raw: EmployeeInput): Promise<CreateEmployeeResult> {
  const profile = await requireEntreprise();
  const input = normalize(raw);
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const supabase = await createClient();
  const result = await upsertEmployeeForEmployer(supabase, profile.id, input, profile.id);
  if (!result.ok) return result;

  revalidatePath('/stagiaire/employes');
  return { ok: true, id: result.id, created: result.created, invitation: result.invitation };
}

export async function updateEmployee(id: string, raw: EmployeeInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await requireEntreprise();
  const input = normalize(raw);
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from('employees')
    .select('id, profile_id, email')
    .eq('id', id)
    .eq('employer_profile_id', profile.id)
    .maybeSingle();
  if (!current) return { ok: false, error: 'Salarié introuvable.' };
  if (current.profile_id && current.email !== input.email) {
    return { ok: false, error: 'Impossible de modifier l’email d’un salarié déjà rattaché à un compte.' };
  }

  const { error } = await supabase
    .from('employees')
    .update({ prenom: input.prenom, nom: input.nom, email: input.email, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Un salarié avec cet email existe déjà.' };
    return { ok: false, error: error.message };
  }
  revalidatePath('/stagiaire/employes');
  return { ok: true };
}

export async function deleteEmployee(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireEntreprise();
  const supabase = await createClient();
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      return { ok: false, error: 'Ce salarié est rattaché à une inscription et ne peut pas être supprimé.' };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath('/stagiaire/employes');
  return { ok: true };
}

export async function resendEmployeeInvitation(
  employeeId: string,
): Promise<{ ok: true; resent: boolean } | { ok: false; error: string }> {
  const profile = await requireEntreprise();
  const supabase = await createClient();
  const { data: emp } = await supabase
    .from('employees')
    .select('id')
    .eq('id', employeeId)
    .eq('employer_profile_id', profile.id)
    .maybeSingle();
  if (!emp) return { ok: false, error: 'Salarié introuvable.' };

  const result = await sendEmployeeLinkInvitation(employeeId, profile.id);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath('/stagiaire/employes');
  return { ok: true, resent: result.resent };
}
