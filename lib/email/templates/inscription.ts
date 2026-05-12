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

export interface InscriptionCreneauInfo {
  date: string;
  heure_debut: string;
  heure_fin: string;
}

export interface InscriptionParticipantInfo {
  prenom: string;
  nom: string;
  email: string;
}

export interface InscriptionPayerInfo {
  type: 'entreprise' | 'particulier';
  raison_sociale?: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
}

export interface InscriptionSessionInfo {
  formation_titre: string;
  creneaux: InscriptionCreneauInfo[];
  adresse?: { rue?: string | null; code_postal?: string | null; ville?: string | null; complement?: string | null } | null;
  formateur_nom?: string | null;
}

export interface DemandeAdminEmailInput {
  inscriptionId: string;
  session: InscriptionSessionInfo;
  payer: InscriptionPayerInfo;
  participants: InscriptionParticipantInfo[];
  analyseBesoins: string;
  adminUrl: string;
}

function creneauxRows(creneaux: InscriptionCreneauInfo[]): string {
  return creneaux
    .map(
      (c) =>
        `<li>${escapeHtml(fmtDate(c.date))} — ${escapeHtml(c.heure_debut.slice(0, 5))} à ${escapeHtml(c.heure_fin.slice(0, 5))}</li>`
    )
    .join('');
}

function adresseLine(adresse: InscriptionSessionInfo['adresse']): string {
  if (!adresse) return 'À préciser';
  const parts = [adresse.rue, adresse.complement, [adresse.code_postal, adresse.ville].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  return parts || 'À préciser';
}

function participantsRows(participants: InscriptionParticipantInfo[]): string {
  return participants
    .map(
      (p) =>
        `<tr><td style="padding:6px 12px;">${escapeHtml(p.prenom)} ${escapeHtml(p.nom)}</td><td style="padding:6px 12px;">${escapeHtml(p.email)}</td></tr>`
    )
    .join('');
}

export function demandeAdminEmailHtml(d: DemandeAdminEmailInput): string {
  const payerLabel =
    d.payer.type === 'entreprise'
      ? `${d.payer.raison_sociale ?? d.payer.full_name} (contact : ${d.payer.full_name})`
      : d.payer.full_name;

  return `<div style="font-family:system-ui,sans-serif;max-width:640px;margin:auto;color:#0f172a;">
  <h2 style="color:#1B8FA0;margin:0 0 8px;">Nouvelle demande d'inscription</h2>
  <p style="margin:0 0 24px;color:#475569;">Une demande vient d'être déposée. Merci de la vérifier et de confirmer après contact pour le paiement.</p>

  <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#475569;">Demandeur</h3>
  <table style="width:100%;border-collapse:collapse;background:#EEF5F7;border-radius:8px;overflow:hidden;margin-bottom:24px;">
    <tr><td style="padding:6px 12px;font-weight:600;">Type</td><td style="padding:6px 12px;">${d.payer.type === 'entreprise' ? 'Entreprise' : 'Particulier'}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:600;">Nom</td><td style="padding:6px 12px;">${escapeHtml(payerLabel)}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:600;">Email</td><td style="padding:6px 12px;">${escapeHtml(d.payer.email)}</td></tr>
    ${d.payer.phone ? `<tr><td style="padding:6px 12px;font-weight:600;">Téléphone</td><td style="padding:6px 12px;">${escapeHtml(d.payer.phone)}</td></tr>` : ''}
  </table>

  <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#475569;">Session</h3>
  <table style="width:100%;border-collapse:collapse;background:#EEF5F7;border-radius:8px;overflow:hidden;margin-bottom:24px;">
    <tr><td style="padding:6px 12px;font-weight:600;">Formation</td><td style="padding:6px 12px;">${escapeHtml(d.session.formation_titre)}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:600;">Lieu</td><td style="padding:6px 12px;">${escapeHtml(adresseLine(d.session.adresse))}</td></tr>
    ${d.session.formateur_nom ? `<tr><td style="padding:6px 12px;font-weight:600;">Formateur</td><td style="padding:6px 12px;">${escapeHtml(d.session.formateur_nom)}</td></tr>` : ''}
    <tr><td style="padding:6px 12px;font-weight:600;vertical-align:top;">Créneaux</td><td style="padding:6px 12px;"><ul style="margin:0;padding-left:18px;">${creneauxRows(d.session.creneaux)}</ul></td></tr>
  </table>

  <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#475569;">Participants (${d.participants.length})</h3>
  <table style="width:100%;border-collapse:collapse;background:#EEF5F7;border-radius:8px;overflow:hidden;margin-bottom:24px;">
    <thead><tr><th style="padding:6px 12px;text-align:left;font-weight:600;">Nom complet</th><th style="padding:6px 12px;text-align:left;font-weight:600;">Email</th></tr></thead>
    <tbody>${participantsRows(d.participants)}</tbody>
  </table>

  <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#475569;">Analyse des besoins</h3>
  <div style="padding:12px;background:#FFF8E1;border-left:4px solid #F59E0B;border-radius:4px;margin-bottom:24px;white-space:pre-wrap;">${escapeHtml(d.analyseBesoins)}</div>

  <p style="margin:24px 0 0;">
    <a href="${d.adminUrl}" style="display:inline-block;padding:10px 18px;background:#1B8FA0;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Ouvrir la demande dans l'espace admin</a>
  </p>
</div>`;
}

export function demandeAdminEmailSubject(payer: InscriptionPayerInfo, formationTitre: string): string {
  const name = payer.type === 'entreprise' ? payer.raison_sociale ?? payer.full_name : payer.full_name;
  return `[C-KIM] Demande d'inscription — ${name} — ${formationTitre}`;
}

export interface ConfirmationEmailInput {
  payer: InscriptionPayerInfo;
  session: InscriptionSessionInfo;
  participants: InscriptionParticipantInfo[];
  /** URL vers l'espace stagiaire si des documents ont été joints */
  documentsUrl?: string;
  /** Nombre de docs joints par l'admin (pour adapter le wording) */
  adminDocsCount?: number;
}

export function confirmationEmailHtml(d: ConfirmationEmailInput): string {
  const docsBlock = (d.adminDocsCount && d.adminDocsCount > 0 && d.documentsUrl)
    ? `<h3 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#475569;">Documents joints</h3>
       <p style="margin:0 0 12px;">
         ${d.adminDocsCount} document${d.adminDocsCount > 1 ? 's' : ''} ${d.adminDocsCount > 1 ? 'ont' : 'a'} été joint${d.adminDocsCount > 1 ? 's' : ''} à votre confirmation
         (convention, programme, livret d'accueil, etc.). Vous pouvez les consulter et les télécharger depuis votre espace.
       </p>
       <p style="margin:0 0 16px;">
         <a href="${d.documentsUrl}" style="display:inline-block;padding:10px 18px;background:#1B8FA0;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Voir mes documents</a>
       </p>`
    : '';

  return `<div style="font-family:system-ui,sans-serif;max-width:640px;margin:auto;color:#0f172a;">
  <h2 style="color:#1B8FA0;margin:0 0 8px;">Inscription confirmée</h2>
  <p style="margin:0 0 16px;">Bonjour ${escapeHtml(d.payer.full_name)},</p>
  <p style="margin:0 0 24px;">Votre inscription à la formation <strong>${escapeHtml(d.session.formation_titre)}</strong> est confirmée. Voici le rappel des informations.</p>

  <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#475569;">Session</h3>
  <table style="width:100%;border-collapse:collapse;background:#EEF5F7;border-radius:8px;overflow:hidden;margin-bottom:24px;">
    <tr><td style="padding:6px 12px;font-weight:600;">Formation</td><td style="padding:6px 12px;">${escapeHtml(d.session.formation_titre)}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:600;">Lieu</td><td style="padding:6px 12px;">${escapeHtml(adresseLine(d.session.adresse))}</td></tr>
    ${d.session.formateur_nom ? `<tr><td style="padding:6px 12px;font-weight:600;">Formateur</td><td style="padding:6px 12px;">${escapeHtml(d.session.formateur_nom)}</td></tr>` : ''}
    <tr><td style="padding:6px 12px;font-weight:600;vertical-align:top;">Créneaux</td><td style="padding:6px 12px;"><ul style="margin:0;padding-left:18px;">${creneauxRows(d.session.creneaux)}</ul></td></tr>
  </table>

  <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#475569;">Participant${d.participants.length > 1 ? 's' : ''} inscrit${d.participants.length > 1 ? 's' : ''}</h3>
  <table style="width:100%;border-collapse:collapse;background:#EEF5F7;border-radius:8px;overflow:hidden;margin-bottom:24px;">
    ${participantsRows(d.participants)}
  </table>

  ${docsBlock}

  <p style="margin:24px 0 0;color:#475569;">Pour toute question, contactez-nous à ckimsecuriteformation@gmail.com.</p>
</div>`;
}

export function confirmationEmailSubject(formationTitre: string): string {
  return `[C-KIM] Inscription confirmée — ${formationTitre}`;
}

export interface RefusEmailInput {
  payer: InscriptionPayerInfo;
  session: InscriptionSessionInfo;
  motif: string;
  documentsUrl?: string;
  adminDocsCount?: number;
}

export function refusEmailHtml(d: RefusEmailInput): string {
  const docsBlock = (d.adminDocsCount && d.adminDocsCount > 0 && d.documentsUrl)
    ? `<h3 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#475569;">Documents joints</h3>
       <p style="margin:0 0 12px;">
         ${d.adminDocsCount} document${d.adminDocsCount > 1 ? 's' : ''} ${d.adminDocsCount > 1 ? 'sont' : 'est'} disponible${d.adminDocsCount > 1 ? 's' : ''} dans votre espace.
       </p>
       <p style="margin:0 0 16px;">
         <a href="${d.documentsUrl}" style="display:inline-block;padding:10px 18px;background:#1B8FA0;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Voir mes documents</a>
       </p>`
    : '';

  return `<div style="font-family:system-ui,sans-serif;max-width:640px;margin:auto;color:#0f172a;">
  <h2 style="color:#1B8FA0;margin:0 0 8px;">Demande d'inscription non retenue</h2>
  <p style="margin:0 0 16px;">Bonjour ${escapeHtml(d.payer.full_name)},</p>
  <p style="margin:0 0 16px;">Nous avons bien reçu votre demande d'inscription à la formation <strong>${escapeHtml(d.session.formation_titre)}</strong>. Malheureusement, nous ne pouvons pas la retenir pour cette session.</p>

  <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;color:#475569;">Motif</h3>
  <div style="padding:12px;background:#FEF2F2;border-left:4px solid #DC2626;border-radius:4px;margin-bottom:24px;white-space:pre-wrap;">${escapeHtml(d.motif)}</div>

  ${docsBlock}

  <p style="margin:0 0 16px;">N'hésitez pas à nous contacter pour échanger sur les prochaines sessions ou trouver une alternative.</p>
  <p style="margin:0;color:#475569;">ckimsecuriteformation@gmail.com</p>
</div>`;
}

export function refusEmailSubject(formationTitre: string): string {
  return `[C-KIM] Demande d'inscription — ${formationTitre}`;
}
