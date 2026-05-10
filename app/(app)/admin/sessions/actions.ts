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
}

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Accès refusé');
  }
  return profile;
}

export async function createSession(input: SessionInput) {
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

  revalidatePath('/admin/sessions');
  // Site vitrine : la page de la formation pourrait afficher la session
  revalidatePath('/formations', 'layout');
  redirect(`/admin/sessions/${session.id}`);
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

export async function deleteSession(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) throw new Error(error.message);
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
