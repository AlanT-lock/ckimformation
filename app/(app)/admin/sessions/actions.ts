'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendAndLog } from '@/lib/email/log';
import { renderSessionReservedPublished } from '@/lib/email/templates/session-reservee';
import type { SessionStatut, SessionAdresse } from '@/lib/supabase/types';

export interface CreneauInput {
  date: string;
  heure_debut: string;
  heure_fin: string;
}

export interface SessionInput {
  formation_id: string;
  formateur_id: string | null;
  statut: SessionStatut;
  adresse: SessionAdresse;
  notes_internes: string | null;
  creneaux: CreneauInput[];
  visibility?: 'public' | 'reserved';
  reserved_company_id?: string | null;
  invitation?: {
    email: string;
    raison_sociale: string;
    siret?: string | null;
    contact_nom?: string | null;
    contact_fonction?: string | null;
    contact_phone?: string | null;
  } | null;
  document_requests?: Array<{ label: string; description?: string; required: boolean }>;
}

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Accès refusé');
  }
  return profile;
}

export async function createSession(input: SessionInput): Promise<{ id: string }> {
  const profile = await requireAdmin();
  const supabase = await createClient();

  if (input.creneaux.length === 0) {
    throw new Error('Au moins un créneau est requis.');
  }

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      formation_id: input.formation_id,
      formateur_id: input.formateur_id,
      statut: input.statut,
      adresse: input.adresse,
      notes_internes: input.notes_internes,
      created_by: profile.id,
    })
    .select('id')
    .single();

  if (error || !session) throw new Error(error?.message ?? 'Création échouée');

  const creneauxRows = input.creneaux.map((c, idx) => ({
    session_id: session.id,
    ordre: idx + 1,
    date: c.date,
    heure_debut: c.heure_debut,
    heure_fin: c.heure_fin,
  }));

  const { error: errCre } = await supabase.from('session_creneaux').insert(creneauxRows);
  if (errCre) {
    // rollback simple : on supprime la session créée
    await supabase.from('sessions').delete().eq('id', session.id);
    throw new Error('Erreur sur les créneaux : ' + errCre.message);
  }

  if (input.visibility === 'reserved') {
    if (!input.reserved_company_id && !input.invitation) {
      throw new Error('Une session réservée nécessite un établissement existant ou une invitation.');
    }
    if (input.reserved_company_id && input.invitation) {
      throw new Error('Choisir soit un établissement existant, soit une invitation, pas les deux.');
    }

    await supabase
      .from('sessions')
      .update({
        visibility: 'reserved',
        reserved_company_id: input.reserved_company_id ?? null,
      })
      .eq('id', session.id);

    await supabase.from('session_reserved_details').insert({ session_id: session.id });

    if (input.document_requests?.length) {
      await supabase.from('session_document_requests').insert(
        input.document_requests.map((d, i) => ({
          session_id: session.id,
          ordre: i,
          label: d.label,
          description: d.description ?? null,
          required: d.required,
        })),
      );
    }

    if (input.invitation) {
      const { createInvitationForSession, sendInvitationEmail } = await import('./reservation-actions');
      const inv = await createInvitationForSession(session.id, input.invitation);
      if (input.statut === 'published') {
        await sendInvitationEmail(session.id, inv.id);
      }
    }
  }

  revalidatePath('/admin/sessions');
  // Site vitrine : la page de la formation pourrait afficher la session
  revalidatePath('/formations', 'layout');
  return { id: session.id };
}

export async function updateSession(id: string, input: Omit<SessionInput, 'creneaux'>) {
  await requireAdmin();
  const supabase = await createClient();

  // Read previous state to detect draft -> published transition on reserved sessions
  const { data: prevRaw } = await supabase
    .from('sessions')
    .select('statut, visibility, reserved_company_id')
    .eq('id', id)
    .single();
  const prev = prevRaw as {
    statut: string | null;
    visibility: string | null;
    reserved_company_id: string | null;
  } | null;

  // Detect reserved -> public transition; block if data exists, otherwise clear reserved fields
  const willGoPublic =
    input.visibility === 'public' && prev?.visibility === 'reserved';
  const updatePayload: Record<string, unknown> = {
    formation_id: input.formation_id,
    formateur_id: input.formateur_id,
    statut: input.statut,
    adresse: input.adresse,
    notes_internes: input.notes_internes,
    updated_at: new Date().toISOString(),
  };

  if (input.visibility !== undefined) {
    updatePayload.visibility = input.visibility;
  }
  if (input.reserved_company_id !== undefined) {
    updatePayload.reserved_company_id = input.reserved_company_id;
  }

  if (willGoPublic) {
    const { count: inscCount, error: inscErr } = await supabase
      .from('inscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', id);
    if (inscErr) throw new Error(inscErr.message);

    const { data: claimedInvs, error: invErr } = await supabase
      .from('session_invitations')
      .select('id')
      .eq('session_id', id)
      .not('claimed_by', 'is', null)
      .limit(1);
    if (invErr) throw new Error(invErr.message);

    if ((inscCount ?? 0) > 0 || (claimedInvs?.length ?? 0) > 0) {
      throw new Error(
        'Impossible de rendre publique : la session a déjà des inscriptions ou une invitation acceptée.',
      );
    }

    updatePayload.reserved_company_id = null;

    // Clean up unclaimed invitations
    await supabase
      .from('session_invitations')
      .delete()
      .eq('session_id', id)
      .is('claimed_by', null);
  }

  const { error } = await supabase
    .from('sessions')
    .update(updatePayload)
    .eq('id', id);
  if (error) throw new Error(error.message);

  // Detect public -> reserved transition; ensure session_reserved_details row exists
  const willGoReserved =
    input.visibility === 'reserved' && prev?.visibility !== 'reserved';
  if (willGoReserved) {
    const { data: existingSrd } = await supabase
      .from('session_reserved_details')
      .select('session_id')
      .eq('session_id', id)
      .maybeSingle();
    if (!existingSrd) {
      await supabase.from('session_reserved_details').insert({ session_id: id });
    }
  }

  // Trigger emails on draft -> published for reserved sessions
  const wasDraft = prev?.statut === 'draft';
  const nowPublished = input.statut === 'published';
  const isReserved = prev?.visibility === 'reserved';
  if (wasDraft && nowPublished && isReserved) {
    try {
      const reservedCompanyId = prev?.reserved_company_id ?? null;
      if (reservedCompanyId) {
        await sendReservedPublishedEmail(id, reservedCompanyId);
      } else {
        const admin = createAdminClient();
        const { data: invs } = await admin
          .from('session_invitations')
          .select('id')
          .eq('session_id', id)
          .is('claimed_by', null)
          .limit(1);
        const invId = (invs as { id: string }[] | null)?.[0]?.id;
        if (invId) {
          const { sendInvitationEmail } = await import('./reservation-actions');
          await sendInvitationEmail(id, invId);
        }
      }
    } catch (e) {
      console.error('[updateSession] reserved email send failed', e);
    }
  }

  revalidatePath('/admin/sessions');
  revalidatePath(`/admin/sessions/${id}`);
  revalidatePath('/formations', 'layout');
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

async function sendReservedPublishedEmail(sessionId: string, companyProfileId: string) {
  const admin = createAdminClient();

  const { data: profileRaw } = await admin
    .from('profiles')
    .select('id, email, full_name, account_type')
    .eq('id', companyProfileId)
    .single();
  const profile = profileRaw as {
    id: string;
    email: string | null;
    full_name: string | null;
    account_type: string | null;
  } | null;
  if (!profile || !profile.email) return;

  const { data: companyRaw } = await admin
    .from('company_details')
    .select('raison_sociale')
    .eq('profile_id', companyProfileId)
    .maybeSingle();
  const company = companyRaw as { raison_sociale: string | null } | null;

  const { data: sessRaw } = await admin
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

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ckim-formation.fr';
  const raisonSociale = company?.raison_sociale ?? profile.full_name ?? '';

  const html = renderSessionReservedPublished({
    raisonSociale,
    contactNom: profile.full_name ?? null,
    formationTitre,
    creneaux,
    adresse,
    documentsAFournir: docs,
    documentsAdminCount: adminDocsCount,
    ctaUrl: `${baseUrl}/stagiaire/session-dediee/${sessionId}`,
    ctaLabel: 'Accéder à ma session',
  });

  await sendAndLog({
    kind: 'session_reserved_published',
    to: profile.email,
    toProfileId: companyProfileId,
    subject: `CKIM Formation — Votre session est confirmée`,
    html,
    refTable: 'sessions',
    refId: sessionId,
  });
}

export type DeleteSessionResult = { ok: true } | { ok: false; error: string };

export async function deleteSession(id: string): Promise<DeleteSessionResult> {
  await requireAdmin();
  const supabase = await createClient();

  // Pré-check : inscriptions liées (FK ON DELETE RESTRICT côté BDD)
  const { count, error: countErr } = await supabase
    .from('inscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', id);
  if (countErr) return { ok: false, error: countErr.message };
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error:
        `Impossible de supprimer cette session : ${count} inscription(s) ou demande(s) y sont liée(s). ` +
        `Annulez la session (statut « Annulée ») ou supprimez d'abord les inscriptions.`,
    };
  }

  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/sessions');
  revalidatePath('/formations', 'layout');
  redirect('/admin/sessions');
}

export async function addCreneau(sessionId: string, input: CreneauInput) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: max } = await supabase
    .from('session_creneaux')
    .select('ordre')
    .eq('session_id', sessionId)
    .order('ordre', { ascending: false })
    .limit(1);
  const nextOrdre = (max?.[0]?.ordre ?? 0) + 1;
  const { error } = await supabase.from('session_creneaux').insert({
    session_id: sessionId,
    ordre: nextOrdre,
    date: input.date,
    heure_debut: input.heure_debut,
    heure_fin: input.heure_fin,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/sessions/${sessionId}`);
  revalidatePath('/formations', 'layout');
}

export async function deleteCreneau(creneauId: string, sessionId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('session_creneaux').delete().eq('id', creneauId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/sessions/${sessionId}`);
  revalidatePath('/formations', 'layout');
}
