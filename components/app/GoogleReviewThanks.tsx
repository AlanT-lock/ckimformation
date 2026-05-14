'use client';

import { useEffect, useState } from 'react';

const FLAG = 'ckim_google_review_clicked';

export function GoogleReviewThanks() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(FLAG);
      if (v) {
        window.localStorage.removeItem(FLAG);
        setShow(true);
      }
    } catch {
      // ignore
    }
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-thanks-title"
    >
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
        <button
          type="button"
          onClick={() => setShow(false)}
          aria-label="Fermer"
          className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center rounded-full text-dark/50 hover:text-dark hover:bg-dark/5 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="mx-auto w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center text-3xl">
          💛
        </div>
        <h2 id="review-thanks-title" className="font-display text-2xl tracking-wide text-dark mt-4">
          Merci infiniment&nbsp;!
        </h2>
        <p className="mt-3 text-sm text-dark/70 leading-relaxed">
          Votre avis compte énormément pour nous et fait toute la différence pour notre organisme.
          Toute l&apos;équipe C-KIM Formation vous remercie chaleureusement.
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShow(false)}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-teal hover:bg-teal-l text-white text-sm font-medium transition"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
