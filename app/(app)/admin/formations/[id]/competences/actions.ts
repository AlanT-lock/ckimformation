'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type Result = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') throw new Error('Accès refusé');
}

function revalidate(formationId: string) {
  revalidatePath(`/admin/formations/${formationId}/competences`);
}

/** Ajoute une ou plusieurs compétences (une par ligne) en fin de liste. */
export async function addCompetences(formationId: string, text: string): Promise<Result> {
  await requireAdmin();
  const libelles = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (libelles.length === 0) return { ok: false, error: 'Saisissez au moins une compétence.' };
  if (libelles.some((l) => l.length > 300)) return { ok: false, error: 'Une compétence fait au maximum 300 caractères.' };

  const admin = createAdminClient();
  const { data: last } = await admin
    .from('formation_competences')
    .select('ordre')
    .eq('formation_id', formationId)
    .order('ordre', { ascending: false })
    .limit(1);
  const start = (last?.[0]?.ordre ?? 0) + 1;
  const { error } = await admin
    .from('formation_competences')
    .insert(libelles.map((libelle, i) => ({ formation_id: formationId, libelle, ordre: start + i })));
  if (error) return { ok: false, error: error.message };
  revalidate(formationId);
  return { ok: true };
}

export async function renameCompetence(formationId: string, id: string, libelle: string): Promise<Result> {
  await requireAdmin();
  const value = libelle.trim();
  if (!value) return { ok: false, error: 'Le libellé ne peut pas être vide.' };
  const admin = createAdminClient();
  const { error } = await admin
    .from('formation_competences')
    .update({ libelle: value })
    .eq('id', id)
    .eq('formation_id', formationId);
  if (error) return { ok: false, error: error.message };
  revalidate(formationId);
  return { ok: true };
}

export async function deleteCompetence(formationId: string, id: string): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('formation_competences').delete().eq('id', id).eq('formation_id', formationId);
  if (error) return { ok: false, error: error.message };
  revalidate(formationId);
  return { ok: true };
}

/** Échange la position d'une compétence avec sa voisine (haut / bas). */
export async function moveCompetence(formationId: string, id: string, direction: 'up' | 'down'): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: list } = await admin
    .from('formation_competences')
    .select('id, ordre')
    .eq('formation_id', formationId)
    .order('ordre')
    .order('created_at');
  const rows = list ?? [];
  const i = rows.findIndex((r) => r.id === id);
  const j = direction === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return { ok: true };

  // Renumérote proprement (1..n) avec l'échange appliqué
  const reordered = rows.slice();
  [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
  for (let k = 0; k < reordered.length; k++) {
    if (reordered[k].ordre === k + 1) continue;
    const { error } = await admin.from('formation_competences').update({ ordre: k + 1 }).eq('id', reordered[k].id);
    if (error) return { ok: false, error: error.message };
  }
  revalidate(formationId);
  return { ok: true };
}
