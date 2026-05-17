function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export interface EnqueteFroidEmailInput {
  prenom?: string | null;
  formationTitre: string;
  formationDate: string; // libellé date de fin formation (déjà formaté)
  enqueteUrl: string;
  isReminder: boolean;
  reminderNumber?: number;
}

export function enqueteFroidEmailHtml(d: EnqueteFroidEmailInput): string {
  const helloName = d.prenom ? escapeHtml(d.prenom) : 'Bonjour';
  const intro = d.isReminder
    ? `Nous n'avons pas encore reçu votre retour suite à la formation <strong>${escapeHtml(d.formationTitre)}</strong> dispensée ${escapeHtml(d.formationDate)}. Quelques minutes suffisent pour répondre — votre avis nous est précieux.`
    : `Il y a quelques semaines, vous avez suivi la formation <strong>${escapeHtml(d.formationTitre)}</strong>. Maintenant que vous avez eu le temps d'appliquer ce que vous avez appris, nous serions très reconnaissants d'avoir votre retour à froid.`;

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Votre retour sur la formation</title>
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
                ${d.isReminder ? 'Petit rappel — votre avis compte' : 'Votre retour à froid sur la formation'}
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;">${helloName},</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3b4548;">
                ${intro}
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3b4548;">
                Ce questionnaire évalue dans la durée l'apport réel de la formation : ce que vous avez retenu, ce que vous appliquez,
                ce qui pourrait être amélioré. Cela nous permet d'ajuster nos contenus pour les prochaines promotions.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${d.enqueteUrl}" style="display:inline-block;padding:14px 28px;background:#1B8FA0;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
                      Répondre à l'enquête (5 min)
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
              ${d.isReminder ? `<p style="margin:24px 0 0;font-size:13px;color:#9ba3a7;">Vous recevrez ce rappel toutes les deux semaines jusqu'à ce que vous ayez répondu — ou vous pouvez nous écrire pour vous désinscrire si vous ne souhaitez pas répondre.</p>` : ''}
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

export function enqueteFroidEmailSubject(formationTitre: string, isReminder: boolean): string {
  return isReminder
    ? `[C-KIM] Rappel — Votre retour sur ${formationTitre}`
    : `[C-KIM] Votre retour à froid — ${formationTitre}`;
}
