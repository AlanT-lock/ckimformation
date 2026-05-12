function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function wrapper(title: string, headerLabel: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a1a1e;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(10,26,30,0.06);">
        <tr><td style="background:#1B8FA0;padding:28px 32px 22px;color:#ffffff;">
          <p style="margin:0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;opacity:0.75;">C-KIM Formation</p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;">${escapeHtml(headerLabel)}</h1>
        </td></tr>
        <tr><td style="padding:28px 32px;">${bodyHtml}</td></tr>
        <tr><td style="background:#f3f6f7;padding:18px 32px;border-top:1px solid #e3e8ea;">
          <p style="margin:0;font-size:12px;color:#9ba3a7;text-align:center;">
            C-KIM Formation — Organisme certifié Qualiopi<br />
            <a href="mailto:ckimsecuriteformation@gmail.com" style="color:#1B8FA0;text-decoration:none;">ckimsecuriteformation@gmail.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function ctaButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td align="center">
      <a href="${href}" style="display:inline-block;padding:14px 28px;background:#1B8FA0;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`;
}

// -----------------------------------------------------------------------------
// 1. Admin → payer : "On vous demande des documents"
// -----------------------------------------------------------------------------
export interface DocumentsRequestedEmailInput {
  prenom: string;
  formationTitre: string;
  documentNames: string[];
  url: string;
}

export function documentsRequestedEmailHtml(d: DocumentsRequestedEmailInput): string {
  const list = d.documentNames
    .map((n) => `<li style="margin:4px 0;">${escapeHtml(n)}</li>`)
    .join('');
  const body = `
    <p style="margin:0 0 16px;font-size:15px;">Bonjour ${escapeHtml(d.prenom)},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3b4548;">
      Pour finaliser votre demande d'inscription à la formation <strong>${escapeHtml(d.formationTitre)}</strong>,
      nous avons besoin des documents suivants :
    </p>
    <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.6;color:#0a1a1e;">
      ${list}
    </ul>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#3b4548;">
      Vous pouvez importer ces documents depuis votre espace personnel en cliquant sur le bouton ci-dessous.
      Si un document ne s'applique pas à votre situation, vous pourrez le justifier.
    </p>
    ${ctaButton('Accéder à ma demande', d.url)}
    <p style="margin:0;font-size:13px;color:#6b7479;">
      Une question ? Répondez à ce mail ou contactez-nous au 06 62 51 55 59.
    </p>`;
  return wrapper(`Documents demandés — ${d.formationTitre}`, 'Documents à transmettre', body);
}

export function documentsRequestedEmailSubject(formationTitre: string): string {
  return `[C-KIM] Documents demandés — ${formationTitre}`;
}

// -----------------------------------------------------------------------------
// 2. Payer → admin : "Les documents ont été envoyés"
// -----------------------------------------------------------------------------
export interface DocumentsSubmittedEmailInput {
  payerLabel: string;
  formationTitre: string;
  uploadedCount: number;
  declinedCount: number;
  adminUrl: string;
}

export function documentsSubmittedEmailHtml(d: DocumentsSubmittedEmailInput): string {
  const body = `
    <p style="margin:0 0 16px;font-size:15px;">
      <strong>${escapeHtml(d.payerLabel)}</strong> a répondu à votre demande de documents pour la formation
      <strong>${escapeHtml(d.formationTitre)}</strong>.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f3f6f7;border-radius:8px;padding:16px;margin-bottom:24px;">
      <tr><td style="font-size:14px;color:#0a1a1e;">
        ${d.uploadedCount > 0 ? `<div>📎 ${d.uploadedCount} document${d.uploadedCount > 1 ? 's' : ''} importé${d.uploadedCount > 1 ? 's' : ''}</div>` : ''}
        ${d.declinedCount > 0 ? `<div style="margin-top:6px;">⚠️ ${d.declinedCount} document${d.declinedCount > 1 ? 's' : ''} non transmis (justification fournie)</div>` : ''}
      </td></tr>
    </table>
    ${ctaButton('Consulter la demande', d.adminUrl)}`;
  return wrapper(`Documents reçus — ${d.formationTitre}`, 'Réponse à votre demande', body);
}

export function documentsSubmittedEmailSubject(payerLabel: string, formationTitre: string): string {
  return `[C-KIM] Documents reçus — ${payerLabel} — ${formationTitre}`;
}
