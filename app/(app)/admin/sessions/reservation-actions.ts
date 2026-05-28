'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateInvitationToken } from '@/lib/supabase/session-invitations';

export interface EtablissementSearchResult {
  profile_id: string;
  raison_sociale: string;
  siret: string | null;
  email: string;
  contact_nom: string;
  account_type: 'entreprise';
}

async function requireAdmin() {
  const p = await getCurrentProfile();
  if (!p || p.role !== 'admin') throw new Error('Accès refusé');
  return p;
}

export async function searchEtablissements(q: string): Promise<EtablissementSearchResult[]> {
  await requireAdmin();
  if (!q || q.trim().length < 2) return [];
  const sb = await createClient();
  const like = `%${q.trim()}%`;
  const { data, error } = await sb
    .from('profiles')
    .select('id, full_name, email, account_type, company_details!inner(raison_sociale, siret)')
    .eq('role', 'stagiaire')
    .eq('account_type', 'entreprise')
    .or(`full_name.ilike.${like},email.ilike.${like}`)
    .limit(20);
  if (error) throw new Error(error.message);
  // Note: Supabase .or() on joined tables is finicky. The query above filters parents on profile fields only.
  // To also filter on company_details fields, perform a secondary query and merge.
  const directResults = (data ?? []).map((r: any) => ({
    profile_id: r.id,
    raison_sociale: r.company_details?.raison_sociale ?? '',
    siret: r.company_details?.siret ?? null,
    email: r.email,
    contact_nom: r.full_name,
    account_type: 'entreprise' as const,
  }));
  // Additional search on company_details (raison_sociale / siret)
  const { data: cd } = await sb
    .from('company_details')
    .select('profile_id, raison_sociale, siret, profiles!inner(id, full_name, email, role, account_type)')
    .or(`raison_sociale.ilike.${like},siret.ilike.${like}`)
    .limit(20);
  const fromCd = (cd ?? [])
    .filter((r: any) => r.profiles?.role === 'stagiaire' && r.profiles?.account_type === 'entreprise')
    .map((r: any) => ({
      profile_id: r.profile_id,
      raison_sociale: r.raison_sociale ?? '',
      siret: r.siret ?? null,
      email: r.profiles?.email ?? '',
      contact_nom: r.profiles?.full_name ?? '',
      account_type: 'entreprise' as const,
    }));
  // Dedupe by profile_id
  const seen = new Set<string>();
  return [...directResults, ...fromCd].filter((r) => {
    if (seen.has(r.profile_id)) return false;
    seen.add(r.profile_id);
    return true;
  });
}

export interface InvitationPayload {
  email: string;
  raison_sociale: string;
  siret?: string | null;
  contact_nom?: string | null;
  contact_fonction?: string | null;
  contact_phone?: string | null;
}

export async function createInvitationForSession(
  sessionId: string,
  payload: InvitationPayload,
): Promise<{ id: string; token: string }> {
  const admin = await requireAdmin();
  const sb = createAdminClient();
  const token = generateInvitationToken();
  const { data, error } = await sb
    .from('session_invitations')
    .insert({
      session_id: sessionId,
      email: payload.email.trim().toLowerCase(),
      raison_sociale: payload.raison_sociale,
      siret: payload.siret ?? null,
      contact_nom: payload.contact_nom ?? null,
      contact_fonction: payload.contact_fonction ?? null,
      contact_phone: payload.contact_phone ?? null,
      token,
      invited_by: admin.id,
    })
    .select('id, token')
    .single();
  if (error) throw new Error(error.message);
  return data!;
}

// The email-sending function (sendInvitationEmail) depends on the email template
// added in Task 5. Stub for now; we'll wire it once Task 5 lands.
export async function sendInvitationEmail(_sessionId: string, _invitationId: string): Promise<void> {
  // Implemented in Task 5/12 — intentionally a no-op here so createSession can be wired now.
  return;
}

export async function resendInvitation(invitationId: string): Promise<void> {
  await requireAdmin();
  const sb = createAdminClient();
  const { data: inv } = await sb
    .from('session_invitations')
    .select('session_id')
    .eq('id', invitationId)
    .single();
  if (!inv) throw new Error('Invitation introuvable');
  await sb.from('session_invitations').update({ invited_at: new Date().toISOString() }).eq('id', invitationId);
  await sendInvitationEmail(inv.session_id, invitationId);
  revalidatePath('/admin/sessions');
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  await requireAdmin();
  const sb = createAdminClient();
  const { data: inv } = await sb
    .from('session_invitations')
    .select('id, claimed_by')
    .eq('id', invitationId)
    .single();
  if (!inv) throw new Error('Invitation introuvable');
  if (inv.claimed_by) throw new Error('Invitation déjà acceptée');
  await sb.from('session_invitations').delete().eq('id', invitationId);
  revalidatePath('/admin/sessions');
}
