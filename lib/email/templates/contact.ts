import type { ContactEntrepriseInput, ContactParticulierInput } from '@/lib/validation/contact';

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export function contactEntrepriseEmailHtml(d: ContactEntrepriseInput): string {
  const rows: [string, string | undefined][] = [
    ['Type', 'Entreprise'],
    ['Raison sociale', d.raisonSociale],
    ['Nom', d.nom],
    ['Fonction', d.fonction],
    ['Secteur', d.secteur],
    ['Email', d.email],
    ['Téléphone', d.telephone],
    ['Formation', d.formation || 'Pas renseigné'],
    ['Message', d.message],
  ];
  const body = rows.filter(([,v]) => v).map(([k,v]) => `<tr><td style="padding:6px 12px;font-weight:600;">${k}</td><td style="padding:6px 12px;">${escapeHtml(v!)}</td></tr>`).join('');
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;"><h2 style="color:#1B8FA0;">Contact entreprise</h2><table style="width:100%;border-collapse:collapse;background:#EEF5F7;border-radius:8px;overflow:hidden;">${body}</table></div>`;
}

export function contactParticulierEmailHtml(d: ContactParticulierInput): string {
  const rows: [string, string | undefined][] = [
    ['Type', 'Particulier'],
    ['Nom', d.nom],
    ['Email', d.email],
    ['Téléphone', d.telephone],
    ['Formation', d.formation || 'Pas renseigné'],
    ['Message', d.message],
  ];
  const body = rows.filter(([,v]) => v).map(([k,v]) => `<tr><td style="padding:6px 12px;font-weight:600;">${k}</td><td style="padding:6px 12px;">${escapeHtml(v!)}</td></tr>`).join('');
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;"><h2 style="color:#1B8FA0;">Contact particulier</h2><table style="width:100%;border-collapse:collapse;background:#EEF5F7;border-radius:8px;overflow:hidden;">${body}</table></div>`;
}

export function contactSubject(type: 'entreprise' | 'particulier', nom: string): string {
  return `[C-KIM] Contact ${type === 'entreprise' ? 'entreprise' : 'particulier'} — ${nom}`;
}
