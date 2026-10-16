'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireStagiaire() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'stagiaire') throw new Error('Accès refusé.');
  return profile;
}

/**
 * Retrouve l'inscription_participant (confirmée) du user dans la session.
 */
async function findMyParticipation(sessionId: string, profileId: string) {
  const supabase = await createClient();
  const { data: parts } = await supabase
    .from('inscription_participants')
    .select(`
      id, inscription_id, employee_id, participant_profile_id, reglement_accepte_at,
      inscription:inscriptions!inner(id, session_id, statut),
      employee:employees(profile_id)
    `)
    .eq('inscription.session_id', sessionId)
    .eq('inscription.statut', 'confirmee');

  return (parts ?? []).find((p) => {
    const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
    return p.participant_profile_id === profileId || emp?.profile_id === profileId;
  }) ?? null;
}

/**
 * Enregistre l'acceptation du règlement intérieur / livret d'accueil pour la
 * participation du stagiaire à la session. Le premier horodatage fait foi.
 */
export async function acceptReglementForCurrentUser(
  sessionId: string
): Promise<{ ok: true; acceptedAt: string } | { ok: false; error: string }> {
  const profile = await requireStagiaire();
  const me = await findMyParticipation(sessionId, profile.id);
  if (!me) return { ok: false, error: "Vous n'êtes pas participant·e à cette session." };
  if (me.reglement_accepte_at) return { ok: true, acceptedAt: me.reglement_accepte_at };

  // Pas de policy d'update pour le stagiaire : écriture service-role après vérification.
  const admin = createAdminClient();
  const acceptedAt = new Date().toISOString();
  const { error } = await admin
    .from('inscription_participants')
    .update({ reglement_accepte_at: acceptedAt })
    .eq('id', me.id)
    .is('reglement_accepte_at', null);
  if (error) return { ok: false, error: error.message };

  return { ok: true, acceptedAt };
}

/**
 * Signe l'émargement d'un créneau pour la participation courante du stagiaire.
 * Vérifie qu'un trigger ouvert existe pour le créneau, que le stagiaire est
 * bien participant à la session et qu'il a accepté le règlement intérieur.
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
  const me = await findMyParticipation(sessionId, profile.id);
  if (!me) return { ok: false, error: "Vous n'êtes pas participant·e à cette session." };

  // 3) Règlement intérieur accepté ?
  if (!me.reglement_accepte_at) {
    return { ok: false, error: 'Vous devez accepter le règlement intérieur avant de signer.' };
  }

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
