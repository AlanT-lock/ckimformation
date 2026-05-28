'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateInvitationToken } from '@/lib/supabase/session-invitations';
import { sendAndLog } from '@/lib/email/log';
import {
  renderSessionReservedInvitation,
  renderSessionReservedReminder,
} from '@/lib/email/templates/session-reservee';

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

interface InvitationRow {
  id: string;
  session_id: string;
  email: string;
  raison_sociale: string;
  contact_nom: string | null;
  token: string;
}

interface SessionEmailRow {
  adresse: { rue?: string; code_postal?: string; ville?: string; complement?: string } | null;
  formations: { titre: string } | { titre: string }[] | null;
  session_creneaux: { date: string; heure_debut: string; heure_fin: string }[] | null;
  session_document_requests:
    | { label: string; description: string | null; required: boolean }[]
    | null;
  session_admin_documents: { filename: string; label: string | null }[] | null;
}

function extractFormationTitre(f: SessionEmailRow['formations']): string {
  if (!f) return '';
  if (Array.isArray(f)) return f[0]?.titre ?? '';
  return f.titre ?? '';
}

export async function sendInvitationEmail(
  sessionId: string,
  invitationId: string,
  opts: { reminder?: boolean } = {},
): Promise<void> {
  await requireAdmin();
  const sb = createAdminClient();
  const { data: invRaw } = await sb
    .from('session_invitations')
    .select('id, session_id, email, raison_sociale, contact_nom, token')
    .eq('id', invitationId)
    .single();
  if (!invRaw) throw new Error('Invitation introuvable');
  const inv = invRaw as unknown as InvitationRow;

  const { data: existing } = await sb
    .from('profiles')
    .select('id, account_type')
    .ilike('email', inv.email)
    .maybeSingle();
  const existingTyped = existing as { id: string; account_type: string | null } | null;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ckim-formation.fr';
  const ctaUrl =
    existingTyped && existingTyped.account_type === 'entreprise'
      ? `${baseUrl}/stagiaire/session-dediee/${sessionId}?invitation_token=${inv.token}`
      : `${baseUrl}/signup-entreprise?invitation_token=${inv.token}`;

  const { data: sessRaw } = await sb
    .from('sessions')
    .select(`
      id, adresse,
      formations(titre),
      session_creneaux(date, heure_debut, heure_fin),
      session_document_requests(label, description, required),
      session_admin_documents(filename, label)
    `)
    .eq('id', sessionId)
    .single();
  const sess = sessRaw as unknown as SessionEmailRow | null;

  const adresse = sess?.adresse ?? {};
  const formationTitre = extractFormationTitre(sess?.formations ?? null);
  const creneaux = sess?.session_creneaux ?? [];
  const docs = (sess?.session_document_requests ?? []).map((d) => ({
    label: d.label,
    description: d.description ?? null,
    required: !!d.required,
  }));
  const adminDocsCount = (sess?.session_admin_documents ?? []).length;

  const input = {
    raisonSociale: inv.raison_sociale,
    contactNom: inv.contact_nom,
    formationTitre,
    creneaux,
    adresse,
    documentsAFournir: docs,
    documentsAdminCount: adminDocsCount,
    ctaUrl,
    ctaLabel: existingTyped ? 'Accéder à ma session' : 'Créer mon compte',
  };

  const html = opts.reminder
    ? renderSessionReservedReminder(input)
    : renderSessionReservedInvitation(input);
  const kind = opts.reminder ? 'session_reserved_reminder' : 'session_reserved_invitation';
  const subjectPrefix = opts.reminder ? 'Rappel — ' : '';

  await sendAndLog({
    kind,
    to: inv.email,
    subject: `${subjectPrefix}CKIM Formation — Une session est réservée pour ${inv.raison_sociale}`,
    html,
    refTable: 'session_invitations',
    refId: inv.id,
  });
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
  await sendInvitationEmail((inv as { session_id: string }).session_id, invitationId, { reminder: true });
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
