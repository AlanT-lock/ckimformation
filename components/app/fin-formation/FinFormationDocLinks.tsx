import { KIND_LABEL, fmtIsoDate, type FinFormationKind } from '@/lib/fin-formation/model';

export interface FinFormationDocLink {
  id: string;
  kind: FinFormationKind;
  numero: string;
  dateEdition: string;
}

/**
 * Liens vers les documents de fin de formation d'un stagiaire (certificat de
 * réalisation, attestation). Le téléchargement passe par une route qui vérifie
 * les droits : admin, entreprise ou particulier payeur, stagiaire concerné.
 */
export function FinFormationDocLinks({ docs }: { docs: FinFormationDocLink[] }) {
  if (docs.length === 0) return null;
  return (
    <ul className="space-y-2">
      {docs.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center justify-between gap-3 flex-wrap border border-dark/10 rounded-lg px-4 py-3 bg-white"
        >
          <div className="min-w-0">
            <p className="font-medium">{KIND_LABEL[doc.kind]}</p>
            <p className="text-xs text-dark/60 mt-0.5">
              N° {doc.numero} · édité le {fmtIsoDate(doc.dateEdition)}
            </p>
          </div>
          <a
            href={`/api/documents/download/fin-formation/${doc.id}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center px-3 py-1.5 rounded text-xs font-medium bg-teal hover:bg-teal-l text-white transition whitespace-nowrap"
          >
            Ouvrir le PDF
          </a>
        </li>
      ))}
    </ul>
  );
}
