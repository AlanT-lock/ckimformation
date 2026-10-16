import { formatDate, formatDateLong } from '@/lib/date';
import type { SuiviSession } from '@/lib/suivi/data';

/** Compétences acquises / à venir puis le détail journée par journée. */
export function SuiviDetail({ suivi, commentairesLabel }: { suivi: SuiviSession; commentairesLabel: string }) {
  const acquises = suivi.competences.filter((c) => c.vueLe);
  const manquantes = suivi.competences.filter((c) => !c.vueLe);

  return (
    <div className="space-y-8">
      {suivi.competences.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-lg border border-teal/30 p-5">
            <h3 className="text-sm font-semibold text-teal">✓ Compétences acquises ({acquises.length})</h3>
            {acquises.length === 0 ? (
              <p className="mt-3 text-sm text-dark/60">Aucune pour le moment.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {acquises.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3">
                    <span>{c.libelle}</span>
                    <span className="text-xs text-dark/40 whitespace-nowrap">{formatDate(c.vueLe)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white rounded-lg border border-dark/10 p-5">
            <h3 className="text-sm font-semibold text-dark/70">○ À venir ({manquantes.length})</h3>
            {manquantes.length === 0 ? (
              <p className="mt-3 text-sm text-dark/60">Toutes les compétences ont été vues.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-dark/70">
                {manquantes.map((c) => <li key={c.id}>{c.libelle}</li>)}
              </ul>
            )}
          </div>
        </section>
      )}

      <section>
        <h3 className="font-display text-2xl tracking-wide">Journée par journée</h3>
        <ol className="mt-4 space-y-4">
          {suivi.journees.map((j, i) => (
            <li key={j.date} className="bg-white rounded-lg border border-dark/10 overflow-hidden">
              <div className={`px-5 py-3 flex items-center justify-between gap-3 flex-wrap ${j.termineeAt ? 'bg-teal/5' : 'bg-light/50'}`}>
                <p className="font-medium">
                  <span className="text-dark/40 mr-2">J{i + 1}</span>
                  <span className="inline-block first-letter:uppercase">{formatDateLong(j.date)}</span>
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium ${
                  j.termineeAt ? 'bg-teal/10 text-teal' : 'bg-dark/10 text-dark/50'
                }`}>
                  {j.termineeAt ? '✓ Terminée' : 'À venir'}
                </span>
              </div>
              {j.termineeAt && (
                <div className="px-5 py-4 space-y-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-dark/50">Compétences vues</p>
                    {j.competences.length === 0 ? (
                      <p className="mt-1 text-dark/60">Aucune compétence cochée ce jour-là.</p>
                    ) : (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {j.competences.map((c) => (
                          <li key={c.id} className="px-2.5 py-1 rounded-full bg-teal/10 text-teal text-xs">{c.libelle}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {j.commentaireGeneral && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-dark/50">Mot du formateur sur la journée</p>
                      <p className="mt-1 whitespace-pre-wrap text-dark/80">{j.commentaireGeneral}</p>
                    </div>
                  )}
                  {j.commentaires.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-dark/50">{commentairesLabel}</p>
                      <ul className="mt-2 space-y-2">
                        {j.commentaires.map((c) => (
                          <li key={c.participantId} className="border-l-2 border-orange/40 pl-3">
                            <p className="font-medium">{c.nom}</p>
                            <p className="whitespace-pre-wrap text-dark/80">{c.commentaire}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
