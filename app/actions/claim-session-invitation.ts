'use server';

import { getCurrentProfile } from '@/lib/supabase/server';
import { claimInvitation, findInvitationByToken, isInvitationUsable } from '@/lib/supabase/session-invitations';

export async function claimInvitationFromTokenAction(token: string) {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false as const, reason: 'Non authentifié.' };
  const inv = await findInvitationByToken(token);
  if (!inv) return { ok: false as const, reason: 'Invitation introuvable.' };
  if (!isInvitationUsable(inv)) {
    if (inv.claimed_by === profile.id) return { ok: true as const, sessionId: inv.session_id };
    return { ok: false as const, reason: 'Invitation expirée ou déjà utilisée.' };
  }
  return await claimInvitation(token, profile.id);
}
