'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/supabase/server';
import { sendAndLog } from '@/lib/email/log';
import { convocationEmailHtml, convocationEmailSubject } from '@/lib/email/templates/convocation';
import { renderConvocationPdf } from '@/lib/pdf/render-convocation';

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Accès refusé');
  }
  return profile;
}

export type SendConvocationResult =
  | { ok: true }
  | { ok: false; error: string; skipped?: boolean };

async function sendOne(sessionId: string, participantId: string): Promise<SendConvocationResult> {
  const rendered = await renderConvocationPdf(sessionId, participantId);
  if (!rendered) return { ok: false, error: 'Participant introuvable' };

  const to = rendered.email.trim();
  if (!to) {
    return { ok: false, error: 'Email manquant', skipped: true };
  }

  const html = convocationEmailHtml({
    prenom: rendered.data.stagiaire.prenom,
    nom: rendered.data.stagiaire.nom,
    formationTitre: rendered.formationTitre,
    lieu: rendered.lieu,
    creneaux: rendered.data.creneaux,
  });

  const sent = await sendAndLog({
    kind: 'convocation',
    to,
    subject: convocationEmailSubject(rendered.formationTitre),
    html,
    toProfileId: rendered.profileId,
    refTable: 'inscription_participants',
    refId: participantId,
    metadata: { sessionId, formationTitre: rendered.formationTitre },
    attachments: [
      {
        filename: rendered.filename,
        content: rendered.buffer,
        contentType: 'application/pdf',
      },
    ],
  });

  if (!sent.ok) return { ok: false, error: sent.error };
  return { ok: true };
}

export async function sendConvocation(
  sessionId: string,
  participantId: string
): Promise<SendConvocationResult> {
  await requireAdmin();
  const result = await sendOne(sessionId, participantId);
  revalidatePath(`/admin/sessions/${sessionId}`);
  return result;
}

export interface SendConvocationsBatchResult {
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export async function sendConvocations(
  sessionId: string,
  participantIds: string[]
): Promise<SendConvocationsBatchResult> {
  await requireAdmin();
  const result: SendConvocationsBatchResult = {
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  for (const id of participantIds) {
    const one = await sendOne(sessionId, id);
    if (one.ok) {
      result.sent += 1;
    } else if (one.skipped) {
      result.skipped += 1;
      result.errors.push(one.error);
    } else {
      result.failed += 1;
      result.errors.push(one.error);
    }
  }

  revalidatePath(`/admin/sessions/${sessionId}`);
  return result;
}
