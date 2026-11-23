import 'server-only';
import { renderToBuffer } from '@react-pdf/renderer';
import {
  buildDocModel,
  stagiaireNomComplet,
  type FinFormationInput,
  type FinFormationKind,
} from '@/lib/fin-formation/model';
import { FinFormationPdf } from './FinFormationPdf';

/** Rend le certificat de réalisation ou l'attestation de fin de formation en PDF. */
export async function renderFinFormationPdf(kind: FinFormationKind, input: FinFormationInput): Promise<Buffer> {
  const model = buildDocModel(kind, input);
  const stagiaireNom = stagiaireNomComplet(input.stagiaire.prenom, input.stagiaire.nom);
  return Buffer.from(await renderToBuffer(<FinFormationPdf model={model} stagiaireNom={stagiaireNom} />));
}
