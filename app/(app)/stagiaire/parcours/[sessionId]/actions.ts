'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';

interface ParticipantContext {
  inscriptionId: string;
  inscriptionParticipantId: string;
}

async function findParticipantContext(sessionId: string): Promise<ParticipantContext> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'stagiaire') throw new Error('Accès refusé.');
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from('inscription_participants')
    .select(`
      id, inscription_id, participant_profile_id,
      inscription:inscriptions!inner(id, session_id, statut),
      employee:employees(profile_id)
    `)
    .eq('inscription.session_id', sessionId)
    .eq('inscription.statut', 'confirmee');

  const me = (rows ?? []).find((p) => {
    const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
    return p.participant_profile_id === profile.id || emp?.profile_id === profile.id;
  });
  if (!me) throw new Error("Vous n'êtes pas participant·e à cette session.");

  return { inscriptionId: me.inscription_id, inscriptionParticipantId: me.id };
}

export interface ResponseInput {
  question_id: string;
  valeur?: string | null;
  valeur_json?: unknown;
}

export async function submitTestResponses(
  sessionId: string,
  testId: string,
  responses: ResponseInput[]
) {
  const ctx = await findParticipantContext(sessionId);
  const supabase = await createClient();

  // 1) Créer (ou réutiliser) la complétion
  const { data: existing } = await supabase
    .from('test_completions')
    .select('id, completed_at')
    .eq('inscription_participant_id', ctx.inscriptionParticipantId)
    .eq('test_id', testId)
    .maybeSingle();

  let completionId: string;
  if (existing) {
    if (existing.completed_at) throw new Error('Vous avez déjà complété ce test.');
    completionId = existing.id;
  } else {
    const { data, error } = await supabase
      .from('test_completions')
      .insert({
        inscription_id: ctx.inscriptionId,
        inscription_participant_id: ctx.inscriptionParticipantId,
        test_id: testId,
      })
      .select('id')
      .single();
    if (error || !data) throw new Error(error?.message ?? 'Création échouée');
    completionId = data.id;
  }

  // 2) Insérer les réponses
  const rows = responses.map((r) => ({
    completion_id: completionId,
    question_id: r.question_id,
    valeur: r.valeur ?? null,
    valeur_json: r.valeur_json ?? null,
  }));
  const { error: errRes } = await supabase.from('responses').upsert(rows, {
    onConflict: 'completion_id,question_id',
  });
  if (errRes) throw new Error(errRes.message);

  // 3) Marquer comme complété
  await supabase
    .from('test_completions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', completionId);

  revalidatePath('/stagiaire/parcours');
}
