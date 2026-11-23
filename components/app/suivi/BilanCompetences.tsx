import { NIVEAUX, NIVEAU_LABEL, countNiveaux, type Niveau } from '@/lib/suivi/bilan';

const NIVEAU_BADGE: Record<Niveau, string> = {
  acquise: 'bg-teal/10 text-teal',
  en_cours: 'bg-orange/10 text-orange',
  non_acquise: 'bg-dark/10 text-dark/70',
};

const NIVEAU_ICON: Record<Niveau, string> = {
  acquise: '✓',
  en_cours: '…',
  non_acquise: '✕',
};

export interface BilanCompetenceRow {
  id: string;
  libelle: string;
  /** null : compétence pas encore évaluée par le formateur */
  niveau: Niveau | null;
}

/**
 * Bilan de fin de formation d'un stagiaire : niveau d'acquisition de chaque
 * compétence, attribué par le formateur.
 */
export function BilanCompetences({ titre, competences }: { titre?: string; competences: BilanCompetenceRow[] }) {
  const niveaux = Object.fromEntries(competences.map((c) => [c.id, c.niveau ?? undefined]));
  const counts = countNiveaux(competences.map((c) => c.id), niveaux);

  return (
    <article className="bg-white rounded-lg border border-dark/10 overflow-hidden">
      <header className="px-5 py-3 bg-light/50 flex items-center justify-between gap-3 flex-wrap">
        {titre && <p className="font-medium">{titre}</p>}
        <ul className="flex flex-wrap gap-2 text-xs" aria-label="Répartition par niveau">
          {NIVEAUX.map((n) => (
            <li key={n} className={`px-2 py-0.5 rounded-full font-medium ${NIVEAU_BADGE[n]}`}>
              {counts[n]} {NIVEAU_LABEL[n].toLowerCase()}{counts[n] > 1 && n !== 'en_cours' ? 's' : ''}
            </li>
          ))}
        </ul>
      </header>
      <ul className="divide-y divide-dark/10 text-sm">
        {competences.map((c) => (
          <li key={c.id} className="px-5 py-3 flex items-start justify-between gap-3">
            <span className="min-w-0">{c.libelle}</span>
            {c.niveau ? (
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${NIVEAU_BADGE[c.niveau]}`}>
                <span aria-hidden="true">{NIVEAU_ICON[c.niveau]} </span>
                {NIVEAU_LABEL[c.niveau]}
              </span>
            ) : (
              <span className="shrink-0 text-xs text-dark/40 whitespace-nowrap">Non évaluée</span>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}
