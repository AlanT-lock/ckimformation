'use client';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export function Marquee({ children, speed = 30 }: { children: ReactNode; speed?: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex whitespace-nowrap gap-12"
        animate={reduce ? undefined : { x: ['0%', '-50%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      >
        <div className="flex gap-12 shrink-0">{children}</div>
        <div className="flex gap-12 shrink-0" aria-hidden>{children}</div>
      </motion.div>
    </div>
  );
}
