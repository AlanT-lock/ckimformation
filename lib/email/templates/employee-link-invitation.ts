function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export interface EmployeeLinkInvitationEmailInput {
  prenom: string;
  nom: string;
  entrepriseLabel: string;
  invitationUrl: string;
}

export function employeeLinkInvitationEmailHtml(d: EmployeeLinkInvitationEmailInput): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#0f172a;">
  <h2 style="color:#1B8FA0;margin:0 0 16px;">Rattachement à votre entreprise</h2>
  <p style="margin:0 0 16px;">Bonjour ${escapeHtml(d.prenom)} ${escapeHtml(d.nom)},</p>
  <p style="margin:0 0 16px;">
    <strong>${escapeHtml(d.entrepriseLabel)}</strong> souhaite rattacher votre compte C-KIM Formation
    à son espace entreprise, pour que vous puissiez accéder aux sessions auxquelles vous êtes inscrit·e
    (émargements, tests, questionnaires).
  </p>
  <p style="margin:0 0 16px;">
    Vous avez déjà un compte : il n’est pas nécessaire d’en créer un autre.
    Cliquez ci-dessous, puis connectez-vous avec <strong>la même adresse email</strong> que celle-ci.
  </p>
  <p style="margin:24px 0;">
    <a href="${escapeHtml(d.invitationUrl)}" style="display:inline-block;padding:12px 24px;background:#1B8FA0;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
      Rattacher mon compte
    </a>
  </p>
  <p style="margin:0 0 16px;color:#475569;font-size:13px;">
    Ce lien est personnel et valable 14 jours. Si vous n’êtes pas à l’origine de cette demande,
    vous pouvez ignorer cet email.
  </p>
  <p style="margin:24px 0 0;color:#475569;font-size:12px;">
    Une question ? Écrivez-nous à contact@ckimformation.fr.
  </p>
</div>`;
}

export function employeeLinkInvitationEmailSubject(entrepriseLabel: string): string {
  return `[C-KIM] ${entrepriseLabel} souhaite rattacher votre compte`;
}
