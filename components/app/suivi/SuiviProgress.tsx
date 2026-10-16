import { badgesFor, sessionProgress } from '@/lib/suivi/progress';
import type { SuiviSession } from '@/lib/suivi/data';

const DAY_FMT = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'short' });
const dayLabel = (ymd: string) => DAY_FMT.format(new Date(`${ymd}T12:00:00Z`));

export function computeSuivi(suivi: SuiviSession) {
  const competencesVues = suivi.competences.filter((c) => c.vueLe).length;
  const journeesTerminees = suivi.journees.filter((j) => j.termineeAt).length;
  const progress = sessionProgress({
    competencesTotal: suivi.competences.length,
    competencesVues,
    journeesTotal: suivi.journees.length,
    journeesTerminees,
  });
  return { competencesVues, journeesTerminees, ...progress, badges: badgesFor(progress.percent) };
}

/** Jauge + frise des journées + badges (suivi gamifié). */
export function SuiviProgress({ suivi, compact = false }: { suivi: SuiviSession; compact?: boolean }) {
  const s = computeSuivi(suivi);
  const nextBadge = s.badges.find((b) => !b.atteint);

  return (
    <div className="space-y-5">
      {/* Jauge */}
      <div>
        <div className="flex items-end justify-between gap-3">
          <p className="font-display text-4xl tracking-wide text-teal leading-none">{s.percent}&nbsp;%</p>
          <p className="text-xs text-dark/60 text-right">
            {s.basis === 'competences'
              ? <>{s.competencesVues} / {suivi.competences.length} compétences acquises</>
              : <>{s.journeesTerminees} / {suivi.journees.length} journées terminées</>}
          </p>
        </div>
        <div
          className="mt-2 h-3 rounded-full bg-dark/10 overflow-hidden"
          role="progressbar"
          aria-valuenow={s.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Avancée de la formation"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal to-teal-l transition-all"
            style={{ width: `${s.percent}%` }}
          />
        </div>
      </div>

      {/* Frise des journées */}
      <ol className="flex items-start overflow-x-auto pb-1" aria-label="Journées de formation">
        {suivi.journees.map((j, i) => {
          const done = !!j.termineeAt;
          return (
            <li key={j.date} className="flex items-start flex-1 min-w-[64px]">
              <div className="flex flex-col items-center text-center w-full">
                <div className="flex items-center w-full">
                  <span className={`h-0.5 flex-1 ${i === 0 ? 'invisible' : done ? 'bg-teal' : 'bg-dark/15'}`} />
                  <span
                    className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${
                      done ? 'bg-teal text-white' : 'bg-white border-2 border-dark/15 text-dark/40'
                    }`}
                    title={done ? 'Journée terminée' : 'À venir'}
                  >
                    {done ? '✓' : `J${i + 1}`}
                  </span>
                  <span
                    className={`h-0.5 flex-1 ${
                      i === suivi.journees.length - 1 ? 'invisible' : suivi.journees[i + 1]?.termineeAt ? 'bg-teal' : 'bg-dark/15'
                    }`}
                  />
                </div>
                <span className="mt-1 text-[11px] text-dark/50 whitespace-nowrap">{dayLabel(j.date)}</span>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Badges */}
      <ul className={`grid gap-2 ${compact ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'}`} aria-label="Badges">
        {s.badges.map((b) => (
          <li
            key={b.seuil}
            className={`rounded-lg border px-2 py-2 text-center transition ${
              b.atteint ? 'border-orange/40 bg-orange/5' : 'border-dark/10 bg-light/40 opacity-50 grayscale'
            }`}
            title={`${b.label} — ${b.seuil} %`}
          >
            <span className="block text-2xl leading-none" aria-hidden="true">{b.emoji}</span>
            {!compact && <span className="block mt-1 text-[11px] font-medium text-dark/70">{b.label}</span>}
            <span className="block text-[10px] text-dark/40">{b.seuil} %</span>
          </li>
        ))}
      </ul>

      {nextBadge && s.percent > 0 && (
        <p className="text-xs text-dark/60">
          Prochain badge : <strong>{nextBadge.emoji} {nextBadge.label}</strong> à {nextBadge.seuil} %.
        </p>
      )}
      {!nextBadge && <p className="text-xs font-medium text-orange">🎉 Toutes les compétences de la formation ont été vues !</p>}
    </div>
  );
}
