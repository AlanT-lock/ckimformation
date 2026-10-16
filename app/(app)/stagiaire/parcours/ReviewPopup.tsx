'use client';

const GOOGLE_REVIEW_URL = 'https://g.page/r/CbIN1WQ_itEyEAE/review';
const GOOGLE_REVIEW_FLAG = 'ckim_google_review_clicked';

export const REVIEW_POPUP_FLAG = 'ckim_show_review_popup';

export function ReviewPopup({ onClose }: { onClose: () => void }) {
  function handleReviewClick() {
    try {
      window.localStorage.setItem(GOOGLE_REVIEW_FLAG, String(Date.now()));
    } catch {
      // ignore
    }
    window.open(GOOGLE_REVIEW_URL, '_blank', 'noopener,noreferrer');
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-popup-title"
    >
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center rounded-full text-dark/50 hover:text-dark hover:bg-dark/5 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="mx-auto w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center text-3xl">
          🎓
        </div>
        <h2 id="review-popup-title" className="font-display text-2xl tracking-wide text-dark mt-4">
          Bravo, formation terminée&nbsp;!
        </h2>
        <p className="mt-3 text-sm text-dark/70 leading-relaxed">
          Merci pour votre engagement tout au long de cette formation. Si vous avez quelques secondes,
          un avis Google nous aiderait énormément à faire connaître notre travail — merci d&apos;avance&nbsp;!
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleReviewClick}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-teal hover:bg-teal-l text-white text-sm font-medium transition w-full"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Laisser un avis sur Google
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-dark/50 hover:text-dark transition"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
