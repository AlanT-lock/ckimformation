'use client';
import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  text: string;
  className?: string;
  staggerDelay?: number;
  delay?: number;
}

export function LetterReveal({ text, className, staggerDelay = 0.04, delay = 0 }: Props) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{text}</span>;

  const letters = Array.from(text);
  return (
    <span className={className} aria-label={text}>
      {letters.map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: delay + i * staggerDelay, ease: 'easeOut' }}
          style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}
