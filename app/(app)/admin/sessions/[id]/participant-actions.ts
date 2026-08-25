'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

function escapeLikeChars(s: string): string {
  return s.replace(/[%_,()]/g, (c) => (c === ',' || c === '(' || c === ')' ? ' ' : `\\${c}`));
}

async function participatingProfileIds(
  admin: ReturnType<typeof createAdminClient>,
  sessionId: string,
): Promise<Set<string>> {
  const { data: insc } = await admin.from('inscriptions').select('id').eq('session_id', sessionId);
  const inscriptionIds = (insc ?? []).map((i) => i.id);
  if (inscriptionIds.length === 0) return new Set();

  const { data: parts } = await admin
    .from('inscription_participants')
    .select('participant_profile_id, employee:employees(profile_id)')
    .in('inscription_id', inscriptionIds);

  const ids = new Set<string>();
  for (const row of parts ?? []) {
    if (row.participant_profile_id) ids.add(row.participant_profile_id);
    const emp = Array.isArray(row.employee) ? row.employee[0] : row.employee;
    if (emp?.profile_id) ids.add(emp.profile_id);
  }
  return ids;
}

export interface StagiaireSearchHit {
  id: string;
  full_name: string;
  email: string;
  account_type: 'particulier' | 'entreprise' | null;
}

export async function searchStagiairesForSession(
  sessionId: string,
  query: string,
): Promise<StagiaireSearchHit[]> {
  await requireAdmin();
  const q = query.trim();
  if (q.length < 2) return [];

  const admin = createAdminClient();
  const like = `%${escapeLikeChars(q)}%`;
  const already = await participatingProfileIds(admin, sessionId);

  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, email, account_type')
    .eq('role', 'stagiaire')
    .or(`full_name.ilike.${like},email.ilike.${like}`)
    .order('full_name')
    .limit(20);
  if (error) throw new Error(error.message);

  return ((data ?? []) as StagiaireSearchHit[]).filter((p) => !already.has(p.id));
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
    .select('id, role, email, full_name')
    .eq('id', profileId)
    .maybeSingle();
  if (!profile) return { ok: false, error: 'Profil introuvable.' };
  if (profile.role !== 'stagiaire') {
    return { ok: false, error: 'Seuls les comptes stagiaires peuvent être inscrits.' };
  }

  const already = await participatingProfileIds(admin, sessionId);
  if (already.has(profileId)) {
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
