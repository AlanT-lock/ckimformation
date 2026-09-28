'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

export interface ResponseInput {
  question_id: string;
  valeur?: string | null;
  valeur_json?: unknown;
}

export type SubmitEvaluationResult = { ok: true } | { ok: false; error: string };

// Les erreurs levées dans une Server Action sont masquées en production par
// un message générique : on renvoie donc un résultat explicite au formulaire.
class EvaluationError extends Error {}

async function requireFormateurOfSession(sessionId: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new EvaluationError('Accès refusé.');
  if (profile.role !== 'formateur' && profile.role !== 'admin') throw new EvaluationError('Accès refusé.');
  const supabase = await createClient();
  const { data: session } = await supabase
    .from('sessions')
    .select('id, formateur_id')
    .eq('id', sessionId)
    .single();
  if (!session) throw new EvaluationError('Session introuvable.');
  if (profile.role === 'formateur' && session.formateur_id !== profile.id) {
    throw new EvaluationError('Vous n\'êtes pas le formateur de cette session.');
  }
  return { profile, supabase };
}

export async function submitFormateurEvaluation(
  sessionId: string,
  testId: string,
  inscriptionParticipantId: string,
  responses: ResponseInput[]
): Promise<SubmitEvaluationResult> {
  try {
    await saveFormateurEvaluation(sessionId, testId, inscriptionParticipantId, responses);
    return { ok: true };
  } catch (err) {
    if (err instanceof EvaluationError) return { ok: false, error: err.message };
    console.error('[evaluation-formateur] enregistrement impossible', err);
    return { ok: false, error: "L'évaluation n'a pas pu être enregistrée. Réessayez ou contactez l'administration." };
  }
}

async function saveFormateurEvaluation(
  sessionId: string,
  testId: string,
  inscriptionParticipantId: string,
  responses: ResponseInput[]
) {
  const { profile, supabase } = await requireFormateurOfSession(sessionId);

  // Vérifier que le test est bien de kind evaluation_formateur
  const { data: test } = await supabase
    .from('tests')
    .select('id, kind')
    .eq('id', testId)
    .single();
  if (!test || test.kind !== 'evaluation_formateur') {
    throw new EvaluationError('Ce test n\'est pas une évaluation formateur.');
  }

  // Récupérer inscription_id à partir de inscription_participant
  const { data: ip } = await supabase
    .from('inscription_participants')
    .select('id, inscription_id, inscription:inscriptions!inner(session_id)')
    .eq('id', inscriptionParticipantId)
    .single();
  if (!ip) throw new EvaluationError('Stagiaire introuvable.');
  const ins = Array.isArray(ip.inscription) ? ip.inscription[0] : ip.inscription;
  if (ins?.session_id !== sessionId) {
    throw new EvaluationError('Stagiaire hors de cette session.');
  }

  // Trouver ou créer la complétion
  const { data: existing, error: exErr } = await supabase
    .from('test_completions')
    .select('id')
    .eq('inscription_participant_id', inscriptionParticipantId)
    .eq('test_id', testId)
    .maybeSingle();
  if (exErr) throw new Error(exErr.message);

  let completionId: string;
  if (existing) {
    completionId = existing.id;
    const { error: upErr } = await supabase
      .from('test_completions')
      .update({ filled_by_formateur_id: profile.id })
      .eq('id', completionId);
    if (upErr) throw new Error(upErr.message);
  } else {
    const { data, error } = await supabase
      .from('test_completions')
      .insert({
        inscription_id: ip.inscription_id,
        inscription_participant_id: inscriptionParticipantId,
        test_id: testId,
        filled_by_formateur_id: profile.id,
      })
      .select('id')
      .single();
    if (error || !data) throw new Error(error?.message ?? 'Création échouée');
    completionId = data.id;
  }

  // Upsert des réponses
  const rows = responses.map((r) => ({
    completion_id: completionId,
    question_id: r.question_id,
    valeur: r.valeur ?? null,
    valeur_json: r.valeur_json ?? null,
  }));
  if (rows.length > 0) {
    const { error: errRes } = await supabase.from('responses').upsert(rows, {
      onConflict: 'completion_id,question_id',
    });
    if (errRes) throw new Error(errRes.message);
  }

  // Marquer comme complété
  const { error: doneErr } = await supabase
    .from('test_completions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', completionId);
  if (doneErr) throw new Error(doneErr.message);

  revalidatePath(`/formateur/sessions/${sessionId}/evaluations`);
  revalidatePath(`/formateur/sessions/${sessionId}/evaluations/${testId}`);
}
