import Link from 'next/link';
import { formatDateLong, formatDateTime, todayIsoParis } from '@/lib/date';
import { canCloseDay, isSessionEditable } from '@/lib/suivi/progress';

export interface JourneeRow {
  date: string;
  termineeAt: string | null;
  competencesCount: number;
}

/** Liste des journées de la session avec le bouton « Terminer la journée ». */
export function JourneesSection({
  sessionId,
  statut,
  journees,
  competencesTotal,
  competencesVues,
}: {
  sessionId: string;
  statut: string;
  journees: JourneeRow[];
  competencesTotal: number;
  competencesVues: number;
}) {
  const today = todayIsoParis();
  const editable = isSessionEditable(statut);

  return (
    <section>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h2 className="font-display text-2xl tracking-wide">Journées de formation</h2>
          <p className="text-xs text-dark/60 mt-1">
            À la fin de chaque journée, coche les compétences vues puis ajoute tes commentaires : les entreprises suivent ainsi
            l&apos;avancée de leurs salariés.
            {competencesTotal > 0 && <> {competencesVues} / {competencesTotal} compétences vues.</>}
          </p>
        </div>
      </div>

      {journees.length === 0 ? (
        <div className="bg-white rounded-lg border border-dark/10 p-6 text-sm text-dark/60">Aucun créneau planifié.</div>
      ) : (
        <ul className="bg-white rounded-lg border border-dark/10 divide-y divide-dark/10">
          {journees.map((j, i) => {
            const started = canCloseDay(j.date, today);
            const href = `/formateur/sessions/${sessionId}/journees/${j.date}`;
            return (
              <li key={j.date} className="flex items-center justify-between gap-3 flex-wrap px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    <span className="text-dark/40 mr-2">J{i + 1}</span>
                    <span className="inline-block first-letter:uppercase">{formatDateLong(j.date)}</span>
                  </p>
                  <p className="text-xs text-dark/60 mt-0.5">
                    {j.termineeAt
                      ? <>Terminée le {formatDateTime(j.termineeAt)} · {j.competencesCount} compétence{j.competencesCount > 1 ? 's' : ''} cochée{j.competencesCount > 1 ? 's' : ''}</>
                      : started ? 'En cours ou à terminer' : 'À venir'}
                  </p>
                </div>
                {j.termineeAt ? (
                  <span className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium bg-teal/10 text-teal">✓ Terminée</span>
                    {editable && (
                      <Link href={href} className="text-xs uppercase tracking-[0.15em] text-teal hover:underline">
                        Modifier
                      </Link>
                    )}
                  </span>
                ) : started && editable ? (
                  <Link
                    href={href}
                    className="inline-flex items-center px-4 py-2 rounded text-sm font-medium bg-orange hover:bg-orange-l text-white transition whitespace-nowrap"
                  >
                    Terminer la journée
                  </Link>
                ) : (
                  <span className="text-xs uppercase tracking-wider text-dark/40">{started ? '—' : 'À venir'}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
