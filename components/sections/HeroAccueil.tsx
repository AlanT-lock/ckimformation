'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { LetterReveal } from '@/components/motion/LetterReveal';

export function HeroAccueil() {
  const reduce = useReducedMotion();
  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-dark text-white">
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 90% 70% at 110% 20%, rgba(27,143,160,.30), transparent 55%), radial-gradient(ellipse 70% 80% at -15% 90%, rgba(232,105,42,.18), transparent 50%)',
        }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(90deg,rgba(27,143,160,.08) 1px,transparent 1px),linear-gradient(rgba(27,143,160,.08) 1px,transparent 1px)',
          backgroundSize: '22px 22px',
        }}
        animate={reduce ? undefined : { backgroundPosition: ['0px 0px', '22px 22px'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-teal via-teal-l to-orange" />
      <Container className="relative z-10 flex flex-col items-center justify-center text-center min-h-[92vh] py-24">
        <motion.p
          className="text-xs uppercase tracking-[0.4em] text-teal-l mb-6 flex items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="inline-block w-8 h-[2px] bg-teal-l" />
          Centre de formation certifié Qualiopi — Draguignan (83)
          <span className="inline-block w-8 h-[2px] bg-teal-l" />
        </motion.p>
        <h1 className="font-display text-6xl md:text-8xl lg:text-[120px] leading-[0.88] tracking-wide mb-8">
          <LetterReveal text="FORMER" delay={0.1} /><br />
          <span className="text-teal-l"><LetterReveal text="POUR" delay={0.4} /></span>{' '}
          <LetterReveal text="AGIR" delay={0.6} />
        </h1>
        <motion.p
          className="text-base md:text-lg text-muted max-w-2xl leading-relaxed mb-10 mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          Sécurité au travail · Prévention des risques · Développement humain. 60 à 80 % de pratique, formateurs certifiés INRS, AFNOR et FPA, intervention sur site partout en région PACA.
        </motion.p>
        <motion.div
          className="flex flex-wrap gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <ButtonLink href="/formations" variant="primary">Découvrir les formations</ButtonLink>
          <ButtonLink href="/contact" variant="ghost" className="border-white/40 text-white hover:bg-white hover:text-dark">
            Demander un devis
          </ButtonLink>
        </motion.div>
      </Container>
    </section>
  );
}
