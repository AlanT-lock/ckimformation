import type { RecommendationItem, RelanceContext } from '@/lib/recommendations/engine';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  );
}

const PARCOURS_COLORS: Record<string, string> = {
  securite: '#1B8FA0',
  alimentaire: '#2E9E6A',
  prevention: '#C4532A',
  management: '#6A4ABE',
  formateurs: '#E8692A',
  developpement: '#2A7E9E',
  qualite: '#2A5E9E',
  certifiant: '#9E7A2A',
};

interface Params {
  context: RelanceContext;
  firstName: string;
  items: RecommendationItem[];
  siteUrl: string;
  unsubscribeUrl: string;
}

const INTROS: Record<RelanceContext, { eyebrow: string; title: string; intro: string; cta: string }> = {
  bimestrielle: {
    eyebrow: 'Recommandation bimestrielle',
    title: 'Trois formations sélectionnées pour vous.',
    intro:
      "Voici les formations qui pourraient compléter votre parcours ou celui de votre équipe, sélectionnées en fonction de votre profil.",
    cta: 'Voir le catalogue complet',
  },
  annuelle: {
    eyebrow: 'Plan de formation 2026',
    title: 'Anticipez votre plan de formation.',
    intro:
      "Le début d'année est le bon moment pour planifier la montée en compétence de votre équipe. Voici trois formations à envisager pour les prochains mois.",
    cta: 'Voir le catalogue complet',
  },
  recyclage: {
    eyebrow: 'Échéance de recyclage',
    title: 'Votre certificat arrive à échéance.',
    intro:
      "Pour rester en conformité réglementaire, votre certificat doit être recyclé. Voici la session de recyclage à programmer dès maintenant.",
    cta: 'Réserver une session',
  },
};

const REASON_LABEL: Record<RecommendationItem['reason'], string> = {
  recyclage: 'Recyclage à programmer',
  suite: 'Pour aller plus loin',
  complementaire: 'Complémentaire',
  secteur: 'Adapté à votre secteur',
  transversale: 'Formation populaire',
};

export function buildRelanceSubject(ctx: RelanceContext, firstName: string): string {
  switch (ctx) {
    case 'bimestrielle':
      return `${firstName}, 3 formations à découvrir chez C-KIM Formation`;
    case 'annuelle':
      return `${firstName}, votre plan de formation 2026`;
    case 'recyclage':
      return `${firstName}, votre certificat arrive à échéance`;
  }
}

export function buildRelanceHtml(params: Params): string {
  const { context, firstName, items, siteUrl, unsubscribeUrl } = params;
  const t = INTROS[context];

  const cards = items.map((item) => itemCard(item, siteUrl)).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(t.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(10,26,30,0.08);">

          <!-- Logo -->
          <tr>
            <td style="padding:32px 32px 8px;border-top:3px solid #1B8FA0;">
              <img src="${siteUrl}/logo-ckim.png" alt="C-KIM Formation" width="160" style="display:block;border:0;outline:none;text-decoration:none;height:auto;width:160px;" />
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#1B8FA0;font-weight:600;">${escapeHtml(t.eyebrow)}</p>
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;font-weight:600;color:#0a0a0a;">${escapeHtml(t.title)}</h1>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.55;color:#444;">Bonjour ${escapeHtml(firstName || 'à vous')},</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#444;">${escapeHtml(t.intro)}</p>
            </td>
          </tr>

          ${cards}

          <!-- CTA -->
          <tr>
            <td style="padding:24px 32px 8px;text-align:center;">
              <a href="${siteUrl}/formations" style="display:inline-block;background:#1B8FA0;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(t.cta)}</a>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:24px;"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #eaecee;background:#fafbfc;font-size:12px;line-height:1.6;color:#888;">
              <p style="margin:0 0 8px;">
                <strong>C-KIM Formation</strong> — Centre de formation certifié Qualiopi<br />
                391 avenue du Maréchal Koenig, 83300 Draguignan<br />
                <a href="tel:0662515559" style="color:#1B8FA0;text-decoration:none;">06 62 51 55 59</a> ·
                <a href="mailto:ckimsecuriteformation@gmail.com" style="color:#1B8FA0;text-decoration:none;">ckimsecuriteformation@gmail.com</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#aaa;">
                Vous recevez ce message car vous avez un compte sur ckimformation.fr.
                <a href="${unsubscribeUrl}" style="color:#888;text-decoration:underline;">Se désabonner</a>.
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

function itemCard(item: RecommendationItem, siteUrl: string): string {
  const f = item.formation;
  const color = PARCOURS_COLORS[f.parcours] ?? '#1B8FA0';
  const reasonLabel = REASON_LABEL[item.reason];

  // Note spécifique au recyclage
  const recyclageNote =
    item.reason === 'recyclage' && item.days_until_expiry !== undefined
      ? `<p style="margin:8px 0 0;font-size:13px;color:#E8692A;font-weight:600;">⚠ Échéance dans ${item.days_until_expiry} jour${item.days_until_expiry > 1 ? 's' : ''}.</p>`
      : '';

  return `
  <tr>
    <td style="padding:8px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #eaecee;border-radius:8px;border-left:3px solid ${color};">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 6px;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:${color};font-weight:700;">${escapeHtml(reasonLabel)}</p>
            <h2 style="margin:0 0 4px;font-size:18px;line-height:1.3;font-weight:600;color:#0a0a0a;">
              ${escapeHtml(f.titre)}${f.sousTitre ? `<br/><span style="font-size:14px;font-weight:400;color:#666;">${escapeHtml(f.sousTitre)}</span>` : ''}
            </h2>
            <p style="margin:8px 0 0;font-size:13px;color:#666;">
              ${escapeHtml(f.infosPratiques.duree || '')}${f.infosPratiques.public ? ' · ' + escapeHtml(f.infosPratiques.public) : ''}
            </p>
            <p style="margin:12px 0 0;font-size:14px;line-height:1.5;color:#444;">
              ${escapeHtml(truncate(f.objectifs, 180))}
            </p>
            ${recyclageNote}
            <p style="margin:14px 0 0;">
              <a href="${siteUrl}/formations/${f.slug}" style="display:inline-block;color:${color};text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Découvrir →</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
}
