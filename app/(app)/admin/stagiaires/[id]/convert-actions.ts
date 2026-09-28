'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canConvertToCompany } from '@/lib/companies/conversion';
import {
  normalizeCompanyInput,
  toCompanyDetailsRow,
  validateCompanyInput,
  type CompanyInput,
} from '@/lib/validation/company';

/** Transforme un compte particulier en compte entreprise (même login, historique conservé). */
export async function convertToCompany(
  profileId: string,
  raw: CompanyInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await getCurrentProfile();
  if (!me || me.role !== 'admin') throw new Error("Accès réservé à l'administration.");
  const admin = createAdminClient();

  const { data: prof } = await admin
    .from('profiles')
    .select('id, email, role, account_type, employer_profile_id')
    .eq('id', profileId)
    .maybeSingle();
  if (!prof) return { ok: false, error: 'Profil introuvable.' };

  const { count } = await admin
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId);
  const check = canConvertToCompany(prof, count ?? 0);
  if (!check.ok) return { ok: false, error: check.reason };

  // L'email reste celui du compte (identifiant de connexion).
  const input = normalizeCompanyInput({ ...raw, email: prof.email });
  const err = validateCompanyInput(input);
  if (err) return { ok: false, error: err };

  const { data: existingDetails } = await admin
    .from('company_details')
    .select('profile_id')
    .eq('profile_id', profileId)
    .maybeSingle();

  const { error: cdErr } = await admin
    .from('company_details')
    .upsert(toCompanyDetailsRow(profileId, input), { onConflict: 'profile_id' });
  if (cdErr) return { ok: false, error: cdErr.message };

  const { data: secteur } = input.secteur_activite
    ? await admin.from('secteurs_activite').select('code').eq('code', input.secteur_activite).maybeSingle()
    : { data: null };

  const { error: pErr } = await admin
    .from('profiles')
    .update({
      account_type: 'entreprise',
      full_name: input.full_name,
      phone: input.phone,
      secteur_activite: secteur?.code ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId);
  if (pErr) {
    if (!existingDetails) await admin.from('company_details').delete().eq('profile_id', profileId);
    return { ok: false, error: pErr.message };
  }

  revalidatePath(`/admin/stagiaires/${profileId}`);
  revalidatePath('/admin/stagiaires');
  revalidatePath('/admin/entreprises');
  return { ok: true };
}
