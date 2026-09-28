'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmployeeAccountInvitation } from '@/lib/employees/account-invitation';

export async function toggleCreneauAbsence(
  sessionId: string,
  creneauId: string,
  participantId: string,
  absent: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await requireFormateurOfSession(sessionId);
  const supabase = await createClient();

  // Vérifie que le créneau appartient bien à la session
  const { data: cre } = await supabase
    .from('session_creneaux')
    .select('id, session_id')
    .eq('id', creneauId)
    .single();
  if (!cre || cre.session_id !== sessionId) {
    return { ok: false, error: 'Créneau introuvable.' };
  }

  if (absent) {
    const { error } = await supabase
      .from('creneau_absences')
      .upsert(
        { creneau_id: creneauId, inscription_participant_id: participantId, marked_by: profile.id },
        { onConflict: 'creneau_id,inscription_participant_id' }
      );
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from('creneau_absences')
      .delete()
      .eq('creneau_id', creneauId)
      .eq('inscription_participant_id', participantId);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(`/formateur/sessions/${sessionId}`);
  revalidatePath(`/formateur/sessions/${sessionId}/stagiaires`);
  return { ok: true };
}

async function requireFormateurOfSession(sessionId: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Non authentifié.');
  if (profile.role !== 'formateur' && profile.role !== 'admin') {
    throw new Error('Accès réservé.');
  }
  if (profile.role === 'formateur') {
    const supabase = await createClient();
    const { data: s } = await supabase
      .from('sessions')
      .select('formateur_id')
      .eq('id', sessionId)
      .single();
    if (!s || s.formateur_id !== profile.id) throw new Error('Cette session ne vous est pas attribuée.');
  }
  return profile;
}

export async function updateEmployeeEmailBeforeAccount(
  sessionId: string,
  employeeId: string,
  newEmail: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireFormateurOfSession(sessionId);
  const email = newEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Email invalide.' };
  }
  const admin = createAdminClient();
  const { data: emp } = await admin
    .from('employees')
    .select('id, profile_id')
    .eq('id', employeeId)
    .single();
  if (!emp) return { ok: false, error: 'Salarié introuvable.' };
  if (emp.profile_id) {
    return { ok: false, error: 'Ce salarié a déjà un compte. Modification impossible.' };
  }
  const { error } = await admin
    .from('employees')
    .update({ email, updated_at: new Date().toISOString() })
    .eq('id', employeeId);
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Un autre salarié utilise déjà cet email dans cette entreprise.' };
    return { ok: false, error: error.message };
  }
  revalidatePath(`/formateur/sessions/${sessionId}/stagiaires`);
  return { ok: true };
}

export async function sendInvitationToEmployee(
  sessionId: string,
  employeeId: string
): Promise<{ ok: true; resent: boolean; mode: 'create' | 'recovery' | 'link' } | { ok: false; error: string }> {
  const actor = await requireFormateurOfSession(sessionId);
  const admin = createAdminClient();

  const { data: sess } = await admin
    .from('sessions')
    .select('formation:formations(titre)')
    .eq('id', sessionId)
    .single();
  const formation = sess && (Array.isArray(sess.formation) ? sess.formation[0] : sess.formation);

  const result = await sendEmployeeAccountInvitation(employeeId, actor.id, {
    formationTitre: formation?.titre ?? 'Formation',
  });
  if (!result.ok) return result;

  revalidatePath(`/formateur/sessions/${sessionId}/stagiaires`);
  return result;
}
