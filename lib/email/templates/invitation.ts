function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export interface InvitationEmailInput {
  prenom: string;
  nom: string;
  entrepriseLabel: string;
  formationTitre: string;
  invitationUrl: string;
  /** true si c'est un renvoi (auth user déjà créé), false si première invitation */
  isResend?: boolean;
}

export function invitationEmailHtml(d: InvitationEmailInput): string {
  const heading = d.isResend ? 'Nouveau lien d\'accès' : 'Votre accès à la formation';
  const intro = d.isResend
    ? `Nous vous renvoyons un lien d'accès pour finaliser votre compte. Il remplace le précédent (qui n'est plus valable).`
    : `${escapeHtml(d.entrepriseLabel)} vous a inscrit·e à la formation <strong>${escapeHtml(d.formationTitre)}</strong>. Pour pouvoir signer les émargements et compléter les questionnaires le jour de la formation, créez votre accès en cliquant ci-dessous.`;
  const ctaLabel = d.isResend ? 'Définir mon mot de passe' : 'Créer mon mot de passe';

  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#0f172a;">
  <h2 style="color:#1B8FA0;margin:0 0 16px;">${escapeHtml(heading)}</h2>
  <p style="margin:0 0 16px;">Bonjour ${escapeHtml(d.prenom)} ${escapeHtml(d.nom)},</p>
  <p style="margin:0 0 16px;">${intro}</p>

  ${!d.isResend ? `
  <p style="margin:0 0 16px;">
    Formation : <strong>${escapeHtml(d.formationTitre)}</strong>
  </p>
  ` : ''}

  <p style="margin:24px 0;">
    <a href="${d.invitationUrl}" style="display:inline-block;padding:12px 24px;background:#1B8FA0;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
      ${escapeHtml(ctaLabel)}
    </a>
  </p>

  <p style="margin:0 0 16px;color:#475569;font-size:13px;">
    Ce lien est strictement personnel et valable plusieurs heures. Vous serez invité·e à définir un mot de passe ;
    vous pourrez ensuite vous connecter avec votre email et ce mot de passe.
  </p>
  <p style="margin:24px 0 0;color:#475569;font-size:12px;">
    Une question ? Écrivez-nous à contact@ckimformation.fr.
  </p>
</div>`;
}

export function invitationEmailSubject(formationTitre: string, isResend = false): string {
  return isResend
    ? `[C-KIM] Nouveau lien d'accès — ${formationTitre}`
    : `[C-KIM] Créez votre accès — ${formationTitre}`;
}
