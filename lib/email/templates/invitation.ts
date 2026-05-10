function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export interface InvitationEmailInput {
  prenom: string;
  nom: string;
  entrepriseLabel: string;
  formationTitre: string;
  invitationUrl: string;
}

export function invitationEmailHtml(d: InvitationEmailInput): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#0f172a;">
  <h2 style="color:#1B8FA0;margin:0 0 16px;">Votre accès à la formation</h2>
  <p style="margin:0 0 16px;">Bonjour ${escapeHtml(d.prenom)} ${escapeHtml(d.nom)},</p>
  <p style="margin:0 0 16px;">
    ${escapeHtml(d.entrepriseLabel)} vous a inscrit·e à la formation
    <strong>${escapeHtml(d.formationTitre)}</strong>. Pour pouvoir signer les émargements et compléter les questionnaires
    le jour de la formation, créez votre accès en cliquant ci-dessous.
  </p>

  <p style="margin:24px 0;">
    <a href="${d.invitationUrl}" style="display:inline-block;padding:12px 24px;background:#1B8FA0;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
      Créer mon mot de passe
    </a>
  </p>

  <p style="margin:0 0 16px;color:#475569;font-size:13px;">
    Ce lien est strictement personnel. Vous serez invité·e à définir un mot de passe ; vous pourrez ensuite vous connecter
    avec votre email et ce mot de passe.
  </p>
  <p style="margin:24px 0 0;color:#475569;font-size:12px;">
    Une question ? Écrivez-nous à ckimsecuriteformation@gmail.com.
  </p>
</div>`;
}

export function invitationEmailSubject(formationTitre: string): string {
  return `[C-KIM] Créez votre accès — ${formationTitre}`;
}
