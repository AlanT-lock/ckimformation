import type { DevisInput } from '@/lib/validation/devis';

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export function devisEmailHtml(data: DevisInput): string {
  const rows: [string, string | undefined][] = [
    ['Formation', data.formation],
    ['Nom', data.nom],
    ['Email', data.email],
    ['Téléphone', data.telephone],
    ['Entreprise', data.entreprise],
    ['Nb stagiaires estimé', data.nbStagiaires],
    ['Lieu', data.lieu],
    ['Dates souhaitées', data.dates],
    ['Message', data.message],
  ];
  const body = rows
    .filter(([, v]) => v && v.trim().length > 0)
    .map(([k, v]) => `<tr><td style="padding:6px 12px;font-weight:600;">${k}</td><td style="padding:6px 12px;">${escapeHtml(v!)}</td></tr>`)
    .join('');
  return `
    <div style="font-family:system-ui,sans-serif;color:#0A1A1E;max-width:560px;margin:auto;">
      <h2 style="color:#1B8FA0;border-bottom:2px solid #E8692A;padding-bottom:8px;">Nouvelle demande de devis</h2>
      <table style="width:100%;border-collapse:collapse;background:#EEF5F7;border-radius:8px;overflow:hidden;margin-top:16px;">
        ${body}
      </table>
      <p style="margin-top:16px;color:#7AACB2;font-size:12px;">Envoyé depuis ckim-formation.fr</p>
    </div>
  `;
}

export function devisEmailSubject(data: DevisInput): string {
  return `[C-KIM] Devis — ${data.formation} — ${data.nom}`;
}
