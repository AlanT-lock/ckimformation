import { formatDateTime } from '@/lib/date';
import type { BesoinAnswerSnapshot } from '@/lib/besoins/answers';

/**
 * Réponses à l'analyse des besoins (lecture admin). Sans réponses structurées
 * (anciennes demandes), affiche le texte libre historique.
 */
export function BesoinsAnswersView({
  answers,
  updatedAt,
  legacyText,
}: {
  answers: BesoinAnswerSnapshot[] | null;
  updatedAt?: string | null;
  legacyText?: string | null;
}) {
  if (!answers || answers.length === 0) {
    return (
      <div className="p-4 bg-light rounded border border-dark/10 whitespace-pre-wrap text-sm">
        {legacyText || <em className="text-dark/50">Non renseignée</em>}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <ol className="divide-y divide-dark/10 rounded border border-dark/10 bg-light/40">
        {answers.map((a) => (
          <li key={a.question_id} className="px-4 py-3 text-sm">
            <p className="font-medium text-dark">
              <span className="text-dark/40 mr-1">{a.ordre}.</span>
              {a.libelle}
            </p>
            <p className="mt-1 pl-4 border-l-2 border-teal/30 text-dark/80 whitespace-pre-wrap">
              {a.reponse || <span className="text-dark/40">—</span>}
              {a.precision && <span className="block text-dark/60">Précision : {a.precision}</span>}
            </p>
          </li>
        ))}
      </ol>
      {updatedAt && <p className="text-xs text-dark/50">Réponses enregistrées le {formatDateTime(updatedAt)}.</p>}
    </div>
  );
}
