'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadSessionOccupants, occupantProfileIds } from '@/lib/sessions/search-stagiaires-query';

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Accès réservé à l\'administration.');
  }
  return profile;
}

function revalidateSession(sessionId: string) {
  revalidatePath(`/admin/sessions/${sessionId}`);
  revalidatePath(`/formateur/sessions/${sessionId}`);
  revalidatePath(`/formateur/sessions/${sessionId}/stagiaires`);
  revalidatePath('/stagiaire/parcours');
}

export async function addProfileToSession(
  sessionId: string,
  profileId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: session } = await admin.from('sessions').select('id').eq('id', sessionId).maybeSingle();
  if (!session) return { ok: false, error: 'Session introuvable.' };

  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, email, full_name, account_type')
    .eq('id', profileId)
    .maybeSingle();
  if (!profile) return { ok: false, error: 'Profil introuvable.' };
  if (profile.role !== 'stagiaire') {
    return { ok: false, error: 'Seuls les comptes stagiaires peuvent être inscrits.' };
  }
  if (profile.account_type === 'entreprise') {
    return { ok: false, error: 'Un compte entreprise ne peut pas être ajouté comme stagiaire.' };
  }

  const occupants = await loadSessionOccupants(admin, sessionId);
  if (occupantProfileIds(occupants).has(profileId)) {
    return { ok: false, error: 'Ce stagiaire est déjà inscrit à cette session.' };
  }

  const { data: insc, error: inscErr } = await admin
    .from('inscriptions')
    .insert({
      session_id: sessionId,
      payer_profile_id: profileId,
      participant_profile_id: profileId,
      statut: 'confirmee',
      confirmed_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (inscErr || !insc) {
    return { ok: false, error: inscErr?.message ?? 'Création de l’inscription impossible.' };
  }

  const { error: partErr } = await admin.from('inscription_participants').insert({
    inscription_id: insc.id,
    participant_profile_id: profileId,
  });
  if (partErr) {
    await admin.from('inscriptions').delete().eq('id', insc.id);
    return { ok: false, error: partErr.message };
  }

  revalidateSession(sessionId);
  return { ok: true };
}

export async function removeParticipantFromSession(
  sessionId: string,
  participantId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: part } = await admin
    .from('inscription_participants')
    .select('id, inscription_id, inscription:inscriptions!inner(id, session_id)')
    .eq('id', participantId)
    .maybeSingle();
  if (!part) return { ok: false, error: 'Participant introuvable.' };

  const insc = Array.isArray(part.inscription) ? part.inscription[0] : part.inscription;
  if (!insc || insc.session_id !== sessionId) {
    return { ok: false, error: 'Ce participant n’appartient pas à cette session.' };
  }

  const { error: delErr } = await admin
    .from('inscription_participants')
    .delete()
    .eq('id', participantId);
  if (delErr) return { ok: false, error: delErr.message };

  const { count } = await admin
    .from('inscription_participants')
    .select('id', { count: 'exact', head: true })
    .eq('inscription_id', part.inscription_id);

  if ((count ?? 0) === 0) {
    const { error: inscDelErr } = await admin
      .from('inscriptions')
      .delete()
      .eq('id', part.inscription_id);
    if (inscDelErr) {
      console.error('[admin] inscription orpheline non supprimée', inscDelErr);
    }
  }

  revalidateSession(sessionId);
  return { ok: true };
}
