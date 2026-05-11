'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Error boundary global pour /app/(app)/**. Affiche le vrai message + digest
 * pour diagnostiquer rapidement les erreurs Server Components en prod.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[AppError]', error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="font-display text-3xl text-orange">Une erreur est survenue</h1>
      <p className="mt-2 text-sm text-dark/70">
        Le rendu de la page a échoué. Voici les détails pour diagnostic :
      </p>

      <div className="mt-6 bg-white border border-orange/30 rounded-lg p-4 space-y-3 text-sm">
        {error.digest && (
          <div>
            <span className="text-xs uppercase tracking-[0.15em] text-dark/50">Digest</span>
            <p className="font-mono text-dark/80">{error.digest}</p>
          </div>
        )}
        <div>
          <span className="text-xs uppercase tracking-[0.15em] text-dark/50">Message</span>
          <p className="font-mono whitespace-pre-wrap text-dark/80">{error.message || '(message vide)'}</p>
        </div>
        {error.stack && (
          <details>
            <summary className="text-xs uppercase tracking-[0.15em] text-dark/50 cursor-pointer">Stack</summary>
            <pre className="mt-2 text-xs bg-light p-3 rounded overflow-x-auto whitespace-pre-wrap break-all">
              {error.stack}
            </pre>
          </details>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center px-4 py-2 rounded text-sm font-medium bg-teal hover:bg-teal-l text-white"
        >
          Réessayer
        </button>
        <Link
          href="/stagiaire"
          className="inline-flex items-center px-4 py-2 rounded text-sm font-medium bg-white border border-dark/15 hover:border-dark/40 text-dark"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
