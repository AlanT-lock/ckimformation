'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export interface AnswerInput {
  question_id: string;
  valeur?: string | null;
  valeur_json?: unknown;
}

/**
 * Soumission de l'enquête financeur — sans connexion : le token identifie
 * l'inscription (et donc l'entreprise payeuse). Valable jusqu'à la réponse.
 */
export async function submitEnqueteFinanceur(
  token: string,
  answers: AnswerInput[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data: envoi, error: envoiErr } = await admin
    .from('enquete_financeur_envois')
    .select('id, test_id, inscription_id, responded_at')
    .eq('token', token)
    .single();

  if (envoiErr || !envoi) return { ok: false, error: 'Lien introuvable.' };

  if (envoi.responded_at) return { ok: false, error: 'Vous avez déjà répondu à cette enquête.' };

  const nowIso = new Date().toISOString();
  const { data: completion, error: cErr } = await admin
    .from('test_completions')
    .insert({
      test_id: envoi.test_id,
      inscription_id: envoi.inscription_id,
      started_at: nowIso,
      completed_at: nowIso,
    })
    .select('id')
    .single();

  if (cErr || !completion) {
    console.error('[enquete-financeur] insert completion failed', cErr);
    return { ok: false, error: cErr?.message ?? 'Erreur création complétion.' };
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
      console.error('[enquete-financeur] insert responses failed', rErr);
      // Sans ce rollback, la complétion orpheline bloquerait un nouvel envoi.
      await admin.from('test_completions').delete().eq('id', completion.id);
      return { ok: false, error: "Vos réponses n'ont pas pu être enregistrées. Merci de réessayer." };
    }
  }

  const { error: uErr } = await admin
    .from('enquete_financeur_envois')
    .update({ responded_at: nowIso, completion_id: completion.id })
    .eq('id', envoi.id);
  if (uErr) console.error('[enquete-financeur] update envoi failed', uErr);

  return { ok: true };
}
