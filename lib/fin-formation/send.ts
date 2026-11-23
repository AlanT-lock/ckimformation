import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { BUCKET_FIN_FORMATION } from '@/lib/storage/documents';
import { sendAndLog, type EmailAttachment } from '@/lib/email/log';
import {
  finFormationEntrepriseHtml,
  finFormationEntrepriseSubject,
  finFormationStagiaireHtml,
  finFormationStagiaireSubject,
} from '@/lib/email/templates/fin-formation';
import { renderFinFormationPdf } from '@/lib/pdf/render-fin-formation';
import { todayIsoParis } from '@/lib/date';
import { siteUrl } from '@/lib/site-url';
import { buildFinFormationInput, loadFinFormationSession, type FinFormationDocRef } from './data';
import { FIN_FORMATION_KINDS, documentFileName, formatNumero, type FinFormationKind } from './model';

// Émission des documents de fin de formation : génération du PDF, numérotation,
// dépôt dans le bucket privé, puis e-mails. Appelé uniquement depuis des server
// actions qui ont déjà vérifié le rôle admin.

/** Au-delà, les PDF ne sont plus joints à l'e-mail de l'entreprise (lien seul). */
const MAX_ATTACHMENTS_BYTES = 15 * 1024 * 1024;

export type StagiaireSendResult =
  | {
      ok: true;
      /** true : e-mail envoyé au stagiaire ; false : documents déposés sans e-mail. */
      emailed: boolean;
      /** Renseigné quand l'e-mail n'a pas pu partir (les documents sont déposés). */
      emailError?: string;
    }
  | { ok: false; error: string };

function orderedKinds(kinds: FinFormationKind[]): FinFormationKind[] {
  return FIN_FORMATION_KINDS.filter((k) => kinds.includes(k));
}

/**
 * Génère, numérote et dépose les documents d'un stagiaire, puis les lui envoie
 * par e-mail. Un document déjà émis garde son numéro : son fichier est
 * régénéré (date d'édition du jour, niveaux de compétences à jour).
 */
export async function issueDocumentsForStagiaire(
  sessionId: string,
  participantId: string,
  kinds: FinFormationKind[],
  sentBy: string | null
): Promise<StagiaireSendResult> {
  const wanted = orderedKinds(kinds);
  if (wanted.length === 0) return { ok: false, error: 'Aucun document sélectionné.' };

  const session = await loadFinFormationSession(sessionId);
  if (!session) return { ok: false, error: 'Session introuvable.' };
  if (!session.terminee) return { ok: false, error: "La session n'est pas terminée." };
  if (!session.dateDebut || !session.dateFin) return { ok: false, error: "La session n'a aucun créneau." };
  const participant = session.participants.find((p) => p.id === participantId);
  if (!participant) return { ok: false, error: "Ce stagiaire n'est pas confirmé sur la session." };

  const admin = createAdminClient();
  const dateEdition = todayIsoParis();
  const annee = Number(dateEdition.slice(0, 4));
  const attachments: EmailAttachment[] = [];

  for (const kind of wanted) {
    let numero = participant.docs[kind]?.numero ?? null;
    if (!numero) {
      const { data: next, error: numError } = await admin.rpc('next_fin_formation_numero', {
        p_kind: kind,
        p_annee: annee,
      });
      if (numError || typeof next !== 'number') {
        console.error('[fin-formation] numérotation impossible', numError);
        return {
          ok: false,
          error:
            'Numérotation impossible : la migration « documents de fin de formation » est-elle appliquée dans Supabase ?',
        };
      }
      numero = formatNumero(kind, annee, next);
    }

    const buffer = await renderFinFormationPdf(kind, buildFinFormationInput(session, participant, numero, dateEdition));
    const fileName = documentFileName(kind, participant.nomComplet, numero);
    const storagePath = `${sessionId}/${participantId}/${numero}.pdf`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET_FIN_FORMATION)
      .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true });
    if (uploadError) {
      console.error('[fin-formation] dépôt du PDF impossible', uploadError);
      return { ok: false, error: `Dépôt du document impossible : ${uploadError.message}` };
    }

    const { error: rowError } = await admin.from('fin_formation_documents').upsert(
      {
        session_id: sessionId,
        inscription_participant_id: participantId,
        kind,
        numero,
        storage_path: storagePath,
        file_name: fileName,
        file_size: buffer.length,
        date_edition: dateEdition,
        sent_at: new Date().toISOString(),
        sent_by: sentBy,
        emailed_to: participant.email || null,
      },
      { onConflict: 'inscription_participant_id,kind' }
    );
    if (rowError) {
      console.error('[fin-formation] enregistrement impossible', rowError);
      return { ok: false, error: `Enregistrement du document impossible : ${rowError.message}` };
    }

    attachments.push({ filename: fileName, content: buffer, contentType: 'application/pdf' });
  }

  if (!participant.email) return { ok: true, emailed: false };

  const sent = await sendAndLog({
    kind: 'documents_fin_formation',
    to: participant.email,
    subject: finFormationStagiaireSubject(session.formationTitre),
    html: finFormationStagiaireHtml({
      prenom: participant.prenom,
      formationTitre: session.formationTitre,
      dateDebut: session.dateDebut,
      dateFin: session.dateFin,
      kinds: wanted,
      espaceUrl: participant.profileId ? `${siteUrl()}/stagiaire/parcours` : null,
    }),
    toProfileId: participant.profileId,
    refTable: 'inscription_participants',
    refId: participantId,
    metadata: { sessionId, formationTitre: session.formationTitre, kinds: wanted },
    attachments,
  });
  if (!sent.ok) return { ok: true, emailed: false, emailError: sent.error };
  return { ok: true, emailed: true };
}

export interface CompanyRecapResult {
  /** Entreprises à qui le récapitulatif a été envoyé. */
  sent: string[];
  /** Entreprises pour lesquelles l'envoi a échoué. */
  failed: Array<{ entreprise: string; error: string }>;
}

/**
 * Envoie à chaque entreprise UN e-mail récapitulatif avec les documents de ses
 * salariés (ceux qui viennent d'être émis), en pièces jointes.
 */
export async function sendCompanyRecaps(
  sessionId: string,
  participantIds: string[],
  kinds: FinFormationKind[]
): Promise<CompanyRecapResult> {
  const result: CompanyRecapResult = { sent: [], failed: [] };
  const wanted = orderedKinds(kinds);
  const session = await loadFinFormationSession(sessionId);
  if (!session || wanted.length === 0) return result;

  const selected = new Set(participantIds);
  interface Group {
    payerProfileId: string;
    raisonSociale: string;
    email: string;
    inscriptionIds: Set<string>;
    stagiaires: string[];
    docs: FinFormationDocRef[];
  }
  const groups = new Map<string, Group>();
  for (const p of session.participants) {
    if (!selected.has(p.id) || !p.entreprise) continue;
    const docs = wanted.map((k) => p.docs[k]).filter((d): d is FinFormationDocRef => !!d);
    if (docs.length === 0) continue;
    const g = groups.get(p.entreprise.payerProfileId) ?? {
      payerProfileId: p.entreprise.payerProfileId,
      raisonSociale: p.entreprise.raisonSociale,
      email: p.entreprise.email,
      inscriptionIds: new Set<string>(),
      stagiaires: [],
      docs: [],
    };
    g.inscriptionIds.add(p.inscriptionId);
    g.stagiaires.push(p.nomComplet);
    g.docs.push(...docs);
    groups.set(g.payerProfileId, g);
  }

  const admin = createAdminClient();
  for (const g of groups.values()) {
    if (!g.email) {
      result.failed.push({ entreprise: g.raisonSociale, error: "Pas d'adresse e-mail pour le compte entreprise." });
      continue;
    }

    // Pièces jointes : les PDF tels qu'ils viennent d'être déposés.
    let attachments: EmailAttachment[] = [];
    let total = 0;
    let complete = true;
    for (const doc of g.docs) {
      const { data: blob, error } = await admin.storage.from(BUCKET_FIN_FORMATION).download(doc.storagePath);
      if (error || !blob) {
        console.error('[fin-formation] lecture du PDF impossible', error);
        complete = false;
        break;
      }
      const content = Buffer.from(await blob.arrayBuffer());
      total += content.length;
      if (total > MAX_ATTACHMENTS_BYTES) {
        complete = false;
        break;
      }
      attachments.push({ filename: doc.fileName, content, contentType: 'application/pdf' });
    }
    if (!complete) attachments = [];

    const espaceUrl =
      g.inscriptionIds.size === 1
        ? `${siteUrl()}/stagiaire/inscriptions/${[...g.inscriptionIds][0]}`
        : `${siteUrl()}/stagiaire/inscriptions`;

    const sent = await sendAndLog({
      kind: 'documents_fin_formation',
      to: g.email,
      subject: finFormationEntrepriseSubject(session.formationTitre),
      html: finFormationEntrepriseHtml({
        raisonSociale: g.raisonSociale,
        formationTitre: session.formationTitre,
        dateDebut: session.dateDebut,
        dateFin: session.dateFin,
        kinds: wanted,
        stagiaires: g.stagiaires,
        attached: attachments.length > 0,
        espaceUrl,
      }),
      toProfileId: g.payerProfileId,
      refTable: 'sessions',
      refId: sessionId,
      metadata: { sessionId, formationTitre: session.formationTitre, kinds: wanted, stagiaires: g.stagiaires.length },
      attachments,
    });
    if (sent.ok) result.sent.push(g.raisonSociale);
    else result.failed.push({ entreprise: g.raisonSociale, error: sent.error });
  }
  return result;
}
