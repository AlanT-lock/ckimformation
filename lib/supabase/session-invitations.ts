import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SessionInvitation } from './types';

export function generateInvitationToken(): string {
  const a = crypto.randomUUID().replace(/-/g, '');
  const b = crypto.randomUUID().replace(/-/g, '');
  return `${a}${b}`.slice(0, 48);
}

export async function findInvitationByToken(token: string): Promise<SessionInvitation | null> {
  const sb = createAdminClient();
  const { data } = await sb
    .from('session_invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  return (data as SessionInvitation | null) ?? null;
}

export function isInvitationUsable(inv: SessionInvitation): boolean {
  if (inv.claimed_by) return false;
  if (new Date(inv.expires_at).getTime() < Date.now()) return false;
  return true;
}

export async function claimInvitation(
  token: string,
  profileId: string,
): Promise<{ ok: true; sessionId: string } | { ok: false; reason: string }> {
  const sb = createAdminClient();

  const { data: profile } = await sb
    .from('profiles')
    .select('id, role, account_type')
    .eq('id', profileId)
    .maybeSingle();
  if (!profile || profile.role !== 'stagiaire' || profile.account_type !== 'entreprise') {
    return { ok: false, reason: 'Le compte doit être un compte entreprise.' };
  }

  const inv = await findInvitationByToken(token);
  if (!inv) return { ok: false, reason: 'Invitation introuvable.' };
  if (!isInvitationUsable(inv)) return { ok: false, reason: 'Invitation expirée ou déjà utilisée.' };

  const { error: invErr } = await sb
    .from('session_invitations')
    .update({ claimed_by: profileId, claimed_at: new Date().toISOString() })
    .eq('id', inv.id)
    .is('claimed_by', null);
  if (invErr) return { ok: false, reason: invErr.message };

  const { error: sessErr } = await sb
    .from('sessions')
    .update({ reserved_company_id: profileId })
    .eq('id', inv.session_id);
  if (sessErr) return { ok: false, reason: sessErr.message };

  return { ok: true, sessionId: inv.session_id };
}
