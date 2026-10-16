'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export interface AnswerInput {
  question_id: string;
  valeur?: string | null;
  valeur_json?: unknown;
}

export async function submitEnqueteFroid(
  token: string,
  answers: AnswerInput[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const { data: envoi, error: envoiErr } = await admin
    .from('enquete_froid_envois')
    .select('id, test_id, inscription_participant_id, responded_at')
    .eq('token', token)
    .single();

  if (envoiErr || !envoi) return { ok: false, error: 'Lien introuvable.' };
  if (envoi.responded_at) return { ok: false, error: 'Vous avez déjà répondu à cette enquête.' };

  // test_completions.inscription_id est NOT NULL : on le récupère via le participant.
  const { data: participant } = await admin
    .from('inscription_participants')
    .select('id, inscription_id')
    .eq('id', envoi.inscription_participant_id)
    .maybeSingle();
  if (!participant?.inscription_id) {
    console.error('[enquete-froid] participant introuvable', envoi.inscription_participant_id);
    return { ok: false, error: 'Inscription introuvable pour cette enquête.' };
  }

  const nowIso = new Date().toISOString();

  // Réponse déjà enregistrée pour ce participant et ce test (ex. remplie depuis
  // son espace) : on clôt l'envoi au lieu d'échouer sur la contrainte d'unicité.
  const { data: existing } = await admin
    .from('test_completions')
    .select('id, completed_at')
    .eq('inscription_participant_id', envoi.inscription_participant_id)
    .eq('test_id', envoi.test_id)
    .maybeSingle();
  if (existing?.completed_at) {
    await admin.from('enquete_froid_envois').update({ responded_at: existing.completed_at }).eq('id', envoi.id);
    return { ok: false, error: 'Vous avez déjà répondu à cette enquête.' };
  }
  if (existing) {
    // Complétion inachevée : on la remplace par la nouvelle réponse.
    await admin.from('test_completions').delete().eq('id', existing.id);
  }

  // Crée la complétion + réponses (bypass RLS via admin client)
  const { data: completion, error: cErr } = await admin
    .from('test_completions')
    .insert({
      test_id: envoi.test_id,
      inscription_id: participant.inscription_id,
      inscription_participant_id: envoi.inscription_participant_id,
      started_at: nowIso,
      completed_at: nowIso,
    })
    .select('id')
    .single();

  if (cErr || !completion) {
    console.error('[enquete-froid] insert completion failed', cErr);
    return { ok: false, error: "Vos réponses n'ont pas pu être enregistrées. Merci de réessayer." };
  }

  if (answers.length > 0) {
    const rows = answers.map((a) => ({
      completion_id: completion.id,
      question_id: a.question_id,
      valeur: a.valeur ?? null,
      valeur_json: a.valeur_json ?? null,
    }));
    const { error: rErr } = await admin.from('responses').insert(rows);
    if (rErr) {
      console.error('[enquete-froid] insert responses failed', rErr);
      // Sans ce rollback, la complétion orpheline bloquerait tout nouvel envoi
      // (contrainte unique participant × test).
      await admin.from('test_completions').delete().eq('id', completion.id);
      return { ok: false, error: "Vos réponses n'ont pas pu être enregistrées. Merci de réessayer." };
    }
  }

  // Marque l'envoi comme répondu
  const { error: uErr } = await admin
    .from('enquete_froid_envois')
    .update({ responded_at: nowIso })
    .eq('id', envoi.id);
  if (uErr) {
    console.error('[enquete-froid] update envoi failed', uErr);
  }

  return { ok: true };
}
