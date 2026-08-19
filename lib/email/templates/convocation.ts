import { formatDateLong } from '@/lib/date';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

const trimTime = (s: string) => s.slice(0, 5);

export interface ConvocationEmailInput {
  prenom: string;
  nom: string;
  formationTitre: string;
  lieu: string;
  creneaux: Array<{ date: string; heureDebut: string; heureFin: string }>;
}

export function convocationEmailSubject(formationTitre: string): string {
  return `[C-KIM] Convocation — ${formationTitre}`;
}

export function convocationEmailHtml(d: ConvocationEmailInput): string {
  const nomComplet = `${d.prenom} ${d.nom}`.trim();
  const lieu = d.lieu.trim() || 'Le lieu vous sera communiqué ultérieurement.';
  const planning = d.creneaux.length === 0
    ? '<li>Les horaires vous seront communiqués ultérieurement.</li>'
    : d.creneaux
      .map(
        (c) =>
          `<li>${escapeHtml(formatDateLong(c.date))} — ${escapeHtml(trimTime(c.heureDebut))} à ${escapeHtml(trimTime(c.heureFin))}</li>`
      )
      .join('');

  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#0f172a;">
  <h2 style="color:#1B8FA0;margin:0 0 16px;">Votre convocation</h2>
  <p style="margin:0 0 16px;">Bonjour ${escapeHtml(nomComplet)},</p>
  <p style="margin:0 0 16px;">
    Veuillez trouver ci-joint votre lettre de convocation à la formation
    <strong>${escapeHtml(d.formationTitre)}</strong>.
  </p>
  <p style="margin:0 0 8px;"><strong>Lieu :</strong> ${escapeHtml(lieu)}</p>
  <p style="margin:0 0 8px;"><strong>Planning :</strong></p>
  <ul style="margin:0 0 16px;padding-left:20px;">${planning}</ul>
  <p style="margin:0 0 16px;color:#475569;font-size:13px;">
    Merci de vous présenter quinze minutes avant le début de chaque créneau, muni(e) d’une pièce d’identité.
  </p>
  <p style="margin:24px 0 0;color:#475569;font-size:12px;">
    Une question ? Écrivez-nous à contact@ckimformation.fr ou appelez le 06 62 51 55 59.
  </p>
</div>`;
}
