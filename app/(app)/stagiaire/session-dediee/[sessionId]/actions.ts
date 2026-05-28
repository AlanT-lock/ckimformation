'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

async function requireEtabOnSession(sessionId: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Non authentifié');
  const sb = await createClient();
  const { data: s } = await sb
    .from('sessions')
    .select('reserved_company_id')
    .eq('id', sessionId)
    .single();
  if (!s || (s as { reserved_company_id: string | null }).reserved_company_id !== profile.id) {
    throw new Error('Accès refusé');
  }
  return { profile, sb };
}

export async function saveAnalyseBesoins(sessionId: string, analyse: string) {
  const { sb } = await requireEtabOnSession(sessionId);
  await sb
    .from('session_reserved_details')
    .upsert({
      session_id: sessionId,
      analyse_besoins: analyse,
      updated_at: new Date().toISOString(),
    });
  revalidatePath(`/stagiaire/session-dediee/${sessionId}`);
}

export async function inscrireStagiaire(sessionId: string, profileId: string) {
  const { profile, sb } = await requireEtabOnSession(sessionId);
  await sb.from('inscriptions').insert({
    session_id: sessionId,
    payer_profile_id: profile.id,
    participant_profile_id: profileId,
    statut: 'confirmee',
  });
  revalidatePath(`/stagiaire/session-dediee/${sessionId}`);
}

export async function creerEtInscrireStagiaire(
  sessionId: string,
  payload: { full_name: string; email: string },
) {
  const { profile, sb } = await requireEtabOnSession(sessionId);
  const { data: newP, error } = await sb
    .from('profiles')
    .insert({
      role: 'stagiaire',
      account_type: 'particulier',
      full_name: payload.full_name,
      email: payload.email,
      employer_profile_id: profile.id,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  const newProfileId = (newP as { id: string }).id;
  await sb.from('inscriptions').insert({
    session_id: sessionId,
    payer_profile_id: profile.id,
    participant_profile_id: newProfileId,
    statut: 'confirmee',
  });
  revalidatePath(`/stagiaire/session-dediee/${sessionId}`);
}

export async function uploadDocumentRequest(
  sessionId: string,
  requestId: string,
  formData: FormData,
) {
  const { profile, sb } = await requireEtabOnSession(sessionId);
  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('Fichier manquant');
  const path = `${sessionId}/${requestId}/${crypto.randomUUID()}-${file.name}`;
  const { error: upErr } = await sb.storage
    .from('session-etab-uploads')
    .upload(path, file);
  if (upErr) throw new Error(upErr.message);
  await sb.from('session_document_uploads').insert({
    request_id: requestId,
    session_id: sessionId,
    storage_path: path,
    filename: file.name,
    uploaded_by: profile.id,
  });
  revalidatePath(`/stagiaire/session-dediee/${sessionId}`);
}

export async function finaliserSession(sessionId: string) {
  const { sb } = await requireEtabOnSession(sessionId);
  await sb
    .from('session_reserved_details')
    .update({ completed_at: new Date().toISOString() })
    .eq('session_id', sessionId);
  // Admin notification handled in Task 12.
  revalidatePath(`/stagiaire/session-dediee/${sessionId}`);
}
