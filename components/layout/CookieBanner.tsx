'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const KEY = 'ckim-cookie-accepted';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);
  function accept() {
    localStorage.setItem(KEY, '1');
    setVisible(false);
  }
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-4 inset-x-4 md:left-auto md:right-4 md:max-w-sm bg-dark text-white p-5 rounded-lg shadow-2xl z-[90]"
        >
          <p className="text-sm leading-relaxed">
            Ce site n&apos;utilise aucun cookie de tracking. En continuant, vous acceptez les conditions d&apos;utilisation.
          </p>
          <button onClick={accept} className="mt-4 bg-orange text-white px-4 py-2 rounded text-xs uppercase tracking-wider font-semibold hover:bg-orange-l transition">
            J&apos;ai compris
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
