'use server';
import { devisSchema, type DevisInput } from '@/lib/validation/devis';
import { resend, EMAIL_FROM, EMAIL_TO } from '@/lib/email/resend';
import { devisEmailHtml, devisEmailSubject } from '@/lib/email/templates/devis';

export interface ActionResult {
  ok: boolean;
  errors?: Record<string, string>;
  message?: string;
}

export async function submitDevis(input: unknown): Promise<ActionResult> {
  const parsed = devisSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join('.')] = issue.message;
    }
    return { ok: false, errors };
  }
  const data: DevisInput = parsed.data;
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      replyTo: data.email,
      subject: devisEmailSubject(data),
      html: devisEmailHtml(data),
    });
    if (error) {
      console.error('[devis] resend error', error);
      return { ok: false, message: "Erreur d'envoi. Réessayez plus tard." };
    }
    return { ok: true, message: 'Demande envoyée. Réponse sous 24h.' };
  } catch (e) {
    console.error('[devis] unexpected', e);
    return { ok: false, message: "Erreur d'envoi. Réessayez plus tard." };
  }
}
