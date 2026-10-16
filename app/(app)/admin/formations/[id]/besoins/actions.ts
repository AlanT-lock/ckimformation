'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { BESOINS_KIND, copyDefaultBesoinsToFormation } from '@/lib/besoins/data';

type Result = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') throw new Error('Accès refusé');
}

/** Crée le questionnaire propre à la formation, à partir des questions par défaut. */
export async function personnaliserBesoins(formationId: string): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: f } = await admin.from('formations').select('titre').eq('id', formationId).maybeSingle();
  if (!f) return { ok: false, error: 'Formation introuvable.' };
  try {
    await copyDefaultBesoinsToFormation(formationId, f.titre);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur' };
  }
  revalidatePath(`/admin/formations/${formationId}/besoins`);
  return { ok: true };
}

/** Supprime le questionnaire propre à la formation : elle revient aux questions par défaut. */
export async function revenirBesoinsParDefaut(formationId: string): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from('tests')
    .delete()
    .eq('kind', BESOINS_KIND)
    .eq('formation_id', formationId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/formations/${formationId}/besoins`);
  return { ok: true };
}
