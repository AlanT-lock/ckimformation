'use client';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitDevis, type ActionResult } from '@/app/actions/devis';

interface ModalCtx {
  open: (formationTitre: string) => void;
  close: () => void;
}

const Ctx = createContext<ModalCtx | null>(null);

export function useDevisModal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDevisModal must be inside <DevisModalProvider>');
  return ctx;
}

export function DevisModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [formation, setFormation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  const handleOpen = useCallback((titre: string) => {
    setFormation(titre);
    setResult(null);
    setOpen(true);
  }, []);
  const handleClose = useCallback(() => setOpen(false), []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const r = await submitDevis(Object.fromEntries(fd));
    setResult(r);
    setSubmitting(false);
  }

  return (
    <Ctx.Provider value={{ open: handleOpen, close: handleClose }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-dark text-white p-6 rounded-t-2xl relative">
                <p className="text-xs uppercase tracking-[0.2em] text-teal-l">Demande de devis</p>
                <h2 className="font-display text-3xl mt-1">{formation}</h2>
                <button onClick={handleClose} aria-label="Fermer" className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl">×</button>
              </div>

              {result?.ok ? (
                <div className="p-8 text-center">
                  <p className="font-display text-2xl text-teal">Demande envoyée ✓</p>
                  <p className="mt-2 text-dark/70">{result.message}</p>
                  <button onClick={handleClose} className="mt-6 px-6 py-2 border border-dark rounded-md text-sm uppercase tracking-wider hover:bg-dark hover:text-white transition">Fermer</button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                  <input type="hidden" name="formation" value={formation} />
                  <input type="text" name="honeypot" tabIndex={-1} autoComplete="off" className="hidden" />
                  <Field name="nom" label="Nom *" error={result?.errors?.nom} />
                  <Field name="email" label="Email *" type="email" error={result?.errors?.email} />
                  <Field name="telephone" label="Téléphone *" error={result?.errors?.telephone} />
                  <Field name="entreprise" label="Entreprise" />
                  <div className="grid grid-cols-2 gap-4">
                    <Field name="nbStagiaires" label="Nb de stagiaires" />
                    <Field name="lieu" label="Lieu" />
                  </div>
                  <Field name="dates" label="Dates souhaitées" />
                  <Textarea name="message" label="Message" />
                  {result?.message && !result.ok && (
                    <p className="text-sm text-red-600">{result.message}</p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-orange text-white px-6 py-3 rounded-md font-sans text-sm font-semibold uppercase tracking-wider hover:bg-orange-l transition disabled:opacity-60"
                  >
                    {submitting ? 'Envoi…' : 'Envoyer la demande'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

function Field({ name, label, type = 'text', error }: { name: string; label: string; type?: string; error?: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.15em] text-dark/60">{label}</span>
      <input name={name} type={type} className="mt-1 w-full border border-light rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal" />
      {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
    </label>
  );
}

function Textarea({ name, label }: { name: string; label: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.15em] text-dark/60">{label}</span>
      <textarea name={name} rows={4} className="mt-1 w-full border border-light rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal" />
    </label>
  );
}
