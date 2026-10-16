function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export interface JourneeTermineeEmailInput {
  formationTitre: string;
  dateLabel: string; // ex. « lundi 12 octobre 2026 »
  competencesDuJour: string[];
  percent: number;
  /** Nombre de commentaires du formateur sur les salariés de cette entreprise */
  commentairesCount: number;
  hasCommentaireGeneral: boolean;
  suiviUrl: string;
}

export function journeeTermineeEmailSubject(formationTitre: string, dateLabel: string): string {
  return `${formationTitre} : la journée du ${dateLabel} est terminée`;
}

export function journeeTermineeEmailHtml(d: JourneeTermineeEmailInput): string {
  const competences = d.competencesDuJour.length > 0
    ? `<ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.6;color:#3b4548;">${d.competencesDuJour
        .map((c) => `<li>${escapeHtml(c)}</li>`)
        .join('')}</ul>`
    : '';
  const notes: string[] = [];
  if (d.hasCommentaireGeneral) notes.push('un commentaire du formateur sur la journée');
  if (d.commentairesCount > 0) {
    notes.push(`${d.commentairesCount} commentaire${d.commentairesCount > 1 ? 's' : ''} sur vos salariés`);
  }
  const notesHtml = notes.length > 0
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3b4548;">Vous y trouverez aussi ${notes.join(' et ')}.</p>`
    : '';

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Suivi de formation</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a1a1e;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(10,26,30,0.06);">
          <tr>
            <td style="background:#1B8FA0;padding:32px 32px 24px;color:#ffffff;">
              <p style="margin:0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;opacity:0.75;">C-KIM Formation · Suivi de formation</p>
              <h1 style="margin:8px 0 0;font-size:24px;font-weight:600;letter-spacing:0.02em;">Une journée de plus de terminée !</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3b4548;">
                La journée du <strong>${escapeHtml(d.dateLabel)}</strong> de la formation
                <strong>${escapeHtml(d.formationTitre)}</strong> suivie par vos salariés est terminée.
              </p>
              ${d.competencesDuJour.length > 0
                ? `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#3b4548;">Compétences travaillées aujourd'hui :</p>${competences}`
                : ''}
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3b4548;">
                Avancée de la formation : <strong>${d.percent} %</strong>.
              </p>
              ${notesHtml}
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${d.suiviUrl}" style="display:inline-block;padding:14px 28px;background:#1B8FA0;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
                      Voir le suivi de la formation
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7479;">
                Une question ? Écrivez-nous à <a href="mailto:contact@ckimformation.fr" style="color:#1B8FA0;">contact@ckimformation.fr</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
