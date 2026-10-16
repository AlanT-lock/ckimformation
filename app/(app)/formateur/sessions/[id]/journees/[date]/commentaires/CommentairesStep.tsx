'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { saveJourneeCommentaires } from '../../actions';

export interface CommentaireStagiaire {
  participantId: string;
  nom: string;
  entreprise: string;
  commentaire: string;
}

export function CommentairesStep({
  sessionId,
  date,
  initialGeneral,
  stagiaires,
  emailAlreadySent,
}: {
  sessionId: string;
  date: string;
  initialGeneral: string;
  stagiaires: CommentaireStagiaire[];
  emailAlreadySent: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [general, setGeneral] = useState(initialGeneral);
  const [comments, setComments] = useState<Record<string, string>>(
    () => Object.fromEntries(stagiaires.map((s) => [s.participantId, s.commentaire]))
  );

  function save(withComments: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await saveJourneeCommentaires(
        sessionId,
        date,
        withComments ? general : '',
        withComments ? comments : Object.fromEntries(stagiaires.map((s) => [s.participantId, '']))
      );
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/formateur/sessions/${sessionId}`);
      router.refresh();
    });
  }

  const hasAnything = general.trim() || Object.values(comments).some((c) => c.trim());

  return (
    <div className="space-y-6">
      {error && <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">{error}</div>}

      <label className="block bg-white rounded-lg border border-dark/10 p-4">
        <span className="text-sm font-medium">Commentaire général sur la journée</span>
        <span className="block text-xs text-dark/60 mt-0.5">
          Facultatif. Visible par toutes les entreprises ayant des salariés dans cette session.
        </span>
        <textarea
          value={general}
          onChange={(e) => setGeneral(e.target.value)}
          rows={4}
          maxLength={3000}
          placeholder="Déroulé de la journée, dynamique du groupe, points à retenir…"
          className="mt-3 w-full bg-white border border-dark/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
        />
      </label>

      <div>
        <p className="text-sm font-medium">Commentaires par stagiaire</p>
        <p className="text-xs text-dark/60 mt-0.5">
          Facultatif. Seuls les stagiaires rattachés à une entreprise sont listés ; chaque commentaire n&apos;est visible que
          par l&apos;entreprise du stagiaire.
        </p>
        {stagiaires.length === 0 ? (
          <div className="mt-3 bg-white rounded-lg border border-dark/10 p-6 text-sm text-dark/60">
            Aucun stagiaire rattaché à une entreprise dans cette session.
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {stagiaires.map((s) => (
              <li key={s.participantId} className="bg-white rounded-lg border border-dark/10 p-4">
                <label className="block">
                  <span className="text-sm font-medium">{s.nom}</span>
                  <span className="ml-2 text-xs text-dark/50">{s.entreprise}</span>
                  <textarea
                    value={comments[s.participantId] ?? ''}
                    onChange={(e) => setComments((c) => ({ ...c, [s.participantId]: e.target.value }))}
                    rows={2}
                    maxLength={2000}
                    placeholder="Implication, progrès, points d'attention…"
                    className="mt-2 w-full bg-white border border-dark/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!emailAlreadySent && (
        <p className="text-xs text-dark/60">
          En enregistrant, les entreprises reçoivent un email récapitulatif de la journée (une seule fois).
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-3">
        <Button
          variant="secondary"
          onClick={() => router.push(`/formateur/sessions/${sessionId}/journees/${date}`)}
          disabled={pending}
        >
          ← Compétences
        </Button>
        <div className="flex flex-wrap gap-2">
          {!hasAnything && (
            <Button variant="secondary" onClick={() => save(false)} disabled={pending}>
              Terminer sans commentaire
            </Button>
          )}
          {hasAnything && (
            <Button onClick={() => save(true)} disabled={pending}>
              {pending ? 'Enregistrement…' : 'Enregistrer et terminer'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
