import 'server-only';
import { renderToBuffer } from '@react-pdf/renderer';
import { ConvocationPdf, type ConvocationPdfData } from './ConvocationPdf';
import {
  ORGANISME,
  logoUrl,
  loadParticipantContext,
  loadSessionCreneaux,
  safePdfFilename,
} from './data';

export interface RenderedConvocation {
  buffer: Buffer;
  filename: string;
  data: ConvocationPdfData;
  email: string;
  profileId: string | null;
  formationTitre: string;
  lieu: string;
}

export async function renderConvocationPdf(
  sessionId: string,
  participantId: string
): Promise<RenderedConvocation | null> {
  const ctx = await loadParticipantContext(sessionId, participantId);
  if (!ctx) return null;

  const creneaux = await loadSessionCreneaux(sessionId);
  const data: ConvocationPdfData = {
    logoUrl: logoUrl(),
    organisme: {
      nomComplet: ORGANISME.nomComplet,
      siret: ORGANISME.siret,
      adresse: ORGANISME.adresse,
      nda: ORGANISME.nda,
      telephone: ORGANISME.telephone,
      email: ORGANISME.email,
    },
    stagiaire: { prenom: ctx.prenom, nom: ctx.nom },
    formationTitre: ctx.formationTitre,
    lieu: ctx.session.lieu,
    creneaux,
    emittedAt: new Date().toISOString(),
  };

  const buffer = Buffer.from(await renderToBuffer(<ConvocationPdf data={data} />));
  const namePart = safePdfFilename(`${ctx.prenom}-${ctx.nom}`.trim() || ctx.nomComplet) || 'stagiaire';
  const filename = `convocation-${namePart}-${sessionId.slice(0, 8)}.pdf`;

  return {
    buffer,
    filename,
    data,
    email: ctx.email,
    profileId: ctx.profileId,
    formationTitre: ctx.formationTitre,
    lieu: ctx.session.lieu,
  };
}
