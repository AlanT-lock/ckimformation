'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
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
  const { error } = await supabase
    .from('sessions')
    .update({
      formation_id: input.formation_id,
      formateur_id: input.formateur_id,
      statut: input.statut,
      adresse: input.adresse,
      notes_internes: input.notes_internes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/sessions');
  revalidatePath(`/admin/sessions/${id}`);
  revalidatePath('/formations', 'layout');
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
