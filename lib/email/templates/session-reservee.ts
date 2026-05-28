import 'server-only';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

interface CreneauLite {
  date: string;
  heure_debut: string;
  heure_fin: string;
}

interface DocReqLite {
  label: string;
  description: string | null;
  required: boolean;
}

function creneauxRows(creneaux: CreneauLite[]): string {
  if (!creneaux || creneaux.length === 0) {
    return '<li>À préciser</li>';
  }
  return creneaux
    .map(
      (c) =>
        `<li>${escapeHtml(fmtDate(c.date))} — ${escapeHtml(c.heure_debut.slice(0, 5))} à ${escapeHtml(c.heure_fin.slice(0, 5))}</li>`
    )
    .join('');
}

function adresseLine(adresse: InvitationRenderInput['adresse']): string {
  if (!adresse) return 'À préciser';
  const parts = [
    adresse.rue,
    adresse.complement,
    [adresse.code_postal, adresse.ville].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');
  return parts || 'À préciser';
}

function documentsRows(docs: DocReqLite[]): string {
  if (!docs || docs.length === 0) return '';
  return docs
    .map((d) => {
      const required = d.required
        ? ' <span style="color:#DC2626;font-weight:600;">(obligatoire)</span>'
        : ' <span style="color:#475569;">(facultatif)</span>';
      const desc = d.description
        ? `<div style="color:#475569;font-size:13px;margin-top:2px;">${escapeHtml(d.description)}</div>`
        : '';
      return `<li style="margin-bottom:8px;"><strong>${escapeHtml(d.label)}</strong>${required}${desc}</li>`;
    })
    .join('');
}

export interface InvitationRenderInput {
  raisonSociale: string;
  contactNom: string | null;
  formationTitre: string;
  creneaux: CreneauLite[];
  adresse: { rue?: string; code_postal?: string; ville?: string; complement?: string };
  documentsAFournir: DocReqLite[];
  documentsAdminCount: number;
  ctaUrl: string;
  ctaLabel: string;
}

interface RenderOptions {
  heading: string;
  intro: string;
  /** Texte additionnel avant le bloc CTA (ex: rappel délais) */
  reminderNote?: string;
}

function renderSessionReservedShared(i: InvitationRenderInput, opts: RenderOptions): string {
  const greeting = i.contactNom
    ? `Bonjour ${escapeHtml(i.contactNom)},`
    : 'Bonjour,';

  const docsBlock = i.documentsAFournir && i.documentsAFournir.length > 0
    ? `<h3 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#475569;">Documents à nous transmettre</h3>
       <ul style="margin:0 0 16px;padding-left:18px;">${documentsRows(i.documentsAFournir)}</ul>`
    : '';

  const adminDocsBlock = i.documentsAdminCount > 0
    ? `<p style="margin:0 0 16px;">
         ${i.documentsAdminCount} document${i.documentsAdminCount > 1 ? 's' : ''} administratif${i.documentsAdminCount > 1 ? 's' : ''}
         (convention, programme, livret d'accueil, etc.) ${i.documentsAdminCount > 1 ? 'sont disponibles' : 'est disponible'} dans votre espace.
       </p>`
    : '';

  const reminderNoteBlock = opts.reminderNote
    ? `<div style="padding:12px;background:#FFF8E1;border-left:4px solid #F59E0B;border-radius:4px;margin:0 0 24px;">${escapeHtml(opts.reminderNote)}</div>`
    : '';

  return `<div style="font-family:system-ui,sans-serif;max-width:640px;margin:auto;color:#0f172a;">
  <h2 style="color:#1B8FA0;margin:0 0 8px;">${escapeHtml(opts.heading)}</h2>
  <p style="margin:0 0 16px;">${greeting}</p>
  <p style="margin:0 0 24px;">${opts.intro}</p>

  ${reminderNoteBlock}

  <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#475569;">Session</h3>
  <table style="width:100%;border-collapse:collapse;background:#EEF5F7;border-radius:8px;overflow:hidden;margin-bottom:24px;">
    <tr><td style="padding:6px 12px;font-weight:600;">Entreprise</td><td style="padding:6px 12px;">${escapeHtml(i.raisonSociale)}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:600;">Formation</td><td style="padding:6px 12px;">${escapeHtml(i.formationTitre)}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:600;">Lieu</td><td style="padding:6px 12px;">${escapeHtml(adresseLine(i.adresse))}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:600;vertical-align:top;">Créneaux</td><td style="padding:6px 12px;"><ul style="margin:0;padding-left:18px;">${creneauxRows(i.creneaux)}</ul></td></tr>
  </table>

  ${docsBlock}
  ${adminDocsBlock}

  <p style="margin:24px 0;">
    <a href="${i.ctaUrl}" style="display:inline-block;padding:12px 24px;background:#1B8FA0;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
      ${escapeHtml(i.ctaLabel)}
    </a>
  </p>

  <p style="margin:24px 0 0;color:#475569;font-size:13px;">
    Une question ? Écrivez-nous à contact@ckimformation.fr.
  </p>
</div>`;
}

export function renderSessionReservedInvitation(i: InvitationRenderInput): string {
  return renderSessionReservedShared(i, {
    heading: 'Votre session de formation est réservée',
    intro: `Nous vous confirmons la réservation d'une session de formation <strong>${escapeHtml(i.formationTitre)}</strong> pour <strong>${escapeHtml(i.raisonSociale)}</strong>. Pour finaliser l'organisation, merci de compléter votre dossier depuis votre espace dédié.`,
  });
}

export function renderSessionReservedPublished(i: InvitationRenderInput): string {
  return renderSessionReservedShared(i, {
    heading: 'Votre session est confirmée',
    intro: `Votre session de formation <strong>${escapeHtml(i.formationTitre)}</strong> pour <strong>${escapeHtml(i.raisonSociale)}</strong> est désormais publiée et confirmée. Voici le récapitulatif des informations importantes.`,
  });
}

export function renderSessionReservedReminder(i: InvitationRenderInput): string {
  return renderSessionReservedShared(i, {
    heading: 'Rappel : documents à transmettre',
    intro: `Nous revenons vers vous concernant votre session de formation <strong>${escapeHtml(i.formationTitre)}</strong> pour <strong>${escapeHtml(i.raisonSociale)}</strong>. Certains documents nécessaires à la tenue de la session restent à nous transmettre.`,
    reminderNote: "Merci de bien vouloir compléter votre dossier dans les meilleurs délais afin de garantir le bon déroulement de la formation.",
  });
}

export interface CompletedRenderInput {
  raisonSociale: string;
  formationTitre: string;
  adminUrl: string;
}

export function renderSessionReservedCompleted(i: CompletedRenderInput): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:640px;margin:auto;color:#0f172a;">
  <h2 style="color:#1B8FA0;margin:0 0 8px;">Dossier complété — session prête à publier</h2>
  <p style="margin:0 0 24px;color:#475569;">L'entreprise a finalisé la préparation de sa session. Le dossier est prêt pour vérification et publication.</p>

  <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#475569;">Session</h3>
  <table style="width:100%;border-collapse:collapse;background:#EEF5F7;border-radius:8px;overflow:hidden;margin-bottom:24px;">
    <tr><td style="padding:6px 12px;font-weight:600;">Entreprise</td><td style="padding:6px 12px;">${escapeHtml(i.raisonSociale)}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:600;">Formation</td><td style="padding:6px 12px;">${escapeHtml(i.formationTitre)}</td></tr>
  </table>

  <p style="margin:24px 0;">
    <a href="${i.adminUrl}" style="display:inline-block;padding:10px 18px;background:#1B8FA0;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Ouvrir la session dans l'espace admin</a>
  </p>
</div>`;
}
