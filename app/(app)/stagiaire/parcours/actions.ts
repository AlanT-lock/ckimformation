'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

async function requireStagiaire() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'stagiaire') throw new Error('Accès refusé.');
  return profile;
}

/**
 * Signe l'émargement d'un créneau pour la participation courante du stagiaire.
 * Vérifie qu'un trigger ouvert existe pour le créneau et que le stagiaire est
 * bien participant à la session correspondante.
 */
export async function signCreneauForCurrentUser(
  sessionId: string,
  creneauId: string,
  signatureDataUrl: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await requireStagiaire();
  const supabase = await createClient();

  // 1) Trigger ouvert ?
  const { data: trig } = await supabase
    .from('creneau_emargement_triggers')
    .select('id, closed_at')
    .eq('creneau_id', creneauId)
    .eq('session_id', sessionId)
    .maybeSingle();
  if (!trig) return { ok: false, error: "L'émargement n'est pas ouvert." };
  if (trig.closed_at) return { ok: false, error: "L'émargement de ce créneau est clôturé." };

  // 2) Trouver l'inscription_participant du user dans cette session
  const { data: parts } = await supabase
    .from('inscription_participants')
    .select(`
      id, inscription_id, employee_id, participant_profile_id,
      inscription:inscriptions!inner(id, session_id, statut),
      employee:employees(profile_id)
    `)
    .eq('inscription.session_id', sessionId)
    .eq('inscription.statut', 'confirmee');

  const me = (parts ?? []).find((p) => {
    const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
    return p.participant_profile_id === profile.id || emp?.profile_id === profile.id;
  });
  if (!me) return { ok: false, error: "Vous n'êtes pas participant·e à cette session." };

  const { error } = await supabase.from('emargements').upsert(
    {
      inscription_id: me.inscription_id,
      inscription_participant_id: me.id,
      creneau_id: creneauId,
      signature_data: signatureDataUrl,
      signed_at: new Date().toISOString(),
    },
    { onConflict: 'inscription_participant_id,creneau_id' }
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath('/stagiaire/parcours');
  return { ok: true };
}
