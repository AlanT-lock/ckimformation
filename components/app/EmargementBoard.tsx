import { formatDateLong, formatDateTime } from '@/lib/date';
import type { EmargementBoardCreneau, EmargementBoardEntry } from '@/lib/emargements/board';

const FR_TIME = (h: string) => h.slice(0, 5);

export function EmargementBoard({
  creneaux,
  entries,
  formateurName,
}: {
  creneaux: EmargementBoardCreneau[];
  entries: EmargementBoardEntry[];
  formateurName: string;
}) {
  if (creneaux.length === 0) {
    return (
      <p className="bg-white border border-dark/10 rounded-lg p-6 text-sm text-dark/60">
        Aucun créneau pour afficher les émargements.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {creneaux.map((c) => {
        const rows = entries.filter((e) => e.creneauId === c.id);
        const formateur = rows.find((e) => e.role === 'formateur');
        const stagiaires = rows.filter((e) => e.role === 'stagiaire');
        return (
          <div key={c.id} className="bg-white border border-dark/10 rounded-lg p-4 space-y-3">
            <p className="font-medium capitalize">
              {formatDateLong(c.date)}
              <span className="ml-2 text-dark/60 text-sm font-normal">
                {FR_TIME(c.heure_debut)}–{FR_TIME(c.heure_fin)}
              </span>
            </p>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <SignatureCard
                role="formateur"
                name={formateur?.name ?? formateurName}
                signedAt={formateur?.signedAt ?? null}
                signatureDataUrl={formateur?.signatureDataUrl ?? null}
              />
              {stagiaires.map((s) => (
                <SignatureCard
                  key={s.id}
                  role="stagiaire"
                  name={s.name}
                  signedAt={s.signedAt}
                  signatureDataUrl={s.signatureDataUrl}
                />
              ))}
            </ul>
            {stagiaires.length === 0 && (
              <p className="text-xs text-dark/50">Aucun stagiaire inscrit sur cette session.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SignatureCard({
  role,
  name,
  signedAt,
  signatureDataUrl,
}: {
  role: 'formateur' | 'stagiaire';
  name: string;
  signedAt: string | null;
  signatureDataUrl: string | null;
}) {
  const isFormateur = role === 'formateur';
  return (
    <li
      className={`rounded-lg border p-3 space-y-2 ${
        isFormateur
          ? 'border-orange/40 bg-orange/5'
          : 'border-dark/10 bg-light/40'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-sm truncate">{name}</p>
        <span
          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded whitespace-nowrap ${
            isFormateur ? 'bg-orange/20 text-orange' : 'bg-teal/15 text-teal'
          }`}
        >
          {isFormateur ? 'Formateur' : 'Stagiaire'}
        </span>
      </div>
      <div
        className={`h-16 rounded border bg-white flex items-center justify-center overflow-hidden ${
          isFormateur ? 'border-orange/30' : 'border-dark/10'
        }`}
      >
        {signatureDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signatureDataUrl} alt={`Signature de ${name}`} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-xs text-dark/40">Non signé</span>
        )}
      </div>
      <p className="text-[11px] text-dark/50">
        {signedAt ? `Signé le ${formatDateTime(signedAt)}` : 'En attente de signature'}
      </p>
    </li>
  );
}
