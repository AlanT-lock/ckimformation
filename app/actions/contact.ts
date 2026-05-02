'use server';
import {
  contactEntrepriseSchema,
  contactParticulierSchema,
  type ContactEntrepriseInput,
  type ContactParticulierInput,
} from '@/lib/validation/contact';
import { resend, EMAIL_FROM, EMAIL_TO } from '@/lib/email/resend';
import {
  contactEntrepriseEmailHtml,
  contactParticulierEmailHtml,
  contactSubject,
} from '@/lib/email/templates/contact';
import type { ActionResult } from './devis';

export async function submitContactEntreprise(input: unknown): Promise<ActionResult> {
  const p = contactEntrepriseSchema.safeParse(input);
  if (!p.success) {
    const errors: Record<string, string> = {};
    for (const issue of p.error.issues) errors[issue.path.join('.')] = issue.message;
    return { ok: false, errors };
  }
  return sendContact(p.data, 'entreprise');
}

export async function submitContactParticulier(input: unknown): Promise<ActionResult> {
  const p = contactParticulierSchema.safeParse(input);
  if (!p.success) {
    const errors: Record<string, string> = {};
    for (const issue of p.error.issues) errors[issue.path.join('.')] = issue.message;
    return { ok: false, errors };
  }
  return sendContact(p.data, 'particulier');
}

async function sendContact(
  data: ContactEntrepriseInput | ContactParticulierInput,
  type: 'entreprise' | 'particulier'
): Promise<ActionResult> {
  try {
    const html = type === 'entreprise'
      ? contactEntrepriseEmailHtml(data as ContactEntrepriseInput)
      : contactParticulierEmailHtml(data as ContactParticulierInput);
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      replyTo: data.email,
      subject: contactSubject(type, data.nom),
      html,
    });
    if (error) {
      console.error('[contact] resend error', error);
      return { ok: false, message: "Erreur d'envoi. Réessayez plus tard." };
    }
    return { ok: true, message: 'Message envoyé. Réponse sous 24h.' };
  } catch (e) {
    console.error('[contact] unexpected', e);
    return { ok: false, message: "Erreur d'envoi. Réessayez plus tard." };
  }
}
