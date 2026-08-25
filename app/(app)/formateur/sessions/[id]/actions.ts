'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

async function requireFormateurOfSession(sessionId: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Non connecté');
  const supabase = await createClient();
  const { data: s } = await supabase
    .from('sessions')
    .select('formateur_id')
    .eq('id', sessionId)
    .single();
  if (!s) throw new Error('Session introuvable');
  if (profile.role === 'admin') return profile;
  if (profile.role !== 'formateur' || s.formateur_id !== profile.id) {
    throw new Error('Accès refusé');
  }
  return profile;
}

export async function triggerTest(sessionId: string, testId: string) {
  const profile = await requireFormateurOfSession(sessionId);
  const supabase = await createClient();
  const { error } = await supabase.from('session_test_triggers').insert({
    session_id: sessionId,
    test_id: testId,
    triggered_by: profile.id,
  });
  if (error) {
    if (error.code === '23505') throw new Error('Ce test a déjà été déclenché.');
    throw new Error(error.message);
  }
  revalidatePath(`/formateur/sessions/${sessionId}`);
  revalidatePath('/stagiaire/parcours');
}

export async function untriggerTest(sessionId: string, triggerId: string) {
  await requireFormateurOfSession(sessionId);
  const supabase = await createClient();
  const { error } = await supabase.from('session_test_triggers').delete().eq('id', triggerId);
  if (error) throw new Error(error.message);
  revalidatePath(`/formateur/sessions/${sessionId}`);
  revalidatePath('/stagiaire/parcours');
}

export async function triggerEmargement(sessionId: string, creneauId: string) {
  const profile = await requireFormateurOfSession(sessionId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('creneau_emargement_triggers')
    .insert({
      session_id: sessionId,
      creneau_id: creneauId,
      triggered_by: profile.id,
    })
    .select('id, creneau_id, triggered_at, closed_at')
    .single();
  if (error) {
    if (error.code === '23505') throw new Error("L'émargement de ce créneau est déjà ouvert.");
    throw new Error(error.message);
  }
  revalidatePath(`/formateur/sessions/${sessionId}`);
  revalidatePath(`/admin/sessions/${sessionId}`);
  return data as { id: string; creneau_id: string; triggered_at: string; closed_at: string | null };
}

export async function signFormateurEmargement(
  sessionId: string,
  creneauId: string,
  signatureDataUrl: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await requireFormateurOfSession(sessionId);
  if (!signatureDataUrl.startsWith('data:image/')) {
    return { ok: false, error: 'Signature invalide.' };
  }
  const supabase = await createClient();

  const { data: cre } = await supabase
    .from('session_creneaux')
    .select('id, session_id')
    .eq('id', creneauId)
    .maybeSingle();
  if (!cre || cre.session_id !== sessionId) {
    return { ok: false, error: 'Créneau introuvable.' };
  }

  const { data: trig } = await supabase
    .from('creneau_emargement_triggers')
    .select('id, closed_at')
    .eq('session_id', sessionId)
    .eq('creneau_id', creneauId)
    .maybeSingle();
  if (!trig) return { ok: false, error: "L'émargement n'est pas ouvert." };
  if (trig.closed_at) return { ok: false, error: "L'émargement de ce créneau est clôturé." };

  const { error } = await supabase.from('formateur_emargements').upsert(
    {
      session_id: sessionId,
      creneau_id: creneauId,
      profile_id: profile.id,
      signature_data: signatureDataUrl,
      signed_at: new Date().toISOString(),
    },
    { onConflict: 'creneau_id' },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/formateur/sessions/${sessionId}`);
  revalidatePath(`/admin/sessions/${sessionId}`);
  return { ok: true };
}

export async function closeEmargement(sessionId: string, triggerId: string) {
  await requireFormateurOfSession(sessionId);
  const supabase = await createClient();
  const { error } = await supabase
    .from('creneau_emargement_triggers')
    .update({ closed_at: new Date().toISOString() })
    .eq('id', triggerId);
  if (error) throw new Error(error.message);
  revalidatePath(`/formateur/sessions/${sessionId}`);
  revalidatePath(`/admin/sessions/${sessionId}`);
}

export async function reopenEmargement(sessionId: string, triggerId: string) {
  await requireFormateurOfSession(sessionId);
  const supabase = await createClient();
  const { error } = await supabase
    .from('creneau_emargement_triggers')
    .update({ closed_at: null })
    .eq('id', triggerId);
  if (error) throw new Error(error.message);
  revalidatePath(`/formateur/sessions/${sessionId}`);
  revalidatePath(`/admin/sessions/${sessionId}`);
}

export async function terminateSession(sessionId: string) {
  await requireFormateurOfSession(sessionId);
  const supabase = await createClient();
  const { error } = await supabase
    .from('sessions')
    .update({ statut: 'completed', updated_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/formateur/sessions/${sessionId}`);
  revalidatePath('/formateur/sessions');
  revalidatePath('/admin/sessions');
}
