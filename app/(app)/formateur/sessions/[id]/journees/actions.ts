'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDateLong, todayIsoParis } from '@/lib/date';
import { canCloseDay, isSessionEditable, sessionDays, sessionProgress } from '@/lib/suivi/progress';
import { loadRattachedParticipants } from '@/lib/suivi/data';
import { sendAndLog } from '@/lib/email/log';
import { journeeTermineeEmailHtml, journeeTermineeEmailSubject } from '@/lib/email/templates/journee-terminee';
import { siteUrl } from '@/lib/site-url';

type Result = { ok: true } | { ok: false; error: string };

/**
 * Contrôle : formateur de la session (ou admin), session modifiable, journée
 * appartenant à la session et déjà commencée (heure de Paris).
 */
async function guard(sessionId: string, date: string) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== 'formateur' && profile.role !== 'admin')) {
    return { ok: false as const, error: 'Accès refusé.' };
  }
  const admin = createAdminClient();
  const { data: session } = await admin
    .from('sessions')
    .select('id, statut, formateur_id, formation_id, formation:formations(titre), creneaux:session_creneaux(date)')
    .eq('id', sessionId)
    .maybeSingle();
  if (!session) return { ok: false as const, error: 'Session introuvable.' };
  if (profile.role === 'formateur' && session.formateur_id !== profile.id) {
    return { ok: false as const, error: 'Accès refusé.' };
  }
  if (!isSessionEditable(session.statut)) {
    return { ok: false as const, error: 'La session est terminée : les journées ne sont plus modifiables.' };
  }
  const days = sessionDays((session.creneaux ?? []) as Array<{ date: string }>);
  if (!days.includes(date)) return { ok: false as const, error: 'Cette date ne fait pas partie de la session.' };
  if (!canCloseDay(date, todayIsoParis())) {
    return { ok: false as const, error: 'Cette journée n\'a pas encore commencé.' };
  }
  return { ok: true as const, profile, session, days, admin };
}

/**
 * Étape 1 : marque la journée comme terminée et enregistre les compétences vues
 * ce jour-là. Une compétence déjà vue un autre jour est ignorée.
 */
export async function saveJourneeCompetences(
  sessionId: string,
  date: string,
  competenceIds: string[]
): Promise<Result> {
  const g = await guard(sessionId, date);
  if (!g.ok) return g;
  const { admin, profile, session } = g;

  const nowIso = new Date().toISOString();
  const { data: existing } = await admin
    .from('session_journees')
    .select('id, terminee_at')
    .eq('session_id', sessionId)
    .eq('date', date)
    .maybeSingle();

  let journeeId = existing?.id;
  if (!journeeId) {
    const { data: created, error } = await admin
      .from('session_journees')
      .insert({ session_id: sessionId, date, terminee_at: nowIso, terminee_by: profile.id, updated_at: nowIso })
      .select('id')
      .single();
    if (error || !created) return { ok: false, error: error?.message ?? 'Enregistrement impossible.' };
    journeeId = created.id;
  } else {
    const patch: Record<string, unknown> = { updated_at: nowIso };
    if (!existing?.terminee_at) {
      patch.terminee_at = nowIso;
      patch.terminee_by = profile.id;
    }
    await admin.from('session_journees').update(patch).eq('id', journeeId);
  }

  // Compétences valides de la formation
  const { data: formationCompetences } = await admin
    .from('formation_competences')
    .select('id')
    .eq('formation_id', session.formation_id);
  const valid = new Set((formationCompetences ?? []).map((c) => c.id));
  const wanted = new Set(competenceIds.filter((id) => valid.has(id)));

  const { data: vues } = await admin
    .from('session_competences_vues')
    .select('id, competence_id, journee_id')
    .eq('session_id', sessionId);
  const toDelete = (vues ?? []).filter((v) => v.journee_id === journeeId && !wanted.has(v.competence_id));
  const alreadySeen = new Set((vues ?? []).map((v) => v.competence_id));
  const toInsert = [...wanted].filter((id) => !alreadySeen.has(id));

  if (toDelete.length > 0) {
    const { error } = await admin.from('session_competences_vues').delete().in('id', toDelete.map((v) => v.id));
    if (error) return { ok: false, error: error.message };
  }
  if (toInsert.length > 0) {
    const { error } = await admin
      .from('session_competences_vues')
      .insert(toInsert.map((competence_id) => ({ session_id: sessionId, competence_id, journee_id: journeeId })));
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/formateur/sessions/${sessionId}`);
  return { ok: true };
}

/**
 * Étape 2 : commentaire général + commentaires par stagiaire rattaché à une
 * entreprise (vides = supprimés). Envoie le récap aux entreprises une seule fois.
 */
export async function saveJourneeCommentaires(
  sessionId: string,
  date: string,
  commentaireGeneral: string,
  commentaires: Record<string, string>
): Promise<Result> {
  const g = await guard(sessionId, date);
  if (!g.ok) return g;
  const { admin, session, days } = g;

  const { data: journee } = await admin
    .from('session_journees')
    .select('id, email_sent_at')
    .eq('session_id', sessionId)
    .eq('date', date)
    .maybeSingle();
  if (!journee) return { ok: false, error: 'Validez d\'abord les compétences de la journée.' };

  const general = commentaireGeneral.trim();
  const nowIso = new Date().toISOString();
  const { error: gErr } = await admin
    .from('session_journees')
    .update({ commentaire_general: general || null, updated_at: nowIso })
    .eq('id', journee.id);
  if (gErr) return { ok: false, error: gErr.message };

  // Seuls les stagiaires rattachés à une entreprise peuvent être commentés
  const rattaches = await loadRattachedParticipants(sessionId);
  const allowed = new Set(rattaches.map((p) => p.id));
  const toUpsert: Array<{ journee_id: string; inscription_participant_id: string; commentaire: string; updated_at: string }> = [];
  const toDelete: string[] = [];
  for (const [participantId, text] of Object.entries(commentaires)) {
    if (!allowed.has(participantId)) continue;
    const value = text.trim();
    if (value) toUpsert.push({ journee_id: journee.id, inscription_participant_id: participantId, commentaire: value, updated_at: nowIso });
    else toDelete.push(participantId);
  }
  if (toUpsert.length > 0) {
    const { error } = await admin
      .from('session_journee_commentaires')
      .upsert(toUpsert, { onConflict: 'journee_id,inscription_participant_id' });
    if (error) return { ok: false, error: error.message };
  }
  if (toDelete.length > 0) {
    await admin
      .from('session_journee_commentaires')
      .delete()
      .eq('journee_id', journee.id)
      .in('inscription_participant_id', toDelete);
  }

  if (!journee.email_sent_at) {
    await sendJourneeRecap({
      sessionId,
      journeeId: journee.id,
      date,
      days,
      formationId: session.formation_id,
      formationTitre: (Array.isArray(session.formation) ? session.formation[0] : session.formation)?.titre ?? 'Formation',
      hasCommentaireGeneral: !!general,
      rattaches,
    });
  }

  revalidatePath(`/formateur/sessions/${sessionId}`);
  return { ok: true };
}

/** Récap envoyé à chaque entreprise ayant des salariés dans la session. */
async function sendJourneeRecap(input: {
  sessionId: string;
  journeeId: string;
  date: string;
  days: string[];
  formationId: string;
  formationTitre: string;
  hasCommentaireGeneral: boolean;
  rattaches: Awaited<ReturnType<typeof loadRattachedParticipants>>;
}) {
  const admin = createAdminClient();
  const payerIds = Array.from(new Set(input.rattaches.map((p) => p.payerProfileId)));
  if (payerIds.length === 0) {
    await admin.from('session_journees').update({ email_sent_at: new Date().toISOString() }).eq('id', input.journeeId);
    return;
  }

  const [{ data: payers }, { data: competencesTotal }, { data: vues }, { data: journees }, { data: commentaires }] =
    await Promise.all([
      admin.from('profiles').select('id, email').in('id', payerIds),
      admin.from('formation_competences').select('id').eq('formation_id', input.formationId),
      admin
        .from('session_competences_vues')
        .select('journee_id, competence:formation_competences(libelle, ordre)')
        .eq('session_id', input.sessionId),
      admin.from('session_journees').select('id, terminee_at').eq('session_id', input.sessionId),
      admin
        .from('session_journee_commentaires')
        .select('inscription_participant_id')
        .eq('journee_id', input.journeeId),
    ]);

  const competencesDuJour = (vues ?? [])
    .filter((v) => v.journee_id === input.journeeId)
    .map((v) => (Array.isArray(v.competence) ? v.competence[0] : v.competence) as { libelle: string; ordre: number } | null)
    .filter((c): c is { libelle: string; ordre: number } => !!c)
    .sort((a, b) => a.ordre - b.ordre)
    .map((c) => c.libelle);
  const { percent } = sessionProgress({
    competencesTotal: competencesTotal?.length ?? 0,
    competencesVues: vues?.length ?? 0,
    journeesTotal: input.days.length,
    journeesTerminees: (journees ?? []).filter((j) => j.terminee_at).length,
  });
  const commented = new Set((commentaires ?? []).map((c) => c.inscription_participant_id));
  const dateLabel = formatDateLong(input.date);
  const suiviUrl = `${siteUrl()}/stagiaire/suivi/${input.sessionId}`;

  for (const payer of payers ?? []) {
    if (!payer.email) continue;
    const commentairesCount = input.rattaches.filter((p) => p.payerProfileId === payer.id && commented.has(p.id)).length;
    await sendAndLog({
      kind: 'journee_terminee',
      to: payer.email,
      toProfileId: payer.id,
      subject: journeeTermineeEmailSubject(input.formationTitre, dateLabel),
      html: journeeTermineeEmailHtml({
        formationTitre: input.formationTitre,
        dateLabel,
        competencesDuJour,
        percent,
        commentairesCount,
        hasCommentaireGeneral: input.hasCommentaireGeneral,
        suiviUrl,
      }),
      refTable: 'session_journees',
      refId: input.journeeId,
      metadata: { sessionId: input.sessionId, date: input.date },
    });
  }
  await admin.from('session_journees').update({ email_sent_at: new Date().toISOString() }).eq('id', input.journeeId);
}
