'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendAndLog } from '@/lib/email/log';
import { siteUrl } from '@/lib/site-url';
import { passwordResetEmailHtml, passwordResetEmailSubject } from '@/lib/email/templates/password-reset';

const THROTTLE_MS = 60_000;

/**
 * Lien de réinitialisation du mot de passe, valable sur n'importe quel appareil.
 *
 * Le lien envoyé contient un `token_hash` vérifié côté serveur par /callback
 * (verifyOtp, type « recovery ») qui crée la session avant d'afficher le
 * formulaire. Contrairement au flux PKCE du navigateur, il ne dépend pas du
 * navigateur où la demande a été faite (ex. lien ouvert depuis l'app mail du
 * téléphone).
 *
 * Réponse identique que le compte existe ou non (pas d'énumération des comptes).
 */
export async function requestPasswordReset(rawEmail: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Email invalide.' };

  const admin = createAdminClient();

  // Anti-abus : un email au plus par minute et par adresse
  const { data: recent } = await admin
    .from('email_logs')
    .select('sent_at')
    .eq('kind', 'password_reset')
    .eq('to_email', email)
    .eq('status', 'sent')
    .gte('sent_at', new Date(Date.now() - THROTTLE_MS).toISOString())
    .limit(1);
  if (recent && recent.length > 0) return { ok: true };

  const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email });
  const hashedToken = data?.properties?.hashed_token;
  if (error || !hashedToken) {
    // Compte inexistant ou erreur : on ne le révèle pas à l'utilisateur.
    if (error && !/not.*found|no user/i.test(error.message)) {
      console.error('[password-reset] generateLink failed', error.message);
    }
    return { ok: true };
  }

  const resetUrl = `${siteUrl()}/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`;
  const sent = await sendAndLog({
    kind: 'password_reset',
    to: email,
    toProfileId: data.user?.id ?? null,
    subject: passwordResetEmailSubject(),
    html: passwordResetEmailHtml({ resetUrl }),
  });
  if (!sent.ok) return { ok: false, error: "L'email n'a pas pu être envoyé. Réessayez dans un instant." };
  return { ok: true };
}
