'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') throw new Error('Accès refusé');
  return profile;
}

export async function saveActionCorrective(
  completionId: string,
  input: { action_corrective: string; resolved: boolean }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const nowIso = new Date().toISOString();
  const payload: Record<string, unknown> = {
    completion_id: completionId,
    action_corrective: input.action_corrective.trim() || null,
    resolved: input.resolved,
    resolved_at: input.resolved ? nowIso : null,
    resolved_by: input.resolved ? profile.id : null,
    updated_at: nowIso,
  };

  const { error } = await supabase
    .from('enquete_actions_correctives')
    .upsert(payload, { onConflict: 'completion_id' });

  if (error) {
    console.error('[qualite] upsert action corrective failed', error);
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin/qualite');
  revalidatePath(`/admin/qualite/${completionId}`);
  revalidatePath('/admin');
  return { ok: true };
}
