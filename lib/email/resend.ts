import 'server-only';
import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  // On ne crash plus au chargement du module : les routes/actions tournent
  // même sans Resend configuré ; les envois retournent une erreur ciblée.
  console.warn('[resend] RESEND_API_KEY non défini — les envois d\'emails échoueront silencieusement.');
}

export const resend = new Resend(apiKey || 're_missing_key_placeholder');

export const EMAIL_TO = process.env.CONTACT_EMAIL_TO || 'contact@ckimformation.fr';
export const EMAIL_FROM = process.env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev';
