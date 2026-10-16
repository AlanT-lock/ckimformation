import Link from 'next/link';
import { formatDate } from '@/lib/date';
import type { SuiviSession } from '@/lib/suivi/data';
import { SuiviProgress } from './SuiviProgress';

/** Carte « formation en cours » du tableau de bord entreprise. */
export function SuiviCard({ suivi, stagiaires }: { suivi: SuiviSession; stagiaires: string[] }) {
  const first = suivi.days[0];
  const last = suivi.days[suivi.days.length - 1];
  return (
    <article className="bg-white rounded-xl border border-dark/10 p-5 md:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-orange">Suivi de formation</p>
          <h3 className="font-display text-2xl tracking-wide mt-1">{suivi.formationTitre}</h3>
          <p className="text-xs text-dark/60 mt-1">
            {first && formatDate(first)}
            {last && last !== first && <> → {formatDate(last)}</>}
            {stagiaires.length > 0 && <> · {stagiaires.join(', ')}</>}
          </p>
        </div>
      </div>
      <div className="mt-5">
        <SuiviProgress suivi={suivi} compact />
      </div>
      <div className="mt-5 flex justify-end">
        <Link
          href={`/stagiaire/suivi/${suivi.sessionId}`}
          className="inline-flex items-center px-4 py-2 rounded text-sm font-medium bg-teal hover:bg-teal-l text-white transition"
        >
          Voir le détail →
        </Link>
      </div>
    </article>
  );
}
