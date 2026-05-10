'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

export interface EmployeeInput {
  prenom: string;
  nom: string;
  email: string;
}

function normalize(input: EmployeeInput): EmployeeInput {
  return {
    prenom: input.prenom.trim(),
    nom: input.nom.trim(),
    email: input.email.trim().toLowerCase(),
  };
}

function validate(input: EmployeeInput): string | null {
  if (!input.prenom) return 'Le prénom est requis.';
  if (!input.nom) return 'Le nom est requis.';
  if (!input.email) return "L'email est requis.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return "Email invalide.";
  return null;
}

async function requireEntreprise() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'stagiaire' || profile.account_type !== 'entreprise') {
    throw new Error('Réservé aux comptes entreprise.');
  }
  return profile;
}

export async function createEmployee(raw: EmployeeInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const profile = await requireEntreprise();
  const input = normalize(raw);
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('employees')
    .insert({
      employer_profile_id: profile.id,
      prenom: input.prenom,
      nom: input.nom,
      email: input.email,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Un salarié avec cet email existe déjà.' };
    return { ok: false, error: error.message };
  }
  revalidatePath('/stagiaire/employes');
  return { ok: true, id: data!.id };
}

export async function updateEmployee(id: string, raw: EmployeeInput): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireEntreprise();
  const input = normalize(raw);
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const supabase = await createClient();
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
