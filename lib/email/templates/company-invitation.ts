function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export interface CompanyInvitationEmailInput {
  contactNom: string;
  raisonSociale: string;
  invitationUrl: string;
  /** true si renvoi (compte auth déjà créé) */
  isResend?: boolean;
}

export function companyInvitationEmailHtml(d: CompanyInvitationEmailInput): string {
  const heading = d.isResend ? "Nouveau lien d'accès" : 'Votre espace entreprise C-KIM Formation';
  const intro = d.isResend
    ? "Nous vous renvoyons un lien pour activer l'espace de votre entreprise. Il remplace le précédent (qui n'est plus valable)."
    : `C-KIM Formation a créé l'espace entreprise de <strong>${escapeHtml(d.raisonSociale)}</strong>. Vérifiez vos informations et définissez votre mot de passe pour gérer vos salariés et suivre vos inscriptions aux formations.`;
  const ctaLabel = d.isResend ? 'Définir mon mot de passe' : 'Créer mon mot de passe';

  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#0f172a;">
  <h2 style="color:#1B8FA0;margin:0 0 16px;">${escapeHtml(heading)}</h2>
  <p style="margin:0 0 16px;">Bonjour ${escapeHtml(d.contactNom)},</p>
  <p style="margin:0 0 16px;">${intro}</p>
  <p style="margin:24px 0;">
    <a href="${d.invitationUrl}" style="display:inline-block;padding:12px 24px;background:#1B8FA0;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
      ${escapeHtml(ctaLabel)}
    </a>
  </p>
  <p style="margin:0 0 16px;color:#475569;font-size:13px;">
    Ce lien est strictement personnel et valable plusieurs heures. Vous pourrez ensuite vous connecter avec votre email et ce mot de passe.
  </p>
  <p style="margin:24px 0 0;color:#475569;font-size:12px;">
    Une question ? Écrivez-nous à contact@ckimformation.fr.
  </p>
</div>`;
}

export function companyInvitationEmailSubject(raisonSociale: string, isResend = false): string {
  return isResend
    ? `[C-KIM] Nouveau lien d'accès — ${raisonSociale}`
    : `[C-KIM] Activez l’espace entreprise de ${raisonSociale}`;
}
