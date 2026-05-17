'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resend, EMAIL_FROM } from '@/lib/email/resend';
import {
  documentsSubmittedEmailHtml,
  documentsSubmittedEmailSubject,
} from '@/lib/email/templates/documents';
import { BUCKET_PAYER, deleteDocument } from '@/lib/storage/documents';

const ADMIN_EMAIL = 'contact@ckimformation.fr';

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

async function requirePayer(inscriptionId: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Non authentifié.');
  const supabase = await createClient();
  const { data: ins } = await supabase
    .from('inscriptions')
    .select('id, payer_profile_id, statut')
    .eq('id', inscriptionId)
    .single();
  if (!ins) throw new Error('Demande introuvable.');
  if (ins.payer_profile_id !== profile.id) throw new Error('Accès refusé.');
  return { profile, inscription: ins };
}

/**
 * Le payer décline un document (ne peut pas le fournir).
 */
export async function declineDocument(
  demandeId: string,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: 'Non authentifié.' };

  const r = reason.trim();
  if (r.length < 5) return { ok: false, error: 'Veuillez justifier (au moins 5 caractères).' };

  const admin = createAdminClient();
  const { data: demande } = await admin
    .from('inscription_document_demandes')
    .select('id, inscription_id, storage_path, inscription:inscriptions!inner(payer_profile_id)')
    .eq('id', demandeId)
    .single();
  if (!demande) return { ok: false, error: 'Document introuvable.' };
  const ins = Array.isArray(demande.inscription) ? demande.inscription[0] : demande.inscription;
  if (ins?.payer_profile_id !== profile.id) return { ok: false, error: 'Accès refusé.' };

  // Si un fichier était déjà uploadé, on le supprime
  if (demande.storage_path) {
    await deleteDocument(BUCKET_PAYER, demande.storage_path);
  }

  const { error } = await admin
    .from('inscription_document_demandes')
    .update({
      declined: true,
      decline_reason: r,
      storage_path: null,
      file_name: null,
      file_size: null,
      mime_type: null,
      uploaded_at: null,
    })
    .eq('id', demandeId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/stagiaire/inscriptions/${demande.inscription_id}`);
  return { ok: true };
}

/**
 * Annule un upload / déclin pour repartir à zéro sur un document.
 */
export async function clearDocumentResponse(
  demandeId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: 'Non authentifié.' };

  const admin = createAdminClient();
  const { data: demande } = await admin
    .from('inscription_document_demandes')
    .select('id, inscription_id, storage_path, inscription:inscriptions!inner(payer_profile_id)')
    .eq('id', demandeId)
    .single();
  if (!demande) return { ok: false, error: 'Document introuvable.' };
  const ins = Array.isArray(demande.inscription) ? demande.inscription[0] : demande.inscription;
  if (ins?.payer_profile_id !== profile.id) return { ok: false, error: 'Accès refusé.' };

  if (demande.storage_path) {
    await deleteDocument(BUCKET_PAYER, demande.storage_path);
  }
  const { error } = await admin
    .from('inscription_document_demandes')
    .update({
      declined: false,
      decline_reason: null,
      storage_path: null,
      file_name: null,
      file_size: null,
      mime_type: null,
      uploaded_at: null,
    })
    .eq('id', demandeId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/stagiaire/inscriptions/${demande.inscription_id}`);
  return { ok: true };
}

/**
 * Soumet définitivement la réponse aux documents.
 * Tous les docs doivent être soit uploadés, soit déclinés.
 * Statut → documents_recus. Email à l'admin.
 */
export async function submitDocumentResponses(
  inscriptionId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { profile } = await requirePayer(inscriptionId);
  const admin = createAdminClient();

  const { data: demandes } = await admin
    .from('inscription_document_demandes')
    .select('id, storage_path, declined')
    .eq('inscription_id', inscriptionId);

  if (!demandes || demandes.length === 0) {
    return { ok: false, error: 'Aucun document à soumettre.' };
  }
  const unanswered = demandes.filter((d) => !d.storage_path && !d.declined);
  if (unanswered.length > 0) {
    return {
      ok: false,
      error: `${unanswered.length} document${unanswered.length > 1 ? 's' : ''} ${unanswered.length > 1 ? 'doivent' : 'doit'} encore être traité${unanswered.length > 1 ? 's' : ''} (importer ou justifier).`,
    };
  }

  const { error: upErr } = await admin
    .from('inscriptions')
    .update({ statut: 'documents_recus' })
    .eq('id', inscriptionId);
  if (upErr) return { ok: false, error: upErr.message };

  // Email à l'admin
  try {
    const { data: ins } = await admin
      .from('inscriptions')
      .select(`
        payer_profile_id,
        session:sessions(formation:formations(titre)),
        payer:profiles!inscriptions_payer_profile_id_fkey(full_name, account_type)
      `)
      .eq('id', inscriptionId)
      .single();
    const sess = ins?.session && (Array.isArray(ins.session) ? ins.session[0] : ins.session);
    const formation = sess?.formation && (Array.isArray(sess.formation) ? sess.formation[0] : sess.formation);
    const payerInfo = ins?.payer && (Array.isArray(ins.payer) ? ins.payer[0] : ins.payer);
    let payerLabel = payerInfo?.full_name ?? 'Demandeur';
    if (payerInfo?.account_type === 'entreprise') {
      const { data: company } = await admin
        .from('company_details')
        .select('raison_sociale')
        .eq('profile_id', ins!.payer_profile_id)
        .maybeSingle();
      if (company?.raison_sociale) payerLabel = company.raison_sociale;
    }
    const uploadedCount = demandes.filter((d) => d.storage_path).length;
    const declinedCount = demandes.filter((d) => d.declined).length;

    await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: documentsSubmittedEmailSubject(payerLabel, formation?.titre ?? 'Formation'),
      html: documentsSubmittedEmailHtml({
        payerLabel,
        formationTitre: formation?.titre ?? 'Formation',
        uploadedCount,
        declinedCount,
        adminUrl: `${siteUrl()}/admin/demandes/${inscriptionId}`,
      }),
    });
  } catch (err) {
    console.error('[submitDocs] Email admin failed:', err);
  }

  revalidatePath(`/stagiaire/inscriptions/${inscriptionId}`);
  revalidatePath('/stagiaire/inscriptions');
  revalidatePath('/admin/demandes');
  revalidatePath(`/admin/demandes/${inscriptionId}`);
  return { ok: true };
}
