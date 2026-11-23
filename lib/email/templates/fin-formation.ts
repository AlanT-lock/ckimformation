import { KIND_LABEL, fmtIsoDate, type FinFormationKind } from '@/lib/fin-formation/model';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function periode(dateDebut: string | null, dateFin: string | null): string {
  if (!dateDebut) return '';
  if (!dateFin || dateFin === dateDebut) return ` du ${fmtIsoDate(dateDebut)}`;
  return ` du ${fmtIsoDate(dateDebut)} au ${fmtIsoDate(dateFin)}`;
}

function kindsList(kinds: FinFormationKind[]): string {
  return kinds.map((k) => `<li>${escapeHtml(KIND_LABEL[k])}</li>`).join('');
}

const FOOTER = `<p style="margin:24px 0 0;color:#475569;font-size:12px;">
    Une question ? Écrivez-nous à contact@ckimformation.fr ou appelez le 06 62 51 55 59.
  </p>`;

function button(href: string, label: string): string {
  return `<p style="margin:0 0 16px;">
    <a href="${escapeHtml(href)}" style="display:inline-block;background:#1B8FA0;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;">${escapeHtml(label)}</a>
  </p>`;
}

// -----------------------------------------------------------------------------
// E-mail au stagiaire : ses documents en pièces jointes
// -----------------------------------------------------------------------------

export interface FinFormationStagiaireEmailInput {
  prenom: string;
  formationTitre: string;
  dateDebut: string | null;
  dateFin: string | null;
  kinds: FinFormationKind[];
  /** Lien vers l'espace de formation, si le stagiaire a un compte. */
  espaceUrl: string | null;
}

export function finFormationStagiaireSubject(formationTitre: string): string {
  return `[C-KIM] Vos documents de fin de formation — ${formationTitre}`;
}

export function finFormationStagiaireHtml(d: FinFormationStagiaireEmailInput): string {
  const plural = d.kinds.length > 1;
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#0f172a;">
  <h2 style="color:#1B8FA0;margin:0 0 16px;">Vos documents de fin de formation</h2>
  <p style="margin:0 0 16px;">Bonjour ${escapeHtml(d.prenom || '')},</p>
  <p style="margin:0 0 16px;">
    Vous avez suivi la formation <strong>${escapeHtml(d.formationTitre)}</strong>${escapeHtml(periode(d.dateDebut, d.dateFin))}.
    Veuillez trouver ci-joint ${plural ? 'vos documents' : 'votre document'} de fin de formation :
  </p>
  <ul style="margin:0 0 16px;padding-left:20px;">${kindsList(d.kinds)}</ul>
  ${
    d.espaceUrl
      ? `<p style="margin:0 0 12px;">${plural ? 'Ils restent disponibles' : 'Il reste disponible'} à tout moment dans votre espace C-KIM :</p>
  ${button(d.espaceUrl, 'Accéder à mon espace')}`
      : ''
  }
  <p style="margin:0 0 16px;color:#475569;font-size:13px;">
    Conservez précieusement ${plural ? 'ces documents' : 'ce document'} : ${plural ? 'ils pourront' : 'il pourra'} vous être
    demandé${plural ? 's' : ''} par votre employeur ou un financeur.
  </p>
  ${FOOTER}
</div>`;
}

// -----------------------------------------------------------------------------
// E-mail récapitulatif à l'entreprise : documents de ses salariés
// -----------------------------------------------------------------------------

export interface FinFormationEntrepriseEmailInput {
  raisonSociale: string;
  formationTitre: string;
  dateDebut: string | null;
  dateFin: string | null;
  kinds: FinFormationKind[];
  stagiaires: string[];
  /** false si les PDF sont trop lourds pour être joints : espace uniquement. */
  attached: boolean;
  espaceUrl: string;
}

export function finFormationEntrepriseSubject(formationTitre: string): string {
  return `[C-KIM] Documents de fin de formation de vos salariés — ${formationTitre}`;
}

export function finFormationEntrepriseHtml(d: FinFormationEntrepriseEmailInput): string {
  const plural = d.stagiaires.length > 1;
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#0f172a;">
  <h2 style="color:#1B8FA0;margin:0 0 16px;">Documents de fin de formation</h2>
  <p style="margin:0 0 16px;">Bonjour,</p>
  <p style="margin:0 0 16px;">
    La formation <strong>${escapeHtml(d.formationTitre)}</strong>${escapeHtml(periode(d.dateDebut, d.dateFin))} est terminée.
    Les documents de fin de formation de ${plural ? 'vos salariés' : 'votre salarié(e)'}
    (${escapeHtml(d.raisonSociale)}) sont disponibles${d.attached ? ' et joints à cet e-mail' : ''} :
  </p>
  <ul style="margin:0 0 8px;padding-left:20px;">${kindsList(d.kinds)}</ul>
  <p style="margin:0 0 8px;"><strong>Salarié${plural ? 's' : ''} concerné${plural ? 's' : ''} :</strong></p>
  <ul style="margin:0 0 16px;padding-left:20px;">${d.stagiaires.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
  <p style="margin:0 0 12px;">Vous les retrouvez à tout moment dans votre espace entreprise :</p>
  ${button(d.espaceUrl, 'Voir les documents')}
  ${FOOTER}
</div>`;
}
