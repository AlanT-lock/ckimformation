import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { resend, EMAIL_FROM } from './resend';

export type EmailLogKind =
  | 'enquete_froid'
  | 'enquete_financeur'
  | 'session_reserved_invitation'
  | 'session_reserved_published'
  | 'session_reserved_completed'
  | 'session_reserved_reminder'
  | 'convocation'
  | 'employee_link_invitation'
  | 'company_invitation'
  | 'employee_account_invitation';

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendAndLogInput {
  kind: EmailLogKind;
  to: string;
  subject: string;
  html: string;
  /** Profil destinataire si connu (permet retrouver les logs depuis sa fiche). */
  toProfileId?: string | null;
  /** Référence à la table de tracking d'envoi pour audit. */
  refTable?: string;
  refId?: string;
  isReminder?: boolean;
  reminderNumber?: number;
  /** Métadonnées libres (formation, raison sociale, etc.). */
  metadata?: Record<string, unknown>;
  attachments?: EmailAttachment[];
}

/**
 * Envoie un email via Resend ET l'insère dans email_logs pour traçabilité.
 * Renvoie `{ ok: true }` si Resend a accepté, `{ ok: false, error }` sinon.
 * Dans les deux cas un log est écrit (status='sent' ou 'failed').
 */
export async function sendAndLog(input: SendAndLogInput): Promise<{ ok: true } | { ok: false; error: string }> {
  let status: 'sent' | 'failed' = 'sent';
  let errorMessage: string | null = null;

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      ...(input.attachments && input.attachments.length > 0
        ? {
            attachments: input.attachments.map((a) => ({
              filename: a.filename,
              content: a.content,
              contentType: a.contentType,
            })),
          }
        : {}),
    });
    if (error) {
      status = 'failed';
      errorMessage = typeof error === 'string' ? error : ((error as { message?: string }).message ?? JSON.stringify(error));
    }
  } catch (err) {
    status = 'failed';
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  // Log (même en cas d'échec — pour visibilité)
  try {
    const admin = createAdminClient();
    await admin.from('email_logs').insert({
      kind: input.kind,
      to_email: input.to,
      to_profile_id: input.toProfileId ?? null,
      subject: input.subject,
      status,
      error_message: errorMessage,
      ref_table: input.refTable ?? null,
      ref_id: input.refId ?? null,
      is_reminder: input.isReminder ?? false,
      reminder_number: input.reminderNumber ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (logErr) {
    // Ne pas casser l'envoi si le log échoue, mais le signaler
    console.error('[email-log] insert failed', logErr);
  }

  if (status === 'sent') return { ok: true };
  return { ok: false, error: errorMessage ?? 'unknown error' };
}
