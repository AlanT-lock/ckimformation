function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export interface EnqueteFinanceurEmailInput {
  contactName?: string | null;
  raisonSociale?: string | null;
  formationTitre: string;
  formationDate: string; // libellé date de fin (déjà formaté)
  enqueteUrl: string;    // URL complète (avec token)
  isReminder: boolean;
  reminderNumber?: number;
}

export function enqueteFinanceurEmailHtml(d: EnqueteFinanceurEmailInput): string {
  const hello = d.contactName ? `Bonjour ${escapeHtml(d.contactName)},` : 'Bonjour,';
  const company = d.raisonSociale ? ` <strong>${escapeHtml(d.raisonSociale)}</strong>` : '';
  const intro = d.isReminder
    ? `Nous n'avons pas encore reçu votre retour suite à la formation <strong>${escapeHtml(d.formationTitre)}</strong> suivie par vos salariés${company ? ' chez' + company : ''} (terminée ${escapeHtml(d.formationDate)}). Votre avis en tant que financeur est important pour nous.`
    : `Vos salariés${company ? ' de' + company : ''} ont récemment suivi la formation <strong>${escapeHtml(d.formationTitre)}</strong> (terminée ${escapeHtml(d.formationDate)}). En tant que financeur, nous aimerions recueillir votre retour sur l'organisation et la qualité de la prestation.`;

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Enquête de satisfaction financeur — C-KIM Formation</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a1a1e;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(10,26,30,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:#1B8FA0;padding:32px 32px 24px;color:#ffffff;">
              <p style="margin:0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;opacity:0.75;">C-KIM Formation</p>
              <h1 style="margin:8px 0 0;font-size:24px;font-weight:600;letter-spacing:0.02em;">
                ${d.isReminder ? 'Rappel — Enquête financeur' : 'Enquête de satisfaction financeur'}
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;">${hello}</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3b4548;">
                ${intro}
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3b4548;">
                Quelques minutes suffisent pour répondre. Vous devrez vous connecter à votre espace
                entreprise pour accéder au questionnaire.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${d.enqueteUrl}" style="display:inline-block;padding:14px 28px;background:#1B8FA0;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
                      Répondre à l'enquête (3 min)
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#6b7479;">
                Si le bouton ne fonctionne pas, copiez-collez ce lien :
              </p>
              <p style="margin:0 0 24px;font-size:13px;color:#6b7479;word-break:break-all;">
                <a href="${d.enqueteUrl}" style="color:#1B8FA0;">${d.enqueteUrl}</a>
              </p>
              ${d.isReminder ? `<p style=\"margin:24px 0 0;font-size:13px;color:#9ba3a7;\">Ceci est notre ${d.reminderNumber === 2 ? 'dernier rappel' : 'premier rappel'}. Sans réponse, nous ne vous solliciterons plus à ce sujet.</p>` : ''}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f3f6f7;padding:20px 32px;border-top:1px solid #e3e8ea;">
              <p style="margin:0;font-size:12px;color:#9ba3a7;text-align:center;">
                C-KIM Formation — Organisme certifié Qualiopi<br />
                <a href="mailto:contact@ckimformation.fr" style="color:#1B8FA0;text-decoration:none;">contact@ckimformation.fr</a>
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

export function enqueteFinanceurEmailSubject(formationTitre: string, isReminder: boolean): string {
  return isReminder
    ? `[C-KIM] Rappel — Enquête financeur ${formationTitre}`
    : `[C-KIM] Enquête de satisfaction financeur — ${formationTitre}`;
}
