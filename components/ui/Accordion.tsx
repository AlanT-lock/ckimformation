'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Item {
  titre: string;
  points: string[];
}

export function Accordion({ items, color }: { items: Item[]; color: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-lg overflow-hidden border border-light">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-5 text-left"
            aria-expanded={open === i}
          >
            <span className="flex items-center gap-4">
              <span className="font-display text-xl" style={{ color }}>{String(i + 1).padStart(2, '0')}</span>
              <span className="font-sans font-semibold uppercase tracking-wide text-sm">{item.titre}</span>
            </span>
            <span
              className="text-2xl leading-none transition-transform"
              style={{ color, transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)' }}
            >+</span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <ul className="p-5 pt-0 space-y-2">
                  {item.points.map((p, pi) => (
                    <li key={pi} className="flex gap-3 text-sm text-dark/80 leading-relaxed">
                      <span style={{ color }}>›</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
