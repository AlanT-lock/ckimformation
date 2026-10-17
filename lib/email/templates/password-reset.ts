export function passwordResetEmailSubject(): string {
  return 'Réinitialisation de votre mot de passe — C-KIM Formation';
}

export function passwordResetEmailHtml(d: { resetUrl: string }): string {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Réinitialisation du mot de passe</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a1a1e;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(10,26,30,0.06);">
          <tr>
            <td style="background:#1B8FA0;padding:32px 32px 24px;color:#ffffff;">
              <p style="margin:0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;opacity:0.75;">C-KIM Formation</p>
              <h1 style="margin:8px 0 0;font-size:24px;font-weight:600;letter-spacing:0.02em;">Réinitialisation de votre mot de passe</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3b4548;">
                Vous avez demandé à réinitialiser le mot de passe de votre espace C-KIM Formation.
                Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${d.resetUrl}" style="display:inline-block;padding:14px 28px;background:#1B8FA0;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
                      Choisir un nouveau mot de passe
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#6b7479;">
                Ce lien est valable une seule fois et pendant une durée limitée. Si vous n'êtes pas à l'origine de
                cette demande, ignorez simplement cet email : votre mot de passe reste inchangé.
              </p>
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
